import { useEffect, useState, useRef } from 'react';

function App() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [showColManager, setShowColManager] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);

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
    const savedCols = localStorage.getItem('crm_columns');
    return savedCols ? JSON.parse(savedCols) : defaultColumns;
  });

  const [widths, setWidths] = useState(() => {
    const savedWidths = localStorage.getItem('crm_widths');
    return savedWidths ? JSON.parse(savedWidths) : {
      "Montavimo data": 120, "Kliento įmonės kodas": 90, "Kliento pavadinimas": 160,
      "Adresas": 180, "Įrangos pavadinimas": 160, "Serijos numeris": 120,
      "Prižiūri": 120, "Patikr. Periodiškumas": 90, "Patikros data": 110,
      "Sekanti patikra": 110, "Atk. Periodas": 100, "Komentaras": 180, "Sutartis YRA/NĖRA": 120, "Atlikta": 100
    };
  });

  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudWNydHJqYW9ha2FjaHNydWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzA5NjgsImV4cCI6MjA5MzcwNjk2OH0.srfXrYR5MCzUMBwV-mm7mkiepg2ATOW2WsG8ldm920k';
  const BASE_URL = 'https://enucrtrjaoakachsrubi.supabase.co/rest/v1/equipment';

  useEffect(() => { localStorage.setItem('crm_columns', JSON.stringify(columns)) }, [columns]);
  useEffect(() => { localStorage.setItem('crm_widths', JSON.stringify(widths)) }, [widths]);
  useEffect(() => { fetchData() }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}?select=*&order=id.desc`, {
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
      });
      const data = await response.json();
      setEquipment(data || []);
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  // PATAISYTA: Tiesioginis siuntimas į Resend be cors-anywhere tarpininko
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
          from: 'onboarding@resend.dev', // Jei turite savo domeną, pakeiskite į jį
          to: [MY_RECEIVER_EMAIL],
          subject: `🚨 SKUBUS: ${item["Kliento pavadinimas"]}`,
          html: `<h3>Skubus gedimas</h3><p>Klientas: ${item["Kliento pavadinimas"]}</p><p>Detalės: ${faultDetails}</p>`
        })
      });
      console.log("Laiškas išsiųstas!");
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
        body: JSON.stringify({ "Kliento pavadinimas": "NAUJAS", "Atlikta": "Ne" })
      });
      if (res.ok) {
        const [newItem] = await res.json();
        setEquipment([newItem, ...equipment]);
        pushActionToHistory({ type: 'ADD_ROW', id: newItem.id });
      }
    } catch (err) { console.error(err) }
  };

  const handleSave = async (id, field, value) => {
    const currentItem = equipment.find(item => item.id === id);
    if (!currentItem) return;
    
    const newValue = value.toString().trim();
    let updates = { [field]: newValue };

    if (field === "Atlikta" && newValue === "Taip") {
        const today = new Date();
        updates["Patikros data"] = today.toISOString().split('T')[0];
        // ... (išlaikytas jūsų periodiškumo skaičiavimas)
    }

    try {
      await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      // Tikriname gedimą
      if (field === "Prižiūri" && newValue.toLowerCase().includes('gedimas') && !newValue.toLowerCase().includes('sutaisyta')) {
        sendUrgentEmail({ ...currentItem, ...updates }, newValue);
      }

      setEquipment(equipment.map(item => item.id === id ? { ...item, ...updates } : item));
      setEditingCell(null);
    } catch (err) { console.error(err); }
  };

  // ... (likusi kodo dalis su handleUndo, handleStartEdit, moveColumn, render logika...)
  // Pastaba: Visą originalią logiką, kuri buvo jūsų kode (handleUndo, render, style), 
  // palikite kaip buvo, nes ji veikė gerai. Pakeistas tik sendUrgentEmail siuntimo būdas.

  // ... (Tęskite su savo originalia JSX struktūra ir kitomis funkcijomis)
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
       {/* Čia jūsų originalus return kodas */}
    </div>
  );
}

export default App;