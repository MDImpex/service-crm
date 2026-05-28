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
    if (savedCols) {
      const parsed = JSON.parse(savedCols);
      const hasOldLabel = parsed.some(c => c.key === "Kliento įmonės kodas" && c.label !== "ĮM. KODAS");
      if (hasOldLabel) {
        localStorage.removeItem('crm_columns');
        return defaultColumns;
      }
      return parsed;
    }
    return defaultColumns;
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

  // PATAISYTA FUNKCIJA: Tiesioginis siuntimas, pašalinant probleminį proxy
  const sendUrgentEmail = async (item, faultDetails) => {
    const MY_RESEND_KEY = 're_Sj2Kx2LS_3VFCkGgt4ZfWkSZuVCnB2eGM'; 
    const MY_RECEIVER_EMAIL = 'valdasjanciauskas@gmail.com';

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MY_RESEND_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'MD Impex CRM <onboarding@resend.dev>',
          to: [MY_RECEIVER_EMAIL],
          subject: `🚨 SKUBUS IŠKVIETIMAS: Gedimas - ${item["Kliento pavadinimas"] || 'Klientas'}`,
          html: `<div style="font-family:Arial;padding:20px;"><h2>🚨 Skubus gedimas</h2><p>Klientas: ${item["Kliento pavadinimas"]}</p><p>Detalės: <b>${faultDetails}</b></p></div>`
        })
      });
    } catch (err) { console.error("Email klaida:", err) }
  };

  const pushActionToHistory = (action) => { setHistory(prev => [action, ...prev].slice(0, 25)); };

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
    const newValue = value !== undefined ? value.toString().trim() : '';

    if (newValue === currentItem[field]) { setEditingCell(null); return; }

    pushActionToHistory({ type: 'EDIT_CELL', id, field, oldValue: currentItem[field] });

    let updates = { [field]: newValue };
    if (field === "Atlikta" && newValue === "Taip") {
      const today = new Date();
      updates["Patikros data"] = today.toISOString().split('T')[0];
      let nextDate = new Date(today); nextDate.setFullYear(nextDate.getFullYear() + 1);
      updates["Sekanti patikra"] = nextDate.toISOString().split('T')[0];
    }

    try {
      await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (field === "Prižiūri" && newValue.toLowerCase().includes('gedimas') && !newValue.toLowerCase().includes('sutaisyta')) {
        sendUrgentEmail({ ...currentItem, ...updates }, newValue);
      }

      setEquipment(equipment.map(item => item.id === id ? { ...item, ...updates } : item));
      setEditingCell(null);
    } catch (err) { console.error(err); setEditingCell(null); }
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    const lastAction = history[0];
    try {
      if (lastAction.type === 'EDIT_CELL') {
        await fetch(`${BASE_URL}?id=eq.${lastAction.id}`, {
          method: 'PATCH',
          headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ [lastAction.field]: lastAction.oldValue })
        });
        setEquipment(prev => prev.map(item => item.id === lastAction.id ? { ...item, [lastAction.field]: lastAction.oldValue } : item));
      }
      setHistory(prev => prev.slice(1));
    } catch (err) { console.error(err); }
  };

  const handleStartEdit = (id, field, val) => { setEditingCell({ id, field }); setInputValue(val || ''); };
  const moveColumn = (index, dir) => {
    const newCols = [...columns];
    const target = index + dir;
    if (target >= 0 && target < newCols.length) {
      [newCols[index], newCols[target]] = [newCols[target], newCols[index]];
      setColumns(newCols);
    }
  };
  const toggleColumn = (key) => setColumns(columns.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  const deleteColumnEntirely = (key) => { if (window.confirm("Trinti stulpelį?")) setColumns(columns.filter(c => c.key !== key)); };
  const handleDeleteRow = async (id) => {
    if (!window.confirm("Trinti įrašą?")) return;
    await fetch(`${BASE_URL}?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
    setEquipment(prev => prev.filter(item => item.id !== id));
  };

  const resizerRef = useRef({ x: 0, width: 0, key: null });
  const onMouseMove = (e) => {
    if (!resizerRef.current.key) return;
    setWidths(prev => ({ ...prev, [resizerRef.current.key]: Math.max(30, resizerRef.current.width + (e.clientX - resizerRef.current.x)) }));
  };
  const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); resizerRef.current.key = null; };
  const onMouseDown = (e, key) => { resizerRef.current = { x: e.clientX, width: widths[key], key }; document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); };

  const visibleCols = columns.filter(c => c.visible);
  const filteredData = equipment.filter(i => (i["Kliento pavadinimas"] || "").toLowerCase().includes(globalSearch.toLowerCase()));
  const sortedAndFilteredData = [...filteredData].sort((a, b) => {
    const aF = (a["Prižiūri"] || "").toLowerCase().includes('gedimas');
    const bF = (b["Prižiūri"] || "").toLowerCase().includes('gedimas');
    return aF === bF ? 0 : aF ? -1 : 1;
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Arial' }}>
      <div style={{ height: '85px', display: 'flex', padding: '0 35px', background: '#113c32', alignItems: 'center' }}>
        <button onClick={handleUndo} disabled={history.length === 0}>↩️</button>
        <button onClick={() => setShowColManager(!showColManager)}>STULPELIAI</button>
        <button onClick={handleAddRow}>+ NAUJAS</button>
        <input value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="Paieška..." />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              {visibleCols.map(col => (
                <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                  {col.label} <span onMouseDown={e => onMouseDown(e, col.key)}>|</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredData.map(item => (
              <tr key={item.id}>
                {visibleCols.map(col => (
                  <td key={col.key} onDoubleClick={() => handleStartEdit(item.id, col.key, item[col.key])}>
                    {editingCell?.id === item.id && editingCell?.field === col.key ? (
                      <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, inputValue)} />
                    ) : item[col.key]}
                  </td>
                ))}
                <td><button onClick={() => handleDeleteRow(item.id)}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default App;