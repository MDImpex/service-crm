import { useEffect, useState, useRef } from 'react'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchEquipment, setSearchEquipment] = useState('') // NAUJAS: Būsena įrangos filtravimui
  const [editingCell, setEditingCell] = useState(null)
  const [showColManager, setShowColManager] = useState(false)
  
  const [columns, setColumns] = useState(() => {
    const savedCols = localStorage.getItem('crm_columns')
    return savedCols ? JSON.parse(savedCols) : [
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
      { label: "ATK. PERIODAS", key: "Atk. Periodas", visible: true },
      { label: "KOMENTARAS", key: "Komentaras", visible: true },
      { label: "SUTARTIS YRA/NĖRA", key: "Sutartis YRA/NĖRA", visible: true },
      { label: "ATLIKTA", key: "Atlikta", visible: true }
    ]
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
        body: JSON.stringify({ "Kliento pavadinimas": "NAUJAS ĮRAŠAS...", "Atlikta": "Ne" })
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

  {/* ATNAUJINTA: Dvigubas filtravimas (pagal klientą IR pagal įrangą) */}
  const filteredData = equipment.filter(item => {
    const matchesClient = (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesEquipment = (item["Įrangos pavadinimas"]?.toLowerCase() || '').includes(searchEquipment.toLowerCase());
    return matchesClient && matchesEquipment;
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden', position: 'fixed', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .main-header { 
          height: 85px; 
          display: flex; 
          padding: 0 35px; 
          background: #113c32; 
          align-items: center; 
          flex-shrink: 0;
        }

        .nav-menu { display: flex; gap: 20px; color: #ffffff; font-size: 14px; font-weight: bold; align-items: center; width: 100%; }
        .nav-item { cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: opacity 0.2s; }
        .nav-item:hover { opacity: 0.8; }
        .btn-add-gold { color: #b4965d !important; }
        .nav-separator { color: rgba(255,255,255,0.2); font-weight: normal; }

        .search-box-embedded {
          background: #194a3f;
          border: 1px solid #235d51;
          padding: 9px 15px;
          color: white;
          font-size: 13px;
          outline: none;
          width: 220px; /* Šiek tiek susiaurinta, kad tilptų abu laukeliai */
          margin-left: 10px;
        }
        .search-box-embedded::placeholder { color: rgba(255,255,255,0.4); }

        .crm-title-right {
          margin-left: auto;
          color: #acca23;
          font-size: 22px;
          font-weight: normal;
          letter-spacing: 1px;
          font-family: 'Candara', serif;
        }

        .crm-card-wrapper {
          flex: 1;
          margin: 0;
          background: #ffffff;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .table-wrap { 
          flex: 1; 
          overflow: auto; 
          width: 100vw;
        }

        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        
        th { 
          background: #1e1e1e; 
          color: #ffffff !important; 
          position: sticky; 
          top: 0; 
          zIndex: 30; 
          font-size: 11px; 
          font-weight: bold;
          text-align: center;
          padding: 16px 5px;
          border-right: 1px solid #333333;
          border-bottom: 2px solid #000000;
          text-transform: uppercase;
        }
        
        td { padding: 0; border-right: 1px solid #e3e7eb; border-bottom: 1px solid #e3e7eb; position: relative; background: #ffffff; }
        
        tr:nth-child(even) td { background-color: #f8fafb; }
        tr:hover td { background-color: #edf2f7 !important; }
        .row-overdue td { background-color: #fff0f0 !important; }
        .text-overdue { color: #e30613 !important; font-weight: bold; }
        
        .cell-content { padding: 12px 10px; font-size: 13px; color: #232323; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 6px; cursor: col-resize; z-index: 31; }
        .cell-edit { width: 100%; border: 2px solid #113c32; padding: 6px; font-size: 12px; outline: none; box-sizing: border-box; }
        
        .action-btn { border: none; background: none; cursor: pointer; font-size: 14px; margin: 0 6px; }
        .btn-del { color: #e30613; }
        .btn-edit-icon { color: #555555; }
      `}</style>

      <div className="main-header">
        <div className="nav-menu">
          <span className="nav-item" onClick={() => setShowColManager(!showColManager)}>STULPELIAI</span>
          <span className="nav-separator">|</span>
          <span className="nav-item btn-add-gold" onClick={handleAddRow}>+ NAUJAS ĮRAŠAS</span>
          
          {/* Filtras 1: Pagal Klientą */}
          <input 
            className="search-box-embedded" 
            placeholder="🔍 Filtruoti klientą..." 
            onChange={e => setSearchTerm(e.target.value)} 
          />

          {/* Filtras 2: Pagal Įrangą */}
          <input 
            className="search-box-embedded" 
            placeholder="⚙️ Filtruoti įrangą..." 
            onChange={e => setSearchEquipment(e.target.value)} 
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
                filteredData.map((item, index) => {
                  const isOverdue = item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date();
                  return (
                    <tr key={item.id} className={isOverdue ? 'row-overdue' : ''}>
                      <td style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>{index + 1}</td>
                      {visibleCols.map(col => (
                        <td key={col.key} onDoubleClick={() => setEditingCell({ id: item.id, field: col.key })}>
                          <div className={`cell-content ${col.key === "Sekanti patikra" && isOverdue ? 'text-overdue' : ''}`} style={{ width: `${widths[col.key]}px` }}>
                            {editingCell?.id === item.id && editingCell?.field === col.key ? (
                              col.key === "Sutartis YRA/NĖRA" ? (
                                <select className="cell-edit" autoFocus defaultValue={item[col.key]} onBlur={() => setEditingCell(null)} onChange={e => handleSave(item.id, col.key, e.target.value)}>
                                  <option value="">—</option>
                                  <option value="YES">YES</option>
                                  <option value="NO">NO</option>
                                </select>
                              ) : col.key === "Atlikta" ? (
                                <select className="cell-edit" autoFocus defaultValue={item[col.key]} onBlur={() => setEditingCell(null)} onChange={e => handleSave(item.id, col.key, e.target.value)}>
                                  <option value="Ne">Ne</option>
                                  <option value="Taip">Taip</option>
                                </select>
                              ) : col.key.toLowerCase().includes('data') || col.key.toLowerCase().includes('patikra') ? (
                                <input 
                                  autoFocus 
                                  type="date"
                                  className="cell-edit" 
                                  defaultValue={item[col.key]} 
                                  onBlur={e => handleSave(item.id, col.key, e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleSave(item.id, col.key, e.target.value)}
                                />
                              ) : (
                                <input 
                                  autoFocus 
                                  type="text"
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
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button className="action-btn btn-edit-icon" onClick={() => setEditingCell({ id: item.id, field: visibleCols[0].key })}>✏️</button>
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
        <div style={{ position: 'absolute', top: '90px', left: '30px', background: 'white', padding: '20px', zIndex: 100, border: '1px solid #113c32', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <h4 style={{marginTop: 0, fontSize: '12px'}}>STULPELIŲ VALDYMAS</h4>
          <div style={{maxHeight: '300px', overflowY: 'auto'}}>
            {columns.map(col => (
              <div key={col.key} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} />
                <span style={{ marginLeft: '10px', fontSize: '12px' }}>{col.label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowColManager(false)} style={{ width: '100%', marginTop: '15px', padding: '8px', background: '#113c32', color: 'white', border: 'none', cursor: 'pointer' }}>UŽDARYTI</button>
        </div>
      )}
    </div>
  );
}

export default App;