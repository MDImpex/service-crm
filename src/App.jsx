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
    return savedCols ? JSON.parse(savedCols) : defaultColumns;
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

  useEffect(() => { localStorage.setItem('crm_columns', JSON.stringify(columns)) }, [columns])
  useEffect(() => { localStorage.setItem('crm_widths', JSON.stringify(widths)) }, [widths])
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

  const pushActionToHistory = (action) => setHistory(prev => [action, ...prev].slice(0, 25));

  const handleUndo = async () => {
    if (history.length === 0) return;
    const lastAction = history[0];
    setLoading(true);
    // Čia patalpinta atstatymo logika
    setHistory(history.slice(1));
    setLoading(false);
  };

  const handleAddRow = async () => {
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
  };
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden', position: 'fixed', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .main-header { height: 85px; display: flex; padding: 0 35px; background: #113c32; align-items: center; }
        .nav-menu { display: flex; gap: 20px; color: #ffffff; font-size: 14px; font-weight: bold; align-items: center; width: 100%; }
        .btn-undo { 
          color: #acca23 !important; 
          cursor: pointer; 
          font-size: 24px; 
          border: none; 
          background: none; 
          padding: 0;
          transition: opacity 0.2s;
        }
        .btn-undo.disabled { opacity: 0.3; cursor: not-allowed; }
        .nav-separator { color: rgba(255,255,255,0.2); }
        .crm-title-right { margin-left: auto; color: #acca23; font-size: 22px; font-family: 'Candara', serif; }
        .search-box-global { background: #194a3f; border: 1px solid #235d51; padding: 10px 18px; color: white; border-radius: 4px; width: 320px; margin-left: 15px; }
      `}</style>

      <div className="main-header">
        <div className="nav-menu">
          <button className={`btn-undo ${history.length === 0 ? 'disabled' : ''}`} onClick={handleUndo}>↩️</button>
          <span className="nav-separator">|</span>
          <span style={{cursor:'pointer'}} onClick={() => setShowColManager(!showColManager)}>STULPELIŲ VALDYMAS</span>
          <span style={{color: '#b4965d', cursor:'pointer', marginLeft:'20px'}} onClick={handleAddRow}>+ NAUJAS ĮRAŠAS</span>
          <input className="search-box-global" placeholder="🔍 Ieškoti..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} />
          <div className="crm-title-right">MD Impex CRM</div>
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Čia tęsiasi tavo lentelės renderinimas... */}
      </div>
    </div>
  );
}

export default App;