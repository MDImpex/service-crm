import { useEffect, useState } from 'react'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [colWidths] = useState([100, 90, 180, 180, 180, 100, 100, 100, 80, 70, 100, 120, 250]);

  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudWNydHJqYW9ha2FjaHNydWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzA5NjgsImV4cCI6MjA5MzcwNjk2OH0.srfXrYR5MCzUMBwV-mm7mkiepg2ATOW2WsG8ldm920k'
  
  const BASE_URL = 'https://enucrtrjaoakachsrubi.supabase.co/rest/v1/equipment'
  // Perduodame raktą tiesiai URL pabaigoje: ?apikey=...
  const RPC_URL = `https://enucrtrjaoakachsrubi.supabase.co/rest/v1/rpc/siusti_pilna_ataskaita?apikey=${API_KEY}`

  const headers = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 1. DUOMENŲ GAVIMAS
  async function fetchData() {
    setLoading(true)
    try {
      const response = await fetch(`${BASE_URL}?select=*&order=id.asc`, { headers })
      const data = await response.json()
      setEquipment(data || [])
    } catch (err) {
      console.error('Klaida kraunant:', err)
    } finally {
      setLoading(false)
    }
  }

  // 2. ATASKAITOS SIUNTIMAS (Raktas perduodamas per URL, o ne per Headers)
  const handleSendReport = async () => {
    if (!window.confirm("Ar siųsti vėluojančių patikrų ataskaitą?")) return;
    try {
      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Sąmoningai išimame 'apikey' ir 'Authorization' iš čia, nes įdėjome į RPC_URL viršuje
        },
        body: JSON.stringify({}) 
      });

      if (response.ok) {
        alert("Ataskaita sėkmingai išsiųsta!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Išsami serverio klaida:", errorData);
        alert(`Klaida siunčiant: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      alert("Netikėta klaida: " + err.message);
    }
  };

  // 3. PAGALBINĖS DATŲ FUNKCIJOS
  const toDbFormat = (dateStr) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(m)}/${parseInt(d)}/${y}`;
  }

  const toInputFormat = (dbStr) => {
    if (!dbStr || !dbStr.includes('/')) return '';
    const [m, d, y] = dbStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 4. DUOMENŲ ATNAUJINIMAS
  const handleSave = async (id, field, value) => {
    const isDateCol = field.includes('data') || field === "Sekanti patikra";
    const finalValue = isDateCol ? toDbFormat(value) : value;

    try {
      const response = await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ [field]: finalValue })
      });

      if (response.ok) {
        setEquipment(equipment.map(item => item.id === id ? { ...item, [field]: finalValue } : item))
        setEditingCell(null)
      } else {
        alert("Nepavyko išsaugoti.");
      }
    } catch (err) {
      alert("Klaida: " + err.message);
    }
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

  const filteredData = equipment.filter(item => {
    const s = searchTerm.toLowerCase()
    return (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(s) || 
           (item["Įrangos pavadinimas"]?.toLowerCase() || '').includes(s)
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, background: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <style>{`
        .table-container { flex: 1; overflow: auto; background: white; }
        table { border-collapse: separate; border-spacing: 0; width: max-content; }
        th { background: #0f172a; color: white; padding: 12px; font-size: 11px; position: sticky; top: 0; z-index: 10; border-right: 1px solid #334155; }
        td { padding: 8px 12px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; font-size: 13px; white-space: nowrap; }
        tr:hover { background: #f8fafc; }
        .overdue { background: #fee2e2; }
        input { padding: 4px; border: 1px solid #3b82f6; border-radius: 4px; }
      `}</style>

      <div style={{ display: 'flex', padding: '15px 25px', gap: '20px', background: '#2563eb', alignItems: 'center', color: 'white' }}>
        <h2 style={{ margin: 0 }}>MD IMPEX CRM</h2>
        <input 
          placeholder="Paieška..." 
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none' }} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <button 
          onClick={handleSendReport}
          style={{ background: '#f59e0b', border: 'none', padding: '10px 20px', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
        >
          SIŲSTI ATASKAITĄ
        </button>
      </div>

      <div className="table-container">
        {loading ? <div style={{padding: '20px'}}>Kraunami duomenys...</div> : (
          <table>
            <thead>
              <tr>
                {columns.map((col, i) => <th key={i} style={{ width: colWidths[i] }}>{col.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const isOverdue = item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date();
                return (
                  <tr key={item.id} className={isOverdue ? 'overdue' : ''}>
                    {columns.map((col, i) => (
                      <td key={i} onDoubleClick={() => setEditingCell({ id: item.id, field: col.key })}>
                        {editingCell?.id === item.id && editingCell?.field === col.key ? (
                          <input 
                            autoFocus
                            type={(col.key.includes('data') || col.key === "Sekanti patikra") ? "date" : "text"}
                            defaultValue={(col.key.includes('data') || col.key === "Sekanti patikra") ? toInputFormat(item[col.key]) : item[col.key]}
                            onBlur={(e) => handleSave(item.id, col.key, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave(item.id, col.key, e.target.value)}
                          />
                        ) : (item[col.key] || '—')}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default App;