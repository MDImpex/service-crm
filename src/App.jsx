import { useEffect, useState, useRef } from 'react'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [showColManager, setShowColManager] = useState(false)
  
  // 1. STULPELIŲ KONFIGŪRACIJA (Būsenoje, kad veiktų sukeitimas ir slėpimas)
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
    "Montavimo data": 130, "Kliento įmonės kodas": 120, "Kliento pavadinimas": 200,
    "Adresas": 200, "Įrangos pavadinimas": 200, "Serijos numeris": 150,
    "Prižiūri": 120, "Patikr. Periodiškumas": 100, "Sutartis YRA/NĖRA": 100,
    "Atlikta": 100, "Patikros data": 120, "Sekanti patikra": 130, "Komentaras": 250
  });

  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudWNydHJqYW9ha2FjaHNydWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzA5NjgsImV4cCI6MjA5MzcwNjk2OH0.srfXrYR5MCzUMBwV-mm7mkiepg2ATOW2WsG8ldm920k'
  const BASE_URL = 'https://enucrtrjaoakachsrubi.supabase.co/rest/v1/equipment'
  const RPC_URL = `https://enucrtrjaoakachsrubi.supabase.co/rest/v1/rpc/siusti_pilna_ataskaita?apikey=${API_KEY}`

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

  // 2. FUNKCIJOS: STULPELIŲ VALDYMAS
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

  // 3. FUNKCIJA: TRYNIMAS
  const handleDeleteRow = async (id) => {
    if (!window.confirm("Ar tikrai norite ištrinti šį įrašą?")) return;
    try {
      const res = await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
      });
      if (res.ok) {
        setEquipment(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) { alert("Klaida trinant: " + err.message) }
  };

  // 4. FUNKCIJA: BACKUP (CSV)
  const downloadBackupCSV = () => {
    if (equipment.length === 0) return alert("Nėra duomenų.");
    const header = columns.filter(c => c.visible).map(col => `"${col.label}"`).join(",");
    const rows = equipment.map(item => 
      columns.filter(c => c.visible).map(col => `"${(item[col.key] || '').toString().replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CRM_Backup.csv`);
    link.click();
  };

  // 5. TEMPIMO LOGIKA
  const resizerRef = useRef({ x: 0, width: 0, key: null });
  const onMouseDown = (e, key) => {
    e.preventDefault();
    resizerRef.current = { x: e.clientX, width: widths[key] || 150, key };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!resizerRef.current.key) return;
    const { x, width, key } = resizerRef.current;
    setWidths(prev => ({ ...prev, [key]: Math.max(50, width + (e.clientX - x)) }));
  };
  const onMouseUp = () => {
    resizerRef.current = { x: 0, width: 0, key: null };
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
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
    (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item["Įrangos pavadinimas"]?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <style>{`
        .table-container { flex: 1; overflow: auto; background: white; }
        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        
        th { 
          background: #0f172a; color: white; padding: 10px; font-size: 11px; 
          position: sticky; top: 0; z-index: 10; border-right: 1px solid #334155;
          text-transform: uppercase;
        }

        .col-header-content { display: flex; flex-direction: column; gap: 5px; }
        
        .col-arrows { display: flex; justify-content: center; gap: 15px; font-size: 14px; color: #94a3b8; }
        .col-arrows span:hover { cursor: pointer; color: #3b82f6; }

        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 5px; cursor: col-resize; z-index: 11; }
        .resizer:hover { background: #3b82f6; }

        td { 
          padding: 8px 12px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; 
          font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
        }

        tr:hover { background: #f8fafc; }
        .overdue { background: #fee2e2; }

        .btn { border: none; padding: 8px 15px; color: white; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-del { color: #ef4444; cursor: pointer; font-size: 16px; border: none; background: none; }
        
        .col-manager { 
          position: absolute; top: 65px; right: 20px; background: white; padding: 20px; 
          border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 100;
          border: 1px solid #e2e8f0;
        }
      `}</style>

      {/* VIRŠUTINĖ JUOSTA */}
      <div style={{ display: 'flex', padding: '15px 25px', gap: '15px', background: '#2563eb', alignItems: 'center', color: 'white' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>MD CRM</h2>
        <input 
          placeholder="Paieška..." 
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none', outline: 'none' }} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
        <button className="btn" onClick={() => setShowColManager(!showColManager)} style={{ background: '#64748b' }}>STULPELIAI</button>
        <button className="btn" onClick={downloadBackupCSV} style={{ background: '#10b981' }}>BACKUP</button>
        <button className="btn" onClick={() => alert("Ataskaita išsiųsta")} style={{ background: '#f59e0b' }}>ATASKAITA</button>
      </div>

      {/* STULPELIŲ VALDYMAS */}
      {showColManager && (
        <div className="col-manager">
          <h3 style={{marginTop: 0, fontSize: '16px'}}>Rodyti stulpelius:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {columns.map(col => (
              <label key={col.key} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} />
                {col.label}
              </label>
            ))}
          </div>
          <button className="btn" onClick={() => setShowColManager(false)} style={{ background: '#2563eb', marginTop: '15px', width: '100%' }}>Gerai</button>
        </div>
      )}

      {/* LENTELĖ */}
      <div className="table-container">
        {loading ? <div style={{padding: '20px'}}>Kraunama...</div> : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>VEIKSM.</th>
                {visibleCols.map((col) => {
                  const actualIdx = columns.findIndex(c => c.key === col.key);
                  return (
                    <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                      <div className="col-header-content">
                        <div className="col-arrows">
                          <span onClick={() => moveColumn(actualIdx, -1)}>←</span>
                          <span onClick={() => moveColumn(actualIdx, 1)}>→</span>
                        </div>
                        {col.label}
                      </div>
                      <div className="resizer" onMouseDown={e => onMouseDown(e, col.key)} />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => {
                const isOverdue = item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date();
                return (
                  <tr key={item.id} className={isOverdue ? 'overdue' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-del" onClick={() => handleDeleteRow(item.id)}>🗑️</button>
                    </td>
                    {visibleCols.map(col => (
                      <td key={col.key} onDoubleClick={() => setEditingCell({ id: item.id, field: col.key })}>
                        {editingCell?.id === item.id && editingCell?.field === col.key ? (
                          <input 
                            autoFocus 
                            defaultValue={item[col.key]} 
                            onBlur={e => handleSave(item.id, col.key, e.target.value)} 
                            style={{width: '100%', padding: '2px'}} 
                          />
                        ) : (item[col.key] || '—')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;