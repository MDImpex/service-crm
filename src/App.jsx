import { useEffect, useState, useRef } from 'react'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [globalSearch, setGlobalSearch] = useState('') 
  const [editingCell, setEditingCell] = useState(null)
  const [showColManager, setShowColManager] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [history, setHistory] = useState([])

  const defaultColumns = [
    { label: "MONTAVIMO DATA", key: "Montavimo data", visible: true },
    { label: "ĮM. KODAS", key: "Kliento įmonės kodas", visible: true }, 
    { label: "KLIENTAS", key: "Kliento pavadinimas", visible: true },
    { label: "ADRESAS", key: "Adresas", visible: true },
    { label: "ĮRANGOS PAVADINIMAS", key: "Įrangos pavadinimas", visible: true },
    { label: "SERIJOS NUMERIS", key: "Serijos numeris", visible: true },
    { label: "IŠKVIETIMAI", key: "Prižiūri", visible: true }, 
    { label: "PERIODAS", key: "Patikr. Periodiškumas", visible: true },
    { label: "PASK. PATIKRA", key: "Patikros data", visible: true },
    { label: "SEKANTI PATIKRA", key: "Sekanti patikra", visible: true },
    { label: "ATK. PERIODAS", key: "Atk. Periodas", visible: true },
    { label: "KOMENTARAS", key: "Komentaras", visible: true },
    { label: "SUTARTIS YRA/NĖRA", key: "Sutartis YRA/NĖRA", visible: true },
    { label: "ATLIKTA", key: "Atlikta", visible: true }
  ];

  const [columns, setColumns] = useState(() => {
    const savedCols = localStorage.getItem('crm_columns')
    if (savedCols) {
      const parsed = JSON.parse(savedCols);
      const hasOldLabel = parsed.some(c => c.key === "Kliento įmonės kodas" && c.label !== "ĮM. KODAS");
      if (hasOldLabel) {
        localStorage.removeItem('crm_columns');
        return defaultColumns;
      }
      return parsed;
    }
    return defaultColumns;
  });

  const [widths, setWidths] = useState(() => {
    const savedWidths = localStorage.getItem('crm_widths')
    return savedWidths ? JSON.parse(savedWidths) : {
      "Montavimo data": 120, "Kliento įmonės kodas": 90, "Kliento pavadinimas": 160,
      "Adresas": 180, "Įrangos pavadinimas": 160, "Serijos numeris": 120,
      "Prižiūri": 120, "Patikr. Periodiškumas": 90, "Patikros data": 110, 
      "Sekanti patikra": 110, "Atk. Periodas": 100, "Komentaras": 180, "Sutartis YRA/NĖRA": 120, "Atlikta": 100
    }
  });

  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudWNydHJqYW9ha2FjaHNydWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzA5NjgsImV4cCI6MjA5MzcwNjk2OH0.srfXrYR5MCzUMBwV-mm7mkiepg2ATOW2WsG8ldm920k'
  const BASE_URL = 'https://enucrtrjaoakachsrubi.supabase.co/rest/v1/equipment'

  useEffect(() => {
    localStorage.setItem('crm_columns', JSON.stringify(columns))
  }, [columns])

  useEffect(() => {
    localStorage.setItem('crm_widths', JSON.stringify(widths))
  }, [widths])

  useEffect(() => { 
    fetchData() 
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

  const sendUrgentEmail = async (item, faultDetails) => {
    const MY_RESEND_KEY = 're_Sj2Kx2LS_3VFCkGgt4ZfWkSZuVCnB2eGM'; 
    const MY_RECEIVER_EMAIL = 'valdasjanciauskas@gmail.com';

    const klientas = item["Kliento pavadinimas"] || 'Nenurodytas klientas';
    const adresas = item["Adresas"] || 'Nenurodytas adresas';
    const iranga = item["Įrangos pavadinimas"] || 'Nenurodyta įranga';
    const serijosNumeris = item["Serijos numeris"] || 'Nenurodytas S/N';

    try {
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = 'https://api.resend.com/emails';

      await fetch(proxyUrl + targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MY_RESEND_KEY}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          from: 'MD Impex CRM <onboarding@resend.dev>',
          to: [MY_RECEIVER_EMAIL],
          subject: `🚨 SKUBUS IŠKVIETIMAS: Gedimas - ${klientas}`,
          html: `
            <div style="font-family:Arial,sans-serif;padding:25px;line-height:1.6;max-width:600px;border:1px solid #e3e7eb;border-radius:8px;">
              <h2 style="color:#e30613;margin-top:0;border-bottom:2px solid #e30613;padding-bottom:10px;">🚨 Užregistruotas skubus gedimas!</h2>
              <table style="width:100%;border-collapse:collapse;margin-top:15px;">
                <tr><td style="padding:8px 0;font-weight:bold;width:150px;color:#555;">Klientas:</td><td style="padding:8px 0;font-size:15px;color:#000;">${klientas}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Adresas:</td><td style="padding:8px 0;font-size:15px;color:#000;">${adresas}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Įranga:</td><td style="padding:8px 0;font-size:15px;color:#000;">${iranga}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Serijos numeris:</td><td style="padding:8px 0;font-size:15px;color:#000;font-family:monospace;">${serijosNumeris}</td></tr>
                <tr><td style="padding:15px 0 8px 0;font-weight:bold;color:#e30613;vertical-align:top;">Gedimo aprašymas:</td><td style="padding:15px 0 8px 0;font-size:15px;color:#e30613;font-weight:bold;background-color:#fff0f0;padding:10px;border-radius:4px;">${faultDetails}</td></tr>
              </table>
            </div>
          `
        })
      });
    } catch (err) { console.error(err) }
  };

  const pushActionToHistory = (action) => {
    setHistory(prev => [action, ...prev].slice(0, 25)); 
  };

  const handleAddRow = async () => {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ "Kliento pavadinimas": "NAUJAS ĮRAŠAS...", "Atlikta": "Ne" })
      });
      if (res.ok) {
        const [newItem] = await res.json();
        setEquipment([newItem, ...equipment]);
        pushActionToHistory({ type: 'ADD_ROW', id: newItem.id });
      }
    } catch (err) { alert(err.message) }
  };

  const handleSave = async (id, field, value) => {
    const currentItem = equipment.find(item => item.id === id);
    if (!currentItem) return;
    
    const oldValue = currentItem[field] || '';
    const newValue = value !== undefined && value !== null ? value.toString().trim() : '';

    if (!newValue || newValue === "") {
      if (oldValue && oldValue !== '—') {
        const confirmDeleteValue = window.confirm(`Ar tikrai norite IŠTRINTI reikšmę iš stulpelio "${field}"?`);
        if (!confirmDeleteValue) {
          setEditingCell(null);
          return;
        }
      } else {
        setEditingCell(null);
        return;
      }
    }

    if (newValue === oldValue) {
      setEditingCell(null);
      return;
    }

    pushActionToHistory({
      type: 'EDIT_CELL',
      id: id,
      field: field,
      oldValue: oldValue,
      oldPatikrosData: currentItem["Patikros data"] || null,
      oldSekantiPatikra: currentItem["Sekanti patikra"] || null
    });

    let updates = { [field]: newValue };

    if (field === "Atlikta" && newValue === "Taip") {
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
      const res = await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error("Nepavyko išsaugoti");

      const updatedItem = { ...currentItem, ...updates };

      if (field === "Prižiūri" && newValue.toLowerCase().includes('gedimas')) {
        if (!newValue.toLowerCase().includes('sutaisyta')) {
          sendUrgentEmail(updatedItem, newValue);
        }
      }

      setEquipment(equipment.map(item => item.id === id ? { ...item, ...updates } : item));
      setEditingCell(null);
    } catch (err) { 
      console.error("Klaida:", err);
      setEditingCell(null);
    }
  };

  const handleUndo = async () => {
    if (history.length === 0) return;

    const lastAction = history[0];
    const nextHistory = history.slice(1);

    try {
      setLoading(true);

      if (lastAction.type === 'EDIT_CELL') {
        let rollbacks = { [lastAction.field]: lastAction.oldValue };
        if (lastAction.field === 'Atlikta') {
          rollbacks["Patikros data"] = lastAction.oldPatikrosData;
          rollbacks["Sekanti patikra"] = lastAction.oldSekantiPatikra;
        }

        await fetch(`${BASE_URL}?id=eq.${lastAction.id}`, {
          method: 'PATCH',
          headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(rollbacks)
        });

        setEquipment(prev => prev.map(item => item.id === lastAction.id ? { ...item, ...rollbacks } : item));
      } 
      
      else if (lastAction.type === 'DELETE_ROW') {
        const res = await fetch(BASE_URL, {
          method: 'POST',
          headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify(lastAction.rowData)
        });
        if (res.ok) {
          const [restoredItem] = await res.json();
          setEquipment(prev => [restoredItem, ...prev]);
        }
      } 
      
      else if (lastAction.type === 'ADD_ROW') {
        await fetch(`${BASE_URL}?id=eq.${lastAction.id}`, {
          method: 'DELETE',
          headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
        });
        setEquipment(prev => prev.filter(item => item.id !== lastAction.id));
      } 
      
      else if (lastAction.type === 'COLUMNS_STATE') {
        setColumns(lastAction.oldColumns);
      }

      setHistory(nextHistory);
    } catch (err) {
      console.error("Nepavyko įvykdyti undo:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (id, field, initialValue) => {
    setEditingCell({ id, field });
    setInputValue(initialValue || '');
  };

  const moveColumn = (index, direction) => {
    const newCols = [...columns];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    setColumns(newCols);
  };

  const toggleColumn = (key) => setColumns(columns.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  
  const renameColumnLabel = (key) => {
    const currentCol = columns.find(c => c.key === key);
    const newLabel = window.prompt(`Įveskite naują stulpelio "${currentCol.label}" pavadinimą:`, currentCol.label);
    if (newLabel && newLabel.trim() !== "") {
      pushActionToHistory({ type: 'COLUMNS_STATE', oldColumns: JSON.parse(JSON.stringify(columns)) });
      setColumns(columns.map(c => c.key === key ? { ...c, label: newLabel.trim().toUpperCase() } : c));
    }
  };

  const deleteColumnEntirely = (key) => {
    const currentCol = columns.find(c => c.key === key);
    if (window.confirm(`Ar tikrai norite VISIŠKAI IŠTRINTI stulpelį "${currentCol.label}" iš CRM sąrašo?`)) {
      pushActionToHistory({ type: 'COLUMNS_STATE', oldColumns: JSON.parse(JSON.stringify(columns)) });
      setColumns(columns.filter(c => c.key !== key));
    }
  };

  const handleDeleteRow = async (id) => {
    const rowToDelete = equipment.find(item => item.id === id);
    if (!rowToDelete || !window.confirm("Ar tikrai norite IŠTRINTI šį įrašą?")) return;
    
    pushActionToHistory({ type: 'DELETE_ROW', rowData: rowToDelete });
    
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

  const filteredData = equipment.filter(item => {
    if (!globalSearch.trim()) return true; 
    
    const query = globalSearch.toLowerCase();
    const clientMatch = (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(query);
    const equipmentMatch = (item["Įrangos pavadinimas"]?.toLowerCase() || '').includes(query);
    const addressMatch = (item["Adresas"]?.toLowerCase() || '').includes(query);
    const serialMatch = (item["Serijos numeris"]?.toLowerCase() || '').includes(query); 

    return clientMatch || equipmentMatch || addressMatch || serialMatch;
  });

  const sortedAndFilteredData = [...filteredData].sort((a, b) => {
    const aFault = a["Prižiūri"] && a["Prižiūri"].toLowerCase().includes('gedimas') && !a["Prižiūri"].toLowerCase().includes('sutaisyta');
    const bFault = b["Prižiūri"] && b["Prižiūri"].toLowerCase().includes('gedimas') && !b["Prižiūri"].toLowerCase().includes('sutaisyta');

    if (aFault && !bFault) return -1;
    if (!aFault && bFault) return 1;
    return 0;
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden', position: 'fixed', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .main-header { height: 85px; display: flex; padding: 0 35px; background: #113c32; align-items: center; flex-shrink: 0; }
        .nav-menu { display: flex; gap: 20px; color: #ffffff; font-size: 14px; font-weight: bold; align-items: center; width: 100%; }
        .nav-item { cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-add-gold { color: #b4965d !important; margin-left: 20px;}
        /* PAKEISTA: Undo mygtuko stilius - rodyklė be žodžio, perkelta į kairę */
        .btn-undo { 
          color: #acca23 !important; 
          cursor: pointer; 
          font-size: 18px; 
          font-weight: bold;
          transition: opacity 0.2s; 
          margin-right: -10px; /* Pritraukiame arčiau sekančio elemento */
        }
        .btn-undo.disabled { opacity: 0.3; cursor: not-allowed; color: #ffffff !important; }
        
        .nav-separator { color: rgba(255,255,255,0.2); }
        .search-box-global { background: #194a3f; border: 1px solid #235d51; padding: 10px 18px; color: white; font-size: 13px; outline: none; width: 320px; margin-left: 15px; border-radius: 4px; }
        .search-box-global::placeholder { color: rgba(255,255,255,0.5); }
        .crm-title-right { margin-left: auto; color: #acca23; font-size: 22px; font-family: 'Candara', serif; }
        .crm-card-wrapper { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        .table-wrap { flex: 1; overflow: auto; width: 100vw; -webkit-overflow-scrolling: touch; }
        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        th { background: #1e1e1e; color: #ffffff !important; position: sticky; top: 0; z-index: 30; font-size: 11px; font-weight: bold; text-align: center; padding: 16px 5px; border-right: 1px solid #333333; border-bottom: 2px solid #000000; }
        td { padding: 0; border-right: 1px solid #e3e7eb; border-bottom: 1px solid #e3e7eb; position: relative; background: #ffffff; }
        tr:nth-child(even) td { background-color: #f8fafb; }
        tr:hover td { background-color: #edf2f7 !important; }
        .row-overdue td { background-color: #fff0f0 !important; }
        
        @keyframes pulse-red-white {
          0% { background-color: #ffffff; }
          50% { background-color: #ffdde0; }
          100% { background-color: #ffffff; }
        }
        .row-fault td { 
          animation: pulse-red-white 1.5s infinite ease-in-out !important; 
        }

        .text-overdue { color: #e30613 !important; font-weight: bold; }
        .cell-content { padding: 12px 10px; font-size: 13px; color: #232323; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; min-height: 20px; cursor: pointer; }
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 6px; cursor: col-resize; z-index: 31; }
        .cell-edit { width: 100%; border: 2px solid #113c32; padding: 6px; font-size: 13px; outline: none; box-sizing: border-box; background: white; }
        .action-btn { border: none; background: none; cursor: pointer; font-size: 14px; margin: 0 6px; }
        .btn-del { color: #e30613; }
        .btn-edit-icon { color: #113c32; font-weight: bold; }
        .col-manage-btn { border: none; background: none; cursor: pointer; font-size: 11px; margin-left: 5px; padding: 2px 4px; border-radius: 3px; }
        .col-manage-btn:hover { background: #f0f0f0; }

        @media (max-width: 768px) { .main-header { height: auto; padding: 15px 15px; } .nav-menu { flex-direction: column; align-items: stretch; gap: 10px; } .nav-separator { display: none; } .crm-title-right { margin-left: 0; text-align: center; order: -1; font-size: 18px; } .search-box-global { width: 100%; margin-left: 0; } }
      `}</style>

      <div className="main-header">
        <div className="nav-menu">
          {/* SUTVARKYTA: Atšaukimo rodyklė perkelta į kairę, be žodžio "atšaukti" */}
          <span 
            className={`nav-item btn-undo ${history.length === 0 ? 'disabled' : ''}`} 
            onClick={handleUndo}
            title={history.length > 0 ? `Atšaukti paskutinį veiksmą (galima ${history.length} kartų)` : "Istorija tuščia"}
          >
            ↩️
          </span>
          <span className="nav-separator">|</span>
          
          <span className="nav-item" onClick={() => setShowColManager(!showColManager)}>STULPELIŲ VALDYMAS</span>
          <span className="nav-separator">|</span>
          <span className="nav-item btn-add-gold" onClick={handleAddRow}>+ NAUJAS ĮRAŠAS</span>
          
          <input 
            className="search-box-global" 
            placeholder="🔍 Ieškoti (Kliento, Įrangos, Adreso, S/N)..." 
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)} 
          />

          <div className="crm-title-right">MD Impex CRM</div>
        </div>
      </div>

      <div className="crm-card-wrapper">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                {visibleCols.map(col => (
                  <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {col.label}
                      <div style={{ marginTop: '5px' }}>
                        <span style={{cursor:'pointer', marginRight: '8px', fontSize: '10px', color: '#b4965d'}} onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), -1)}>◀</span>
                        <span style={{cursor:'pointer', fontSize: '10px', color: '#b4965d'}} onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), 1)}>▶</span>
                      </div>
                    </div>
                    <div className="resizer" onMouseDown={e => onMouseDown(e, col.key)} />
                  </th>
                ))}
                <th style={{ width: '100px' }}>VEIKSMAI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleCols.length + 2} style={{textAlign: 'center', padding: '50px'}}>KRAUNAMA...</td></tr>
              ) : (
                sortedAndFilteredData.map((item, index) => {
                  const isOverdue = item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date();
                  const hasFault = item["Prižiūri"] && item["Prižiūri"].toLowerCase().includes('gedimas') && !item["Prižiūri"].toLowerCase().includes('sutaisyta');
                  let rowClass = '';
                  if (hasFault) rowClass = 'row-fault'; else if (isOverdue) rowClass = 'row-overdue';

                  return (
                    <tr key={item.id} className={rowClass}>
                      <td style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>{index + 1}</td>
                      {visibleCols.map(col => (
                        <td key={col.key}>
                          <div style={{ width: `${widths[col.key]}px` }}>
                            {editingCell?.id === item.id && editingCell?.field === col.key ? (
                              col.key === "Sutartis YRA/NĖRA" ? (
                                <select className="cell-edit" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, inputValue)}>
                                  <option value="">—</option><option value="YES">YES</option><option value="NO">NO</option>
                                </select>
                              ) : col.key === "Atlikta" ? (
                                <select className="cell-edit" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, inputValue)}>
                                  <option value="Ne">Ne</option><option value="Taip">Taip</option>
                                </select>
                              ) : col.key.toLowerCase().includes('data') || col.key.toLowerCase().includes('patikra') ? (
                                <input autoFocus type="date" className="cell-edit" value={inputValue} onChange={e => setInputValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, inputValue)} onKeyDown={e => { if (e.key === 'Enter') handleSave(item.id, col.key, inputValue); if (e.key === 'Escape') setEditingCell(null); }} />
                              ) : (
                                <input autoFocus type="text" className="cell-edit" value={inputValue} onChange={e => setInputValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, inputValue)} onKeyDown={e => { if (e.key === 'Enter') handleSave(item.id, col.key, inputValue); if (e.key === 'Escape') setEditingCell(null); }} />
                              )
                            ) : (
                              <span className={`cell-content ${col.key === "Sekanti patikra" && isOverdue ? 'text-overdue' : ''}`} onDoubleClick={() => handleStartEdit(item.id, col.key, item[col.key])}>
                                {item[col.key] || '—'}
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button className="action-btn btn-edit-icon" onClick={() => handleStartEdit(item.id, "Prižiūri", item["Prižiūri"])}>✏️</button>
                          <button className="action-btn btn-del" onClick={() => handleDeleteRow(item.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showColManager && (
        <div style={{ position: 'absolute', top: '90px', left: '30px', background: 'white', padding: '20px', zIndex: 100, border: '1px solid #113c32', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '280px' }}>
          <h4 style={{marginTop: 0, fontSize: '12px', letterSpacing: '0.5px', borderBottom: '1px solid #e3e7eb', paddingBottom: '8px'}}>STULPELIŲ VALDYMAS</h4>
          <div style={{maxHeight: '320px', overflowY: 'auto'}}>
            {columns.map(col => (
              <div key={col.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingRight: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} style={{cursor: 'pointer'}} />
                  <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: col.visible ? 'bold' : 'normal', color: col.visible ? '#232323' : '#999' }}>
                    {col.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button className="col-manage-btn" title="Pervadinti stulpelį" onClick={() => renameColumnLabel(col.key)}>✏️</button>
                  <button className="col-manage-btn" title="Visiškai ištrinti stulpelį" onClick={() => deleteColumnEntirely(col.key)} style={{color: '#e30613'}}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowColManager(false)} style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#113c32', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>UŽDARYTI</button>
        </div>
      )}
    </div>
  );
}

export default App;