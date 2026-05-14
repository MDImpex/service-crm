import { useEffect, useState, useRef } from 'react'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  
  // Išsaugota stulpelių pločių konfigūracija
  const [widths, setWidths] = useState({
    "Montavimo data": 130,
    "Kliento įmonės kodas": 120,
    "Kliento pavadinimas": 250,
    "Adresas": 250,
    "Įrangos pavadinimas": 250,
    "Serijos numeris": 150,
    "Prižiūri": 130,
    "Patikr. Periodiškumas": 100,
    "Sutartis YRA/NĖRA": 100,
    "Atlikta": 100,
    "Patikros data": 130,
    "Sekanti patikra": 140,
    "Komentaras": 300
  });

  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudWNydHJqYW9ha2FjaHNydWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzA5NjgsImV4cCI6MjA5MzcwNjk2OH0.srfXrYR5MCzUMBwV-mm7mkiepg2ATOW2WsG8ldm920k'
  const BASE_URL = 'https://enucrtrjaoakachsrubi.supabase.co/rest/v1/equipment'
  const RPC_URL = `https://enucrtrjaoakachsrubi.supabase.co/rest/v1/rpc/siusti_pilna_ataskaita?apikey=${API_KEY}`

  useEffect(() => { fetchData() }, [])

  // 1. DUOMENŲ GAVIMAS
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

  // 2. STULPELIŲ TAMPYMO LOGIKA (Išsaugota konfigūracija)
  const resizerRef = useRef({ x: 0, width: 0, key: null });

  const onMouseDown = (e, key) => {
    e.preventDefault();
    resizerRef.current = { x: e.clientX, width: widths[key], key };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const onMouseMove = (e) => {
    if (!resizerRef.current.key) return;
    const { x, width, key } = resizerRef.current;
    const delta = e.clientX - x;
    const newWidth = Math.max(80, width + delta);
    setWidths(prev => ({ ...prev, [key]: newWidth }));
  };

  const onMouseUp = () => {
    resizerRef.current = { x: 0, width: 0, key: null };
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  // 3. ATASKAITOS SIUNTIMAS
  const handleSendReport = async () => {
    if (!window.confirm("Siųsti vėluojančių patikrų ataskaitą?")) return;
    try {
      const res = await fetch(RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const result = await res.json();
      if (result.rasta_irenginiu > 0) {
        alert(`SĖKMĖ: Rasta ir ataskaitai paruošta ${result.rasta_irenginiu} vėluojančių patikrų!`);
      } else {
        alert("INFORMACIJA: Vėluojančių patikrų nerasta.");
      }
    } catch (err) { alert("Klaida: " + err.message) }
  };

  // 4. DUOMENŲ BAZĖS KOPIJA (BACKUP)
  const downloadBackupCSV = () => {
    if (equipment.length === 0) return alert("Nėra duomenų kopijai.");
    const header = columns.map(col => `"${col.label}"`).join(",");
    const rows = equipment.map(item => 
      columns.map(col => `"${(item[col.key] || '').toString().replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `CRM_Backup_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. IŠSAUGOJIMAS PO REDAGAVIMO
  const handleSave = async (id, field, value) => {
    try {
      const res = await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': API_KEY, 
          'Authorization': `Bearer ${API_KEY}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ [field]: value })
      });
      if (res.ok) {
        setEquipment(equipment.map(item => item.id === id ? { ...item, [field]: value } : item));
        setEditingCell(null);
      }
    } catch (err) { alert("Klaida saugant: " + err.message) }
  }

  const columns = [
    { label: "Montavimas", key: "Montavimo data" },
    { label: "Įm. Kodas", key: "Kliento įmonės kodas" },
    { label: "Klientas", key: "Kliento pavadinimas" },
    { label: "Adresas", key: "Adresas" },
    { label: "Įranga", key: "Įrangos pavadinimas" },
    { label: "S/N", key: "Serijos numeris" },
    { label: "Prižiūri", key: "Prižiūri" },
    { label: "Periodas", key: "Patikr. Periodiškumas" },
    { label: "Sutartis", key: "Sutartis YRA/NĖRA" },
    { label: "Atlikta", key: "Atlikta" },
    { label: "Pask. Patikra", key: "Patikros data" },
    { label: "Sekanti patikra", key: "Sekanti patikra" },
    { label: "Komentaras", key: "Komentaras" }
  ];

  const filteredData = equipment.filter(item => 
    (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (item["Įrangos pavadinimas"]?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9', overflow: 'hidden' }}>
      <style>{`
        .table-container { flex: 1; overflow: auto; background: white; }
        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: fit-content; }
        th { 
          background: #0f172a; color: white; padding: 12px; font-size: 11px; 
          position: sticky; top: 0; z-index: 10; border-right: 1px solid #334155;
          text-align: left; position: relative;
        }
        .resizer {
          position: absolute; right: 0; top: 0; height: 100%; width: 6px;
          cursor: col-resize; z-index: 20;
        }
        .resizer:hover { background: rgba(59, 130, 246, 0.5); }
        td { 
          padding: 8px 12px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; 
          font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        tr:hover { background: #f8fafc; }
        .overdue { background: #fee2e2; }
        .top-bar { display: flex; padding: 15px 25px; gap: 15px; background: #2563eb; align-items: center; color: white; }
        .btn { border: none; padding: 10px 18px; borderRadius: 5px; color: white; fontWeight: bold; cursor: pointer; transition: 0.2s; }
      `}</style>

      <div className="top-bar">
        <h2 style={{ margin: 0, fontSize: '18px' }}>MD IMPEX CRM</h2>
        <input 
          placeholder="Paieška..." 
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none', color: '#000', outline: 'none' }} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <button className="btn" onClick={downloadBackupCSV} style={{ background: '#10b981' }}>
          backup (CSV)
        </button>
        <button className="btn" onClick={handleSendReport} style={{ background: '#f59e0b' }}>
          SIŲSTI ATASKAITĄ
        </button>
      </div>

      <div className="table-container">
        {loading ? <div style={{padding: '20px'}}>Kraunami duomenys...</div> : (
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                    {col.label}
                    <div className="resizer" onMouseDown={(e) => onMouseDown(e, col.key)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const isOverdue = item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date();
                return (
                  <tr key={item.id} className={isOverdue ? 'overdue' : ''}>
                    {columns.map((col) => (
                      <td key={col.key} onDoubleClick={() => setEditingCell({ id: item.id, field: col.key })}>
                        {editingCell?.id === item.id && editingCell?.field === col.key ? (
                          <input 
                            autoFocus
                            style={{ width: '90%', padding: '4px' }}
                            type={(col.key.includes('data') || col.key === "Sekanti patikra") ? "date" : "text"}
                            defaultValue={item[col.key]}
                            onBlur={(e) => handleSave(item.id, col.key, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave(item.id, col.key, e.target.value)}
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