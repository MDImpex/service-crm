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
    "Prižiūri": 100, "Patikr. Periodiškumas": 80, "Sutartis YRA/NĖRA": 80,
    "Atlikta": 80, "Patikros data": 100, "Sekanti patikra": 110, "Komentaras": 200
  });

  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudWNydHJqYW9ha2FjaHNydWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzA5NjgsImV4cCI6MjA5MzcwNjk2OH0.srfXrYR5MCzUMBwV-mm7mkiepg2ATOW2WsG8ldm920k'
  const BASE_URL = 'https://enucrtrjaoakachsrubi.supabase.co/rest/v1/equipment'

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const response = await fetch(`${BASE_URL}?select=*&order=id.asc`, { 
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } 
      })
      const data = await response.json()
      setEquipment(data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const moveColumn = (index, direction) => {
    const newCols = [...columns];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    setColumns(newCols);
  };

  const toggleColumn = (key) => {
    setColumns(columns.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  const deleteColumn = (key) => {
    if (window.confirm(`Ar tikrai norite visam laikui pašalinti stulpelį iš vaizdo?`)) {
      setColumns(columns.filter(c => c.key !== key));
    }
  };

  const handleDeleteRow = async (id) => {
    if (!window.confirm("Ištrinti įrašą?")) return;
    try {
      const res = await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
      });
      if (res.ok) setEquipment(prev => prev.filter(item => item.id !== id));
    } catch (err) { alert(err.message) }
  };

  const resizerRef = useRef({ x: 0, width: 0, key: null });
  const onMouseDown = (e, key) => {
    e.preventDefault();
    resizerRef.current = { x: e.clientX, width: widths[key], key };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };
  const onMouseMove = (e) => {
    if (!resizerRef.current.key) return;
    const { x, width, key } = resizerRef.current;
    const newWidth = Math.max(30, width + (e.clientX - x));
    setWidths(prev => ({ ...prev, [key]: newWidth }));
  };
  const onMouseUp = () => {
    resizerRef.current = { x: 0, width: 0, key: null };
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'default';
  };

  const handleSave = async (id, field, value) => {
    try {
      await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      setEquipment(equipment.map(item => item.id === id ? { ...item, [field]: value } : item));
      setEditingCell(null);
    } catch (err) { console.error(err) }
  };

  const visibleCols = columns.filter(c => c.visible);
  const filteredData = equipment.filter(item => 
    (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9', overflow: 'hidden', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      <style>{`
        .table-container { flex: 1; overflow: auto; background: white; }
        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        th, td { padding: 0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; overflow: hidden; }
        th { background: #0f172a; color: white !important; position: sticky; top: 0; zIndex: 10; border-right: 1px solid #334155; font-size: 11px; text-transform: uppercase; }
        .header-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; padding: 5px 0; }
        .cell-content { padding: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; box-sizing: border-box; display: block; font-size: 13px; color: #1e293b; }
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 6px; cursor: col-resize; z-index: 11; }
        .resizer:hover { background: #3b82f6; }
        tr:hover { background: #f8fafc; }
        .overdue { background: #fee2e2; }
        
        .top-bar { display: flex; padding: 10px; gap: 10px; background: #2563eb; align-items: center; color: white; flex-wrap: nowrap; }
        .action-btns { display: flex; gap: 10px; align-items: center; }
        .btn-main { background: white; color: #2563eb; border: none; padding: 8px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 13px; }
        .btn-main:hover { background: #f1f5f9; }
        
        .btn-arrow { cursor: pointer; color: #60a5fa !important; font-size: 14px; margin: 0 4px; font-weight: bold; }
        .del-col-btn { color: #ef4444; cursor: pointer; margin-left: auto; font-size: 14px; padding: 2px 5px; }
      `}</style>

      {/* VIRŠUTINĖ JUOSTA SU VISU TURINIU */}
      <div className="top-bar">
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', minWidth: '80px' }}>MD CRM</h2>
        
        <input 
          placeholder="Paieška pagal klientą..." 
          style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '4px', border: 'none', fontFamily: 'inherit' }} 
          onChange={e => setSearchTerm(e.target.value)} 
        />

        <div className="action-btns">
          {/* ČIA GALI ĮRAŠYTI SAVO SENUS MYGTUKUS */}
          <button className="btn-main" onClick={() => alert('Čia pridėsite įrašą')}>+ PRIDĖTI</button>
          
          <button 
            className="btn-main" 
            style={{ background: '#0f172a', color: 'white' }}
            onClick={() => setShowColManager(!showColManager)}
          >
            STULPELIAI
          </button>
        </div>
      </div>

      {showColManager && (
        <div className="col-manager" style={{ position: 'absolute', top: '55px', right: '10px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 5px 20px rgba(0,0,0,0.2)', zIndex: 100, color: 'black', border: '1px solid #ccc', minWidth: '220px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Rodyti stulpelius</h4>
          {columns.map(col => (
            <div key={col.key} style={{ padding: '5px 0', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} style={{ marginRight: '8px' }} /> 
                <span style={{ fontSize: '13px', flex: 1 }}>{col.label}</span>
                <span className="del-col-btn" onClick={() => deleteColumn(col.key)}>🗑️</span>
            </div>
          ))}
          <button onClick={() => setShowColManager(false)} style={{marginTop: '15px', width: '100%', cursor: 'pointer', padding: '8px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px'}}>Uždaryti</button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}><div className="cell-content" style={{width: '40px', color: 'white'}}>#</div></th>
              {visibleCols.map((col) => {
                const globalIdx = columns.findIndex(c => c.key === col.key);
                return (
                  <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                    <div className="header-inner" style={{ width: `${widths[col.key]}px` }}>
                      <div style={{ marginBottom: '2px' }}>
                        <span className="btn-arrow" onClick={() => moveColumn(globalIdx, -1)}>←</span>
                        <span className="btn-arrow" onClick={() => moveColumn(globalIdx, 1)}>→</span>
                      </div>
                      <span style={{ color: 'white', fontWeight: 'bold' }}>{col.label}</span>
                    </div>
                    <div className="resizer" onMouseDown={e => onMouseDown(e, col.key)} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={visibleCols.length + 1} style={{ padding: '20px', textAlign: 'center' }}>Kraunama...</td></tr>
            ) : filteredData.map(item => (
              <tr key={item.id} className={item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date() ? 'overdue' : ''}>
                <td>
                  <div className="cell-content" style={{width: '40px', textAlign: 'center'}}>
                    <button onClick={() => handleDeleteRow(item.id)} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🗑️</button>
                  </div>
                </td>
                {visibleCols.map(col => (
                  <td key={col.key} onDoubleClick={() => setEditingCell({ id: item.id, field: col.key })}>
                    <div className="cell-content" style={{ width: `${widths[col.key]}px` }}>
                      {editingCell?.id === item.id && editingCell?.field === col.key ? (
                        <input 
                          autoFocus 
                          defaultValue={item[col.key]} 
                          onBlur={e => handleSave(item.id, col.key, e.target.value)} 
                          style={{width: '100%', border: '1px solid #2563eb', padding: '2px', fontFamily: 'inherit'}} 
                        />
                      ) : (item[col.key] || '—')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;