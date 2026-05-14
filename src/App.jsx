import { useEffect, useState, useRef } from 'react'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [showColManager, setShowColManager] = useState(false)
  
  const [columns, setColumns] = useState([
    { label: "Montavimas", key: "Montavimo data", visible: true },
    { label: "Įm. Kodas", key: "Kliento įmonės kodas", visible: true },
    { label: "Klientas", key: "Kliento pavadinimas", visible: true },
    { label: "Adresas", key: "Adresas", visible: true },
    { label: "Įranga", key: "Įrangos pavadinimas", visible: true },
    { label: "S/N", key: "Serijos numeris", visible: true },
    { label: "Prižiūri", key: "Prižiūri", visible: true },
    { label: "Periodas", key: "Patikr. Periodiškumas", visible: true },
    { label: "Sutartis", key: "Sutartis YRA/NĖRA", visible: true },
    { label: "Atlikta", key: "Atlikta", visible: true },
    { label: "Pask. Patikra", key: "Patikros data", visible: true },
    { label: "Sekanti patikra", key: "Sekanti patikra", visible: true },
    { label: "Komentaras", key: "Komentaras", visible: true }
  ]);

  const [widths, setWidths] = useState({
    "Montavimo data": 110, "Kliento įmonės kodas": 90, "Kliento pavadinimas": 180,
    "Adresas": 180, "Įrangos pavadinimas": 180, "Serijos numeris": 120,
    "Prižiūri": 100, "Patikr. Periodiškumas": 120, "Sutartis YRA/NĖRA": 80,
    "Atlikta": 80, "Patikros data": 110, "Sekanti patikra": 110, "Komentaras": 200
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
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f1ea', overflow: 'hidden', position: 'fixed' }}>
      <style>{`
        .top-bar { height: 80px; display: flex; padding: 0 30px; gap: 20px; background: #214f43; align-items: center; color: #f4f1ea; flex-shrink: 0; border-bottom: 2px solid #b39359; }
        .logo-box { border: 1px solid #b39359; padding: 5px 12px; color: #b39359; font-weight: bold; letter-spacing: 2px; }
        .btn-add { background: #b39359; color: white; border: none; padding: 10px 22px; border-radius: 0; font-weight: 600; cursor: pointer; text-transform: uppercase; transition: background 0.3s; }
        .btn-add:hover { background: #927848; }
        .btn-cols { background: transparent; color: #b39359; border: 1px solid #b39359; padding: 9px 15px; cursor: pointer; text-transform: uppercase; font-size: 12px; }
        .table-wrap { flex: 1; overflow: auto; background: white; width: 100vw; height: calc(100vh - 82px); }
        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        
        /* PATAISYTA: Balta antraščių spalva */
        th { 
          background: #1a1a1a; 
          color: #ffffff !important; 
          position: sticky; 
          top: 0; 
          zIndex: 30; 
          font-size: 11px; 
          letter-spacing: 1px; 
          text-transform: uppercase; 
          border-right: 1px solid #333; 
          border-bottom: 2px solid #b39359; 
        }
        
        td { padding: 0; border-right: 1px solid #e8e4db; border-bottom: 1px solid #e8e4db; position: relative; background: white; }
        .row-overdue td { background-color: #fff5f5 !important; }
        .text-overdue { color: #d32f2f !important; font-weight: bold; }
        tr:hover td { background-color: #fcfaf5 !important; }
        .cell-content { padding: 12px 10px; font-size: 13px; color: #2c2c2c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 6px; cursor: col-resize; z-index: 31; }
        .cell-edit { width: 100%; border: 2px solid #214f43; padding: 6px; font-size: 13px; outline: none; box-sizing: border-box; }
        .search-input { background: rgba(255,255,255,0.1); border: 1px solid #b39359; color: white; padding: 10px 15px; width: 280px; outline: none; }
        
        /* Šiukšliadėžės stilius */
        .btn-delete { 
          border: none; 
          background: none; 
          cursor: pointer; 
          font-size: 16px; 
          color: #e30613; /* Raudona */
          transition: transform 0.2s;
        }
        .btn-delete:hover { transform: scale(1.2); }
      `}</style>

      <div className="top-bar">
        <div className="logo-box">MD IMPEX</div>
        <div style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: '300', color: '#b39359' }}>SERVICE CENTER</div>
        <input className="search-input" placeholder="Ieškoti..." onChange={e => setSearchTerm(e.target.value)} />
        <div style={{ display: 'flex', gap: '15px', marginLeft: 'auto' }}>
          <button className="btn-cols" onClick={() => setShowColManager(!showColManager)}>Stulpeliai</button>
          <button className="btn-add" onClick={handleAddRow}>+ Naujas Įrašas</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}><div className="cell-content" style={{textAlign: 'center'}}>#</div></th>
              {visibleCols.map(col => (
                <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
                    <div style={{ marginBottom: '5px' }}>
                      <span style={{cursor:'pointer', margin:'0 6px', color:'#b39359'}} onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), -1)}>←</span>
                      <span style={{cursor:'pointer', margin:'0 6px', color:'#b39359'}} onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), 1)}>→</span>
                    </div>
                    {col.label}
                  </div>
                  <div className="resizer" onMouseDown={e => onMouseDown(e, col.key)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={visibleCols.length + 1} style={{textAlign: 'center', padding: '100px', color: '#b39359'}}>SINCHRONIZING...</td></tr>
            ) : (
              filteredData.map(item => {
                const isOverdue = item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date();
                return (
                  <tr key={item.id} className={isOverdue ? 'row-overdue' : ''}>
                    <td>
                      <div className="cell-content" style={{ textAlign: 'center' }}>
                        <button className="btn-delete" onClick={() => handleDeleteRow(item.id)}>🗑️</button>
                      </div>
                    </td>
                    {visibleCols.map(col => (
                      <td key={col.key} onDoubleClick={() => setEditingCell({ id: item.id, field: col.key })}>
                        <div className={`cell-content ${col.key === "Sekanti patikra" && isOverdue ? 'text-overdue' : ''}`} style={{ width: `${widths[col.key]}px` }}>
                          {editingCell?.id === item.id && editingCell?.field === col.key ? (
                            col.key === "Atlikta" ? (
                              <select className="cell-edit" autoFocus defaultValue={item[col.key]} onBlur={() => setEditingCell(null)} onChange={e => handleSave(item.id, col.key, e.target.value)}>
                                <option value="Ne">Ne</option>
                                <option value="Taip">Taip</option>
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
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showColManager && (
        <div style={{ position: 'absolute', top: '85px', right: '30px', background: 'white', padding: '25px', zIndex: 100, border: '1px solid #b39359', minWidth: '280px' }}>
          <h4 style={{margin:'0 0 20px 0', textTransform: 'uppercase', fontSize: '11px', color: '#214f43'}}>Stulpeliai</h4>
          <div style={{maxHeight: '400px', overflowY: 'auto'}}>
            {columns.map(col => (
              <div key={col.key} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} />
                <span style={{ flex: 1, marginLeft: '15px', fontSize: '13px' }}>{col.label}</span>
                <span style={{ cursor: 'pointer', color: '#d32f2f', fontSize: '12px' }} onClick={() => deleteColumn(col.key)}>Išimti</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowColManager(false)} style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#214f43', color: 'white', border: 'none', cursor: 'pointer' }}>Išsaugoti</button>
        </div>
      )}
    </div>
  );
}

export default App;