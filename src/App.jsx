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
    "Montavimo data": 100, "Kliento įmonės kodas": 90, "Kliento pavadinimas": 180,
    "Adresas": 180, "Įrangos pavadinimas": 180, "Serijos numeris": 120,
    "Prižiūri": 100, "Patikr. Periodiškumas": 120, "Sutartis YRA/NĖRA": 80,
    "Atlikta": 80, "Patikros data": 100, "Sekanti patikra": 110, "Komentaras": 200
  });

  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudWNydHJqYW9ha2FjaHNydWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzA5NjgsImV4cCI6MjA5MzcwNjk2OH0.srfXrYR5MCzUMBwV-mm7mkiepg2ATOW2WsG8ldm920k'
  const BASE_URL = 'https://enucrtrjaoakachsrubi.supabase.co/rest/v1/equipment'

  useEffect(() => { fetchData() }, [])

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
        headers: { 
          'apikey': API_KEY, 
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
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
      const todayStr = today.toISOString().split('T')[0];
      updates["Patikros data"] = todayStr;

      const period = currentItem["Patikr. Periodiškumas"]?.toString().toLowerCase() || "";
      let nextDate = new Date(today);
      
      if (period.includes("1") || period.includes("metus") || period.includes("12")) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else if (period.includes("2") || period.includes("6")) {
        nextDate.setMonth(nextDate.getMonth() + 6);
      } else if (period.includes("4") || period.includes("3")) {
        nextDate.setMonth(nextDate.getMonth() + 3);
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      
      updates["Sekanti patikra"] = nextDate.toISOString().split('T')[0];
    }

    try {
      await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': API_KEY, 
          'Authorization': `Bearer ${API_KEY}`, 
          'Content-Type': 'application/json' 
        },
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
    await fetch(`${BASE_URL}?id=eq.${id}`, { 
      method: 'DELETE', 
      headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } 
    });
    setEquipment(prev => prev.filter(item => item.id !== id));
  };

  const resizerRef = useRef({ x: 0, width: 0, key: null });
  const onMouseDown = (e, key) => {
    resizerRef.current = { x: e.clientX, width: widths[key], key };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
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

  const visibleCols = columns.filter(c => c.visible);
  const filteredData = equipment.filter(item => 
    (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      <style>{`
        .table-container { flex: 1; overflow: auto; background: white; }
        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        th, td { padding: 0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; position: relative; }
        th { background: #0f172a; color: white !important; position: sticky; top: 0; zIndex: 10; font-size: 11px; text-transform: uppercase; }
        .header-inner { display: flex; flex-direction: column; align-items: center; padding: 5px 0; }
        .cell-content { padding: 8px; font-size: 13px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .date-overdue { color: #ef4444 !important; font-weight: bold; }
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 6px; cursor: col-resize; z-index: 11; }
        tr:hover { background: #f8fafc; }
        .top-bar { display: flex; padding: 10px; gap: 15px; background: #2563eb; align-items: center; color: white; }
        .btn-main { background: white; color: #2563eb; border: none; padding: 8px 15px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px; }
        .btn-arrow { cursor: pointer; color: #60a5fa !important; font-size: 14px; margin: 0 3px; }
        .cell-edit { width: 100%; border: 1px solid #2563eb; padding: 4px; font-size: 13px; outline: none; }
      `}</style>

      <div className="top-bar">
        <h2 style={{ margin: 0, fontSize: '18px' }}>MD CRM</h2>
        <input 
          style={{ width: '220px', padding: '8px', borderRadius: '4px', border: 'none', outline: 'none' }} 
          placeholder="Ieškoti kliento..." 
          onChange={e => setSearchTerm(e.target.value)} 
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-main" onClick={handleAddRow}>+ PRIDĖTI ĮRAŠĄ</button>
          <button className="btn-main" style={{ background: '#0f172a', color: 'white' }} onClick={() => setShowColManager(!showColManager)}>STULPELIAI</button>
        </div>
      </div>

      {showColManager && (
        <div style={{ position: 'absolute', top: '60px', right: '15px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', zIndex: 100, color: 'black', border: '1px solid #ccc', minWidth: '220px' }}>
          <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee' }}>Nustatymai</h4>
          {columns.map(col => (
            <div key={col.key} style={{ display: 'flex', alignItems: 'center', padding: '5px 0' }}>
              <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} />
              <span style={{ flex: 1, marginLeft: '10px', fontSize: '13px' }}>{col.label}</span>
              <span style={{ cursor: 'pointer', color: '#ef4444', fontSize: '16px' }} onClick={() => deleteColumn(col.key)}>🗑️</span>
            </div>
          ))}
          <button onClick={() => setShowColManager(false)} style={{ width: '100%', marginTop: '15px', padding: '8px', cursor: 'pointer', background: '#f1f5f9', border: '1px solid #ccc', borderRadius: '4px' }}>Uždaryti</button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}><div className="cell-content" style={{textAlign: 'center'}}>#</div></th>
              {visibleCols.map(col => (
                <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                  <div className="header-inner">
                    <div>
                      <span className="btn-arrow" onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), -1)}>←</span>
                      <span className="btn-arrow" onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), 1)}>→</span>
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
              <tr><td colSpan={visibleCols.length + 1} style={{textAlign: 'center', padding: '50px'}}>Kraunama...</td></tr>
            ) : filteredData.map(item => {
              const isOverdue = item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date();
              return (
                <tr key={item.id}>
                  <td><div className="cell-content" style={{ textAlign: 'center' }}><button onClick={() => handleDeleteRow(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button></div></td>
                  {visibleCols.map(col => (
                    <td key={col.key} onDoubleClick={() => setEditingCell({ id: item.id, field: col.key })}>
                      <div className={`cell-content ${col.key === "Sekanti patikra" && isOverdue ? 'date-overdue' : ''}`} style={{ width: `${widths[col.key]}px` }}>
                        {editingCell?.id === item.id && editingCell?.field === col.key ? (
                          col.key === "Atlikta" ? (
                            <select 
                              className="cell-edit" 
                              autoFocus 
                              defaultValue={item[col.key]} 
                              onBlur={() => setEditingCell(null)}
                              onChange={e => handleSave(item.id, col.key, e.target.value)}
                            >
                              <option value="Ne">Ne</option>
                              <option value="Taip">Taip</option>
                            </select>
                          ) : (
                            <input 
                              autoFocus 
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;