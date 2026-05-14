import { useEffect, useState, useRef } from 'react'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [showColManager, setShowColManager] = useState(false)
  
  const [columns, setColumns] = useState([
    { label: "ĮRANGOS PAVADINIMAS", key: "Įrangos pavadinimas", visible: true },
    { label: "SERIJOS NUMERIS", key: "Serijos numeris", visible: true },
    { label: "PRIŽIŪRI", key: "Prižiūri", visible: true },
    { label: "PERIODAS", key: "Patikr. Periodiškumas", visible: true },
    { label: "PASK. PATIKRA", key: "Patikros data", visible: true },
    { label: "SEKANTI PATIKRA", key: "Sekanti patikra", visible: true },
    { label: "ATK. PERIODAS", key: "Atk. Periodas", visible: true },
    { label: "KOMENTARAS", key: "Komentaras", visible: true },
    { label: "SUTARTIS YRA/NĖRA", key: "Sutartis YRA/NĖRA", visible: true }
  ]);

  const [widths, setWidths] = useState({
    "Įrangos pavadinimas": 220, "Serijos numeris": 140, "Prižiūri": 120, 
    "Patikr. Periodiškumas": 110, "Patikros data": 120, "Sekanti patikra": 120, 
    "Atk. Periodas": 120, "Komentaras": 200, "Sutartis YRA/NĖRA": 140
  });

  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudWNydHJqYW9ha2FjaHNydWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzA5NjgsImV4cCI6MjA5MzcwNjk2OH0.srfXrYR5MCzUMBwV-mm7mkiepg2ATOW2WsG8ldm920k'
  const BASE_URL = 'https://enucrtrjaoakachsrubi.supabase.co/rest/v1/equipment'

  useEffect(() => { 
    fetchData() 
    // eslint-disable-next-line
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const response = await fetch(`${BASE_URL}?select=*&order=id.desc`, { 
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } 
      })
      const data = await response.json()
      setEquipment(data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleAddRow = async () => {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ "Kliento pavadinimas": "Naujas Klientas", "Atlikta": "Ne" })
      });
      if (res.ok) {
        const [newItem] = await res.json();
        setEquipment([newItem, ...equipment]);
      }
    } catch (err) { alert(err.message) }
  };

  const handleSave = async (id, field, value) => {
    let updates = { [field]: value };
    const currentItem = equipment.find(item => item.id === id);

    if (field === "Atlikta" && value === "Taip") {
      const today = new Date();
      updates["Patikros data"] = today.toISOString().split('T')[0];
      const period = currentItem["Patikr. Periodiškumas"]?.toString().toLowerCase() || "";
      let nextDate = new Date(today);
      if (period.includes("1") || period.includes("metus") || period.includes("12")) nextDate.setFullYear(nextDate.getFullYear() + 1);
      else if (period.includes("2") || period.includes("6")) nextDate.setMonth(nextDate.getMonth() + 6);
      else if (period.includes("4") || period.includes("3")) nextDate.setMonth(nextDate.getMonth() + 3);
      else nextDate.setFullYear(nextDate.getFullYear() + 1);
      updates["Sekanti patikra"] = nextDate.toISOString().split('T')[0];
    }

    try {
      await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      setEquipment(equipment.map(item => item.id === id ? { ...item, ...updates } : item));
      setEditingCell(null);
    } catch (err) { console.error(err) }
  };

  const moveColumn = (index, direction) => {
    const newCols = [...columns];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    setColumns(newCols);
  };

  const toggleColumn = (key) => setColumns(columns.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  const deleteColumn = (key) => window.confirm(`Pašalinti stulpelį?`) && setColumns(columns.filter(c => c.key !== key));
  
  const handleDeleteRow = async (id) => {
    if (!window.confirm("Ištrinti įrašą?")) return;
    await fetch(`${BASE_URL}?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
    setEquipment(prev => prev.filter(item => item.id !== id));
  };

  const resizerRef = useRef({ x: 0, width: 0, key: null });

  const onMouseMove = (e) => {
    if (!resizerRef.current.key) return;
    const newWidth = Math.max(30, resizerRef.current.width + (e.clientX - resizerRef.current.x));
    setWidths(prev => ({ ...prev, [resizerRef.current.key]: newWidth }));
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    resizerRef.current.key = null;
  };

  const onMouseDown = (e, key) => {
    resizerRef.current = { x: e.clientX, width: widths[key], key };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const visibleCols = columns.filter(c => c.visible);
  const filteredData = equipment.filter(item => (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(searchTerm.toLowerCase()));

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden', position: 'fixed', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        /* Žalias Meniu Baras - dabar prigludęs prie pat viršaus */
        .main-header { 
          height: 90px; 
          display: flex; 
          padding: 0 30px; 
          background: #1c4e43; 
          align-items: center; 
          flex-shrink: 0;
        }

        /* Navigacijos meniu kairėje pusėje (nes logotipas pašalintas) */
        .nav-menu { display: flex; gap: 15px; color: #ffffff; font-size: 13px; font-weight: bold; align-items: center; width: 100%; }
        .nav-item { cursor: pointer; opacity: 0.9; text-transform: uppercase; white-space: nowrap; letter-spacing: 0.5px; }
        .nav-item:hover { opacity: 1; color: #b39359; }
        .nav-separator { color: rgba(255,255,255,0.3); }

        /* Integruota paieška dešinėje */
        .search-container-right { margin-left: auto; display: flex; align-items: center; }
        .search-box-embedded {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 8px 15px;
          color: white;
          font-size: 13px;
          outline: none;
          width: 240px;
        }
        .search-box-embedded::placeholder { color: rgba(255,255,255,0.5); }

        /* CRM Lentelės konteineris - išplėstas per visą plotį */
        .crm-card-wrapper {
          flex: 1;
          margin: 0; /* Pašalinti tarpai iš kraštų */
          background: #ffffff;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border-top: 1px solid #dcdfe6;
        }

        .table-wrap { 
          flex: 1; 
          overflow: auto; 
          width: 100vw;
        }

        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        
        /* Juodos Antraštės */
        th { 
          background: #232323; 
          color: #ffffff !important; 
          position: sticky; 
          top: 0; 
          zIndex: 30; 
          font-size: 12px; 
          font-weight: bold;
          text-align: center;
          padding: 16px 5px;
          border-right: 1px solid #3d3d3d;
          border-bottom: 2px solid #111111;
        }
        
        td { padding: 0; border-right: 1px solid #e3e7eb; border-bottom: 1px solid #e3e7eb; position: relative; background: #ffffff; }
        
        /* Eilučių stiliai */
        tr:nth-child(even) td { background-color: #f7f9fa; }
        tr:hover td { background-color: #edf2f7 !important; }
        
        .row-overdue td { background-color: #fff0f0 !important; }
        .text-overdue { color: #d32f2f !important; font-weight: bold; }
        
        .cell-content { padding: 12px 10px; font-size: 13px; color: #232323; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 6px; cursor: col-resize; z-index: 31; }
        .cell-edit { width: 100%; border: 2px solid #1c4e43; padding: 6px; font-size: 12px; outline: none; box-sizing: border-box; }
        
        /* Veiksmų mygtukai */
        .action-btn { border: none; background: none; cursor: pointer; font-size: 14px; margin: 0 6px; transition: transform 0.1s; }
        .action-btn:hover { transform: scale(1.15); }
        .btn-del { color: #e30613; }
        .btn-edit-icon { color: #555555; }
      `}</style>

      {/* Žalias Meniu Baras */}
      <div className="main-header">
        <div className="nav-menu">
          <span className="nav-item" onClick={() => setShowColManager(!showColManager)}>STULPELIAI</span>
          <span className="nav-separator">|</span>
          <span className="nav-item" onClick={handleAddRow} style={{ color: '#b39359' }}>+ NAUJAS ĮRAŠAS</span>
          
          <div className="search-container-right">
            <input className="search-box-embedded" placeholder="🔍 Filtruoti pagal klientą..." onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Pagrindinis CRM Lentelės Rėmas (Per visą plotį) */}
      <div className="crm-card-wrapper">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}><div className="cell-content" style={{textAlign: 'center'}}>#</div></th>
                {visibleCols.map(col => (
                  <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                      {col.label}
                      <div style={{ fontSize: '9px', opacity: 0.3 }}>
                        <span style={{cursor:'pointer', marginRight