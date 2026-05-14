import { useEffect, useState, useRef } from 'react'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [showColManager, setShowColManager] = useState(false)
  
  // 1. STULPELIŲ KONFIGŪRACIJA
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

  // Pradiniai pločiai
  const [widths, setWidths] = useState({
    "Montavimo data": 100, "Kliento įmonės kodas": 80, "Kliento pavadinimas": 150,
    "Adresas": 150, "Įrangos pavadinimas": 150, "Serijos numeris": 100,
    "Prižiūri": 100, "Patikr. Periodiškumas": 80, "Sutartis YRA/NĖRA": 80,
    "Atlikta": 80, "Patikros data": 100, "Sekanti patikra": 100, "Komentaras": 150
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

  // STULPELIŲ VALDYMAS
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

  // PATOBULINTA TEMPIMO LOGIKA (leidžia siaurinti nepriklausomai nuo teksto)
  const resizerRef = useRef({ x: 0, width: 0, key: null });
  const onMouseDown = (e, key) => {
    e.preventDefault();
    resizerRef.current = { x: e.clientX, width: widths[key] || 100, key };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };
  const onMouseMove = (e) => {
    if (!resizerRef.current.key) return;
    const { x, width, key } = resizerRef.current;
    const newWidth = Math.max(20, width + (e.clientX - x)); // Leidžia susiaurinti iki 20px
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
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9', overflow: 'hidden' }}>
      <style>{`
        .table-container { flex: 1; overflow: auto; background: white; }
        
        table { 
          border-collapse: separate; 
          border-spacing: 0; 
          table-layout: fixed; /* BŪTINA plotams valdyti */
          width: max-content; 
        }
        
        th { 
          background: #0f172a; 
          color: white; 
          padding: 8px; 
          font-size: 11px; 
          position: sticky; 
          top: 0; 
          z-index: 10; 
          border-right: 1px solid #334155;
          overflow: hidden; /* Slepia tekstą, jei stulpelis per siauras */
        }

        .col-header-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .resizer { 
          position: absolute; 
          right: 0; 
          top: 0; 
          height: 100%; 
          width: 6px; 
          cursor: col-resize; 
          z-index: 11;
        }
        .resizer:hover { background: #3b82f6; }

        td { 
          padding: 8px; 
          border-right: 1px solid #e2e8f0; 
          border-bottom: 1px solid #e2e8f0; 
          font-size: 13px; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; /* Prideda daugtaškį, jei tekstas netelpa */
          min-width: 0; /* Leidžia siaurinti nepriklausomai nuo turinio */
        }

        tr:hover { background: #f8fafc; }
        .overdue { background: #fee2e2; }

        .top-bar { display: flex; padding: 10px 20px; gap: 10px; background: #2563eb; align-items: center; color: white; }
        .col-manager { position: absolute; top: 50px; right: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); z-index: 100; color: black; border: 1px solid #ccc; }
        .btn-arrow { cursor: pointer; padding: 0 5px; color: #94a3b8; font-size: 14px; }
        .btn-arrow:hover { color: white; }
      `}</style>

      <div className="top-bar">
        <h2 style={{ margin: 0, fontSize: '16px' }}>MD CRM</h2>
        <input 
          placeholder="Paieška..." 
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: 'none' }} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
        <button onClick={() => setShowColManager(!showColManager)} style={{ cursor: 'pointer', padding: '8px' }}>STULPELIAI</button>
      </div>

      {showColManager && (
        <div className="col-manager">
          <h4 style={{marginTop: 0}}>Matomi stulpeliai:</h4>
          {columns.map(col => (
            <div key={col.key}>
              <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} /> {col.label}
            </div>
          ))}
          <button onClick={() => setShowColManager(false)} style={{marginTop: '10px', width: '100%'}}>Uždaryti</button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              {visibleCols.map((col, idx) => {
                const globalIdx = columns.findIndex(c => c.key === col.key);
                return (
                  <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                    <div className="col-header-content">
                      <div style={{display: 'flex', gap: '10px'}}>
                        <span className="btn-arrow" onClick={() => moveColumn(globalIdx, -1)}>←</span>
                        <span className="btn-arrow" onClick={() => moveColumn(globalIdx, 1)}>→</span>
                      </div>
                      <span style={{overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center'}}>
                        {col.label}
                      </span>
                    </div>
                    <div className="resizer" onMouseDown={e => onMouseDown(e, col.key)} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id} className={item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date() ? 'overdue' : ''}>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => handleDeleteRow(item.id)} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🗑️</button>
                </td>
                {visibleCols.map(col => (
                  <td key={col.key} onDoubleClick={() => setEditingCell({ id: item.id, field: col.key })}>
                    {editingCell?.id === item.id && editingCell?.field === col.key ? (
                      <input 
                        autoFocus 
                        defaultValue={item[col.key]} 
                        onBlur={e => handleSave(item.id, col.key, e.target.value)} 
                        style={{width: '100%'}} 
                      />
                    ) : (item[col.key] || '—')}
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