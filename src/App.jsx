import { useEffect, useState, useRef } from 'react'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [showColManager, setShowColManager] = useState(false)
  
  const [columns, setColumns] = useState([
    { label: "MONTAVIMO DATA", key: "Montavimo data", visible: true },
    { label: "ĮM. KODAS", key: "Kliento įmonės kodas", visible: true },
    { label: "KLIENTAS", key: "Kliento pavadinimas", visible: true },
    { label: "ADRESAS", key: "Adresas", visible: true },
    { label: "ĮRANGOS PAVADINIMAS", key: "Įrangos pavadinimas", visible: true },
    { label: "SERIJOS NUMERIS", key: "Serijos numeris", visible: true },
    { label: "PRIŽIŪRI", key: "Prižiūri", visible: true },
    { label: "PERIODAS", key: "Patikr. Periodiškumas", visible: true },
    { label: "PASK. PATIKRA", key: "Patikros data", visible: true },
    { label: "SEKANTI PATIKRA", key: "Sekanti patikra", visible: true },
    { label: "ATK. PERIODAS", key: "Atk. Periodas", visible: true }, // Pridėta pagal foto
    { label: "KOMENTARAS", key: "Komentaras", visible: true },
    { label: "SUTARTIS YRA/NĖRA", key: "Sutartis YRA/NĖRA", visible: true }
  ]);

  const [widths, setWidths] = useState({
    "Montavimo data": 120, "Kliento įmonės kodas": 90, "Kliento pavadinimas": 160,
    "Adresas": 180, "Įrangos pavadinimas": 160, "Serijos numeris": 120,
    "Prižiūri": 120, "Patikr. Periodiškumas": 90, "Patikros data": 110, 
    "Sekanti patikra": 110, "Atk. Periodas": 100, "Komentaras": 180, "Sutartis YRA/NĖRA": 120
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
        body: JSON.stringify({ "Kliento pavadinimas": "ST.EKT.PRASUET", "Atlikta": "Ne" })
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
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#eaeef3', overflow: 'hidden', position: 'fixed', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        /* 1. Viršutinė siaura juosta */
        .info-top-bar {
          height: 35px;
          background: #111e1b;
          display: flex;
          align-items: center;
          padding: 0 50px;
          font-size: 11px;
          color: #ffffff;
          gap: 25px;
        }
        .info-top-bar a { color: #ffffff; text-decoration: none; }
        .info-top-bar .right-icon { margin-left: auto; color: #ffffff; font-size: 14px; }

        /* 2. Pagrindinis Žalias Meniu Baras */
        .main-header { 
          height: 100px; 
          display: flex; 
          padding: 0 50px; 
          background: #1c4e43; 
          align-items: center; 
          flex-shrink: 0;
        }
        
        /* Logotipas iš foto (koriai + tekstas) */
        .logo-area { display: flex; align-items: center; gap: 15px; }
        .logo-hexagon-mock {
          width: 45px;
          height: 45px;
          position: relative;
          border: 1px solid #b39359;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .logo-hexagon-mock::before {
          content: '';
          position: absolute;
          top: 3px; left: 3px; right: 3px; bottom: 3px;
          border: 1px solid #b39359;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .logo-text-box { display: flex; flexDirection: column; }
        .logo-title { color: #b39359; font-size: 26px; font-family: 'Times New Roman', serif; font-weight: normal; letter-spacing: 1px; line-height: 1; }
        .logo-subtitle { color: #b39359; font-size: 11px; letter-spacing: 3px; margin-top: 5px; text-transform: uppercase; }

        /* Horizonalus Meniu dešinėje */
        .nav-menu { display: flex; gap: 12px; margin-left: auto; color: #ffffff; font-size: 12px; font-weight: bold; align-items: center; }
        .nav-item { cursor: pointer; opacity: 0.9; text-transform: uppercase; white-space: nowrap; }
        .nav-item:hover { opacity: 1; color: #b39359; }
        .nav-separator { color: rgba(255,255,255,0.3); }

        /* 3. Vartotojo valdymo juosta žemiau meniu */
        .user-action-bar {
          height: 60px;
          background: #eaeef3;
          display: flex;
          align-items: center;
          padding: 0 50px;
          justify-content: flex-end;
          gap: 15px;
        }
        .user-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #333333; font-weight: bold; }
        .btn-config { background: none; border: none; cursor: pointer; font-size: 16px; color: #555; }

        /* 4. Lentelės konteinerio rėmas iš nuotraukos */
        .crm-card-wrapper {
          flex: 1;
          margin: 0 40px 30px 40px;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid #dcdfe6;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .table-wrap { 
          flex: 1; 
          overflow: auto; 
          width: 100%;
        }

        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        
        /* Tiksliai Juodos Antraštės */
        th { 
          background: #232323; 
          color: #ffffff !important; 
          position: sticky; 
          top: 0; 
          zIndex: 30; 
          font-size: 12px; 
          font-weight: bold;
          text-align: center;
          padding: 15px 5px;
          border-right: 1px solid #3d3d3d;
          border-bottom: 1px solid #111111;
        }
        
        td { padding: 0; border-right: 1px solid #e3e7eb; border-bottom: 1px solid #e3e7eb; position: relative; background: #ffffff; }
        
        /* Pakaitinės eilučių spalvos švelniam vaizdui */
        tr:nth-child(even) td { background-color: #f7f9fa; }
        tr:hover td { background-color: #edf2f7 !important; }
        
        .row-overdue td { background-color: #fff0f0 !important; }
        .text-overdue { color: #d32f2f !important; font-weight: bold; }
        
        .cell-content { padding: 12px 10px; font-size: 13px; color: #232323; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 6px; cursor: col-resize; z-index: 31; }
        .cell-edit { width: 100%; border: 2px solid #1c4e43; padding: 6px; font-size: 12px; outline: none; box-sizing: border-box; }
        
        /* Ikonų stiliai lentelėje */
        .action-btn { border: none; background: none; cursor: pointer; font-size: 14px; margin: 0 4px; }
        .btn-del { color: #e30613; }
        .btn-edit-icon { color: #555555; }

        /* Paieškos laukelis integruotas info juostoje */
        .search-box-embedded {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 6px 12px;
          color: white;
          font-size: 12px;
          outline: none;
          width: 180px;
          margin-right: 20px;
        }
        .search-box-embedded::placeholder { color: rgba(255,255,255,0.4); }
      `}</style>

      {/* 1. Viršutinė siaura juosta */}
      <div className="info-top-bar">
        <span>✉ INFO@MDIMPEX.LT</span>
        <span>📞 +370 670 033 51</span>
        <span className="right-icon"></span> {/* LinkedIn vieta */}
      </div>

      {/* 2. Žalias Meniu Baras */}
      <div className="main-header">
        <div className="logo-area">
          <div className="logo-hexagon-mock"></div>
          <div className="logo-text-box">
            <span className="logo-title">md impex</span>
            <span className="logo-subtitle">service center</span>
          </div>
        </div>

        <div className="nav-menu">
          <input className="search-box-embedded" placeholder="🔍 Filtruoti klientą..." onChange={e => setSearchTerm(e.target.value)} />
          <span className="nav-item" onClick={() => setShowColManager(!showColManager)}>Stulpeliai</span>
          <span className="nav-separator">|</span>
          <span className="nav-item" onClick={handleAddRow} style={{color: '#b39359'}}>+ NAUJAS ĮRAŠAS</span>
          <span className="nav-separator">|</span>
          <span className="nav-item">CRM ĮRANGOS VALDYMAS</span>
          <span className="nav-separator">|</span>
          <span className="nav-item">KLIENTŲ SĄRAŠAI</span>
          <span className="nav-separator">|</span>
          <span className="nav-item">PATIKRŲ KALENDORIUS</span>
        </div>
      </div>

      {/* 3. Vartotojo statuso juosta */}
      <div className="user-action-bar">
        <div className="user-info">
          <span>👤 A. JONYNAS (VADOVAS)</span>
        </div>
        <button className="btn-config" onClick={() => setShowColManager(!showColManager)}>⚙</button>
      </div>

      {/* 4. Pagrindinis CRM Lentelės Rėmas */}
      <div className="crm-card-wrapper">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {visibleCols.map(col => (
                  <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      {col.label}
                      <div style={{ fontSize: '9px', opacity: 0.4 }}>
                        <span style={{cursor:'pointer', marginRight:'6px'}} onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), -1)}>◀</span>
                        <span style={{cursor:'pointer'}} onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), 1)}>▶</span>
                      </div>
                    </div>
                    <div className="resizer" onMouseDown={e => onMouseDown(e, col.key)} />
                  </th>
                ))}
                <th style={{ width: '90px' }}>VEIKSMAI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleCols.length + 1} style={{textAlign: 'center', padding: '100px', color: '#1c4e43', fontWeight: 'bold'}}>KRAUNAMI DUOMENYS...</td></tr>
              ) : (
                filteredData.map(item => {
                  const isOverdue = item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date();
                  return (
                    <tr key={item.id} className={isOverdue ? 'row-overdue' : ''}>
                      {visibleCols.map(col => (
                        <td key={col.key} onDoubleClick={() => setEditingCell({ id: item.id, field: col.key })}>
                          <div className={`cell-content ${col.key === "Sekanti patikra" && isOverdue ? 'text-overdue' : ''}`} style={{ width: `${widths[col.key]}px` }}>
                            {editingCell?.id === item.id && editingCell?.field === col.key ? (
                              col.key === "Sutartis YRA/NĖRA" || col.key === "Atlikta" ? (
                                <select className="cell-edit" autoFocus defaultValue={item[col.key]} onBlur={() => setEditingCell(null)} onChange={e => handleSave(item.id, col.key, e.target.value)}>
                                  <option value="YES">YES</option>
                                  <option value="NO">NO</option>
                                </select>
                              ) : (
                                <input 
                                  autoFocus 
                                  type={col.key.toLowerCase().includes('data') || col.key.toLowerCase().includes('patikra') ? "date" : "text"}
                                  className="cell-edit" 
                                  defaultValue={item[col.key]} 
                                  onBlur={e => handleSave(item.id, col.key, e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleSave(item.id, col.key, e.target.value)}
                                />
                              )
                            ) : (item[col.key] || '—')}
                          </div>
                        </td>
                      ))}
                      {/* Veiksmai (Pieštukas ir Šiukšliadėžė iš foto) */}
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <button className="action-btn btn-edit-icon" onClick={() => setEditingCell({ id: item.id, field: 'Kliento pavadinimas' })}>✏️</button>
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
        <div style={{ position: 'absolute', top: '160px', right: '50px', background: 'white', padding: '25px', zIndex: 100, border: '1px solid #b39359', minWidth: '280px', borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
          <h4 style={{margin:'0 0 20px 0', textTransform: 'uppercase', fontSize: '11px', color: '#1c4e43', letterSpacing: '1px'}}>Rodyti Stulpelius</h4>
          <div style={{maxHeight: '350px', overflowY: 'auto'}}>
            {columns.map(col => (
              <div key={col.key} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} />
                <span style={{ flex: 1, marginLeft: '15px', fontSize: '12px' }}>{col.label}</span>
                <span style={{ cursor: 'pointer', color: '#e30613', fontSize: '11px' }} onClick={() => deleteColumn(col.key)}>Išimti</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowColManager(false)} style={{ width: '100%', marginTop: '20px', padding: '10px', background: '#1c4e43', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>UŽDARYTI</button>
        </div>
      )}
    </div>
  );
}

export default App;