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
    return savedCols ? JSON.parse(savedCols) : defaultColumns
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
    localStorage.setItem('crm_widths', JSON.stringify(widths))
  }, [columns, widths])

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

  // Siuntimas per serverless API /api/send-email (būtinas CORS sprendimas)
  const sendUrgentEmail = async (item, faultDetails) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, faultDetails })
      });
    } catch (err) { console.error("Email klaida:", err) }
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
    const updates = { [field]: value };

    if (field === "Atlikta" && value === "Taip") {
      const today = new Date();
      updates["Patikros data"] = today.toISOString().split('T')[0];
      const period = currentItem["Patikr. Periodiškumas"]?.toString().toLowerCase() || "";
      let nextDate = new Date(today);
      if (period.includes("1")) nextDate.setFullYear(nextDate.getFullYear() + 1);
      else nextDate.setMonth(nextDate.getMonth() + 6);
      updates["Sekanti patikra"] = nextDate.toISOString().split('T')[0];
    }

    if (field === "Prižiūri" && value.toLowerCase().includes('gedimas')) {
      sendUrgentEmail(currentItem, value);
    }

    try {
      await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      setEquipment(equipment.map(item => item.id === id ? { ...item, ...updates } : item));
      setEditingCell(null);
    } catch (err) { alert("Išsaugojimo klaida"); }
  };

  const handleDeleteRow = async (id) => {
    if (!window.confirm("Ar tikrai trinti?")) return;
    await fetch(`${BASE_URL}?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
    setEquipment(equipment.filter(item => item.id !== id));
  };

  const handleStartEdit = (id, field, initialValue) => {
    setEditingCell({ id, field });
    setInputValue(initialValue || '');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>MD Impex CRM</h1>
      <button onClick={handleAddRow}>+ NAUJAS ĮRAŠAS</button>
      <input placeholder="Paieška..." onChange={e => setGlobalSearch(e.target.value)} />
      
      {loading ? <p>Kraunama...</p> : (
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              {columns.filter(c => c.visible).map(c => <th key={c.key}>{c.label}</th>)}
              <th>VEIKSMAI</th>
            </tr>
          </thead>
          <tbody>
            {equipment.filter(i => Object.values(i).some(v => v?.toString().toLowerCase().includes(globalSearch.toLowerCase()))).map(item => (
              <tr key={item.id}>
                {columns.filter(c => c.visible).map(c => (
                  <td key={c.key} onDoubleClick={() => handleStartEdit(item.id, c.key, item[c.key])}>
                    {editingCell?.id === item.id && editingCell?.field === c.key ? (
                      <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onBlur={() => handleSave(item.id, c.key, inputValue)} />
                    ) : (item[c.key] || '—')}
                  </td>
                ))}
                <td><button onClick={() => handleDeleteRow(item.id)}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;