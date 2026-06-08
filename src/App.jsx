import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Konstantos
const API_KEY = 'JŪSŲ_ANON_API_KEY'; // Įsirašykite savo raktą čia
const BASE_URL = 'https://enucrtrjaoakachsrubi.supabase.co/rest/v1';

const getProgressColor = (progress) => {
  const hue = (1 - progress) * 120;
  return `hsl(${hue}, 100%, 40%)`;
};

const supabase = createClient('https://enucrtrjaoakachsrubi.supabase.co', API_KEY);

function App() {
  // --- STATE HOOKAI ---
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [showColManager, setShowColManager] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [komentarai, setKomentarai] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [klientoFailai, setKlientoFailai] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    
    // 1. Visada paimam tik pirmus 10 simbolių (kad atsikratytume " 00:00")
    const s = dateString.toString().substring(0, 10);
    
    // 2. Jei formatas 2021.01.29 (taškai) -> keičiam į 2021-01-29
    if (s.includes('.')) return s.replace(/\./g, '-');
    
    // 3. Jei formatas 8/31/2025 (MM/DD/YYYY) -> perstumiam į 2025-08-31
    if (s.includes('/')) {
       const parts = s.split('/');
       if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    
    // 4. Jei jau YYYY-MM-DD, paliekam kaip yra
    return s;
  };

  // --- KOMENTARŲ FUNKCIJOS ---
  const fetchKomentarai = async (id) => {
  if (!id) return;
  // JOKIO "equipment/" ČIA!
  const res = await fetch(`https://enucrtrjaoakachsrubi.supabase.co/rest/v1/komentarai?equipment_id=eq.${id}&order=sukurta_data.desc`, {
    headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
  });
  if (res.ok) {
    const data = await res.json();
    setKomentarai(data);
  }
};

  const deleteComment = async (id) => {
  if (!window.confirm("Ar tikrai norite trinti?")) return;
  // JOKIO "equipment/" ČIA!
  await fetch(`https://enucrtrjaoakachsrubi.supabase.co/rest/v1/komentarai?id=eq.${id}`, {
    method: 'DELETE',
    headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
  });
  fetchKomentarai(selectedClient.id);
};

  const updateComment = async (id, newText) => {
    // SVARBU: čia URL turi būti tik '/komentarai', o ne '/equipment/komentarai'
    const res = await fetch(`https://enucrtrjaoakachsrubi.supabase.co/rest/v1/komentarai?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 
        'apikey': API_KEY, 
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ tekstas: newText })
    });
    
    if (res.ok) {
      setEditingComment(null);
      fetchKomentarai(selectedClient.id);
    } else {
      console.error("Klaida redaguojant:", await res.text());
    }
  };

  // --- FAILŲ FUNKCIJOS ---
  const deleteFile = async (id) => {
  if (!window.confirm("Ar tikrai norite ištrinti failą?")) return;
  // JOKIO "equipment/" ČIA!
  await fetch(`https://enucrtrjaoakachsrubi.supabase.co/rest/v1/klientai_failai?id=eq.${id}`, {
    method: 'DELETE',
    headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
  });
  fetchKlientoFailai(selectedClient.id);
};

  const fetchKlientoFailai = async (id) => {
    if (!id) return;
    
    // Štai čia buvo problema: prieš tai tikriausiai trūko "const res ="
    const res = await fetch(`https://enucrtrjaoakachsrubi.supabase.co/rest/v1/klientai_failai?equipment_id=eq.${id}`, {
      headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
    });

    if (res.ok) {
      const data = await res.json();
      setKlientoFailai(data);
    } else {
      console.error("Klaida gaunant failus:", await res.text());
    }
  };
 // 1. Atnaujinta komentarų pridėjimo funkcija
const handleAddComment = async (text) => {
  if (!text.trim()) return;

  // 1. Siunčiame į duomenų bazę
  const res = await fetch('https://enucrtrjaoakachsrubi.supabase.co/rest/v1/komentarai', {
    method: 'POST',
    headers: { 
      'apikey': API_KEY, 
      'Authorization': `Bearer ${API_KEY}`, 
      'Content-Type': 'application/json',
      'Prefer': 'return=representation' 
    },
    body: JSON.stringify({ 
      equipment_id: selectedClient.id, 
      tekstas: text,
      sukurta_data: new Date().toISOString() 
    })
  });

  if (res.ok) {
    const [newComment] = await res.json();
    
    // 2. ATNAUJINAME TIK BŪSENĄ (React automatiškai perpieš Jūsų jau turimą gražų sąrašą)
    setKomentarai(prev => [newComment, ...prev]);
    
    // 3. Jei turite įvesties lauko "state", jį išvalome
    // setCommentInputValue(''); 
  } else {
    console.error("Nepavyko pridėti komentaro");
  }
};

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
    if (savedCols) {
      const parsed = JSON.parse(savedCols);
      // Tikriname, ar yra senų stulpelių pavadinimų
      const hasOldNames = parsed.some(c => c.key === "Prižiūri" || (c.key === "Prižiūri" && c.label !== "IŠKVIETIMAI"));

      if (hasOldNames) {
        localStorage.removeItem('crm_columns'); // Ištrinam seną, kad užsikrautų naujas
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
  const BASE_URL = 'https://enucrtrjaoakachsrubi.supabase.co/rest/v1';

  useEffect(() => { localStorage.setItem('crm_columns', JSON.stringify(columns)) }, [columns])
  useEffect(() => { localStorage.setItem('crm_widths', JSON.stringify(widths)) }, [widths])
  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    if (selectedClient && selectedClient.id) {
      fetchKomentarai(selectedClient.id);
      fetchKlientoFailai(selectedClient.id);
    }
  }, [selectedClient]);

 async function fetchData() {
  setLoading(true);
  try {
    const response = await fetch(`${BASE_URL}/equipment?select=*&order=id.desc`, {
      headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
    });
    const data = await response.json();
    
    // IŠVALOME DUOMENIS IŠKART GAVUS
    const cleanedData = data.map(item => ({
      ...item,
      "Patikros data": formatDateForInput(item["Patikros data"]),
      "Sekanti patikra": formatDateForInput(item["Sekanti patikra"]),
      "Montavimo data": formatDateForInput(item["Montavimo data"])
    }));
    
    setEquipment(cleanedData || []);
  } catch (err) { console.error(err); } finally { setLoading(false); }
}

  const sendUrgentEmail = async (item, faultDetails) => {
    const MY_RESEND_KEY = 're_Sj2Kx2LS_3VFCkGgt4ZfWkSZuVCnB2eGM';
    const MY_RECEIVER_EMAIL = 'valdasjanciauskas@gmail.com';
    const klientas = item["Kliento pavadinimas"] || 'Nenurodytas klientas';
    const adresas = item["Adresas"] || 'Nenurodytas adresas';
    const iranga = item["Įrangos pavadinimas"] || 'Nenurodyta įranga';
    const serijosNumeris = item["Serijos numeris"] || 'Nenurodytas S/N';

    try {
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = 'https://api.resend.com/emails';
      await fetch(proxyUrl + targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MY_RESEND_KEY}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          from: 'MD Impex CRM <onboarding@resend.dev>',
          to: [MY_RECEIVER_EMAIL],
          subject: `🚨 SKUBUS IŠKVIETIMAS: Gedimas - ${klientas}`,
          html: `<div style="font-family:Arial,sans-serif;padding:25px;line-height:1.6;max-width:600px;border:1px solid #e3e7eb;border-radius:8px;">
    <h2 style="color:#e30613;margin-top:0;border-bottom:2px solid #e30613;padding-bottom:10px;">🚨 Užregistruotas skubus gedimas!</h2>
    <table style="width:100%;border-collapse:collapse;margin-top:15px;">
      <tr><td style="padding:8px 0;font-weight:bold;width:150px;color:#555;">Klientas:</td><td style="padding:8px 0;font-size:15px;color:#000;">${klientas}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Adresas:</td><td style="padding:8px 0;font-size:15px;color:#000;">${adresas}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Įranga:</td><td style="padding:8px 0;font-size:15px;color:#000;">${iranga}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;color:#555;">S/N:</td><td style="padding:8px 0;font-size:15px;color:#000;">${serijosNumeris}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Gedimas:</td><td style="padding:8px 0;font-size:15px;color:#e30613;font-weight:bold;">${faultDetails}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Komentaras:</td><td style="padding:8px 0;font-size:15px;color:#333;background-color:#f9f9f9;padding:5px;">${item["Komentaras"] || 'Nėra'}</td></tr>
    </table>
    <hr style="margin: 25px 0; border: 0; border-top: 1px solid #eee;">
    <p style="font-size: 13px; color: #666;">Šį įrašą galite peržiūrėti CRM sistemoje: <br/><a href="https://service-crm-nine.vercel.app/" style="color: #113c32; font-weight: bold; text-decoration: underline;">Atidaryti MD Impex CRM</a></p>
  </div>`
        })
      });
    } catch (err) { console.error(err) }
  };

  const pushActionToHistory = (action) => setHistory(prev => [action, ...prev].slice(0, 25));

  const handleAddRow = async () => {
    try {
      const res = await fetch(`${BASE_URL}/equipment`, { // Pridėk /equipment
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
// A. Įklijuokite šią funkciją (reikalinga datos skaičiavimui)
const updateClientField = (key, value) => {
  let updated = { ...selectedClient, [key]: value };
  
  if (key === "Patikros data" && value) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      d.setFullYear(d.getFullYear() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      updated["Sekanti patikra"] = `${y}-${m}-${day}`;
    }
  }
  setSelectedClient(updated);
};

// B. Įklijuokite šią funkciją (reikalinga failų/nuotraukų įkėlimui)
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 1. Sukuriame saugų failo pavadinimą (tik anglų raidės ir skaičiai)
  const timestamp = Date.now();
  const safeFileName = `${timestamp}_file`; 

  try {
    // 2. Įkėlimas į storage (naudojame tik ASCII simbolius header'iuose)
    const uploadRes = await fetch(
      `https://enucrtrjaoakachsrubi.supabase.co/storage/v1/object/klientai-failai/${safeFileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'apikey': API_KEY,
          'Content-Type': file.type
        },
        body: file
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Storage klaida: ${errText}`);
    }

    const publicUrl = `https://enucrtrjaoakachsrubi.supabase.co/storage/v1/object/public/klientai-failai/${safeFileName}`;

    // 3. Išsaugome įrašą duomenų bazėje
    // Svarbu: stulpelių pavadinimai turi atitikti lentelę (failo_pavadinimas ir url)
    const payload = {
        equipment_id: selectedClient.id,
        url: publicUrl,
        failo_pavadinimas: file.name // Čia JSON body, todėl lietuviškos raidės yra saugios!
    };

    const res = await fetch(`https://enucrtrjaoakachsrubi.supabase.co/rest/v1/klientai_failai`, {
      method: 'POST',
      headers: { 
        'apikey': API_KEY, 
        'Authorization': `Bearer ${API_KEY}`, 
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("DB klaida:", errorData);
      throw new Error("Nepavyko įrašyti į duomenų bazę");
    }

    alert("Failas sėkmingai įkeltas!");
    fetchKlientoFailai(selectedClient.id);
  } catch (err) {
    console.error("Klaida:", err);
    alert("Klaida įkeliant: " + err.message);
  }
};
  const handleSave = async (id, field, value) => {
    const currentItem = equipment.find(item => item.id === id);
    if (!currentItem) return;
    
    const oldValue = currentItem[field] || '';
    const newValue = value !== undefined && value !== null ? value.toString().trim() : '';

    // Patikrinimas: ar vertė pasikeitė
    if (newValue === oldValue) { 
      setEditingCell(null); 
      return; 
    }

    // 1. Sukuriam atnaujinimo objektą
    let updates = { [field]: newValue };
    
    // Logika, jei "Atlikta" -> perskaičiuojam datas
    if (field === "Atlikta" && newValue === "Taip") {
      const today = new Date();
      updates["Patikros data"] = today.toISOString().split('T')[0];
      
      const period = currentItem["Patikr. Periodiškumas"]?.toString().toLowerCase() || "";
      let nextDate = new Date(today);
      if (period.includes("1") || period.includes("metus") || period.includes("12")) nextDate.setFullYear(nextDate.getFullYear() + 1);
      else if (period.includes("2") || period.includes("6")) nextDate.setMonth(nextDate.getMonth() + 6);
      else if (period.includes("4") || period.includes("3")) nextDate.setMonth(nextDate.getMonth() + 3);
      else nextDate.setFullYear(nextDate.getFullYear() + 1);
      
      updates["Sekanti patikra"] = nextDate.toISOString().split('T')[0];
    }

    try {
      // 2. SVARBU: Čia atnaujiname 'equipment' lentelę, o ne 'klientai_failai'
      const res = await fetch(`${BASE_URL}/equipment?id=eq.${id}`, { 
  method: 'PATCH',
        headers: { 
          'apikey': API_KEY, 
          'Authorization': `Bearer ${API_KEY}`, 
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Supabase API klaida:", errorData);
        throw new Error(errorData.message);
      }

      // 3. Jei tai "Prižiūri" laukas su gedimu, siunčiam email
      if (field === "Prižiūri" && newValue.toLowerCase().includes('gedimas') && !newValue.toLowerCase().includes('sutaisyta')) {
        sendUrgentEmail({ ...currentItem, ...updates }, newValue);
      }

      // 4. Atnaujinam sąrašą ekrane
      setEquipment(equipment.map(item => item.id === id ? { ...item, ...updates } : item));
      setEditingCell(null);
      
    } catch (err) { 
      console.error("Klaida saugant:", err); 
      alert("Nepavyko išsaugoti: " + err.message);
      setEditingCell(null); 
    }
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    const lastAction = history[0];
    const nextHistory = history.slice(1);
    try {
      setLoading(true);
      if (lastAction.type === 'EDIT_CELL') {
        let rollbacks = { [lastAction.field]: lastAction.oldValue };
        if (lastAction.field === 'Atlikta') { rollbacks["Patikros data"] = lastAction.oldPatikrosData; rollbacks["Sekanti patikra"] = lastAction.oldSekantiPatikra; }
        await fetch(`${BASE_URL}?id=eq.${lastAction.id}`, { method: 'PATCH', headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(rollbacks) });
        setEquipment(prev => prev.map(item => item.id === lastAction.id ? { ...item, ...rollbacks } : item));
      } else if (lastAction.type === 'DELETE_ROW') {
        const res = await fetch(BASE_URL, { method: 'POST', headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }, body: JSON.stringify(lastAction.rowData) });
        if (res.ok) { const [restoredItem] = await res.json(); setEquipment(prev => [restoredItem, ...prev]); }
      } else if (lastAction.type === 'ADD_ROW') {
        await fetch(`${BASE_URL}?id=eq.${lastAction.id}`, { method: 'DELETE', headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
        setEquipment(prev => prev.filter(item => item.id !== lastAction.id));
      } else if (lastAction.type === 'COLUMNS_STATE') { setColumns(lastAction.oldColumns); }
      setHistory(nextHistory);
    } catch (err) { console.error("Nepavyko įvykdyti undo:", err); } finally { setLoading(false); }
  };

  const handleStartEdit = (id, field, initialValue) => {
    setEditingCell({ id, field });
    
    if (field.toLowerCase().includes('data') || field.toLowerCase().includes('patikra')) {
      setInputValue(formatDateForInput(initialValue));
    } else {
      setInputValue(initialValue || '');
    }
  };
  const openClientCard = (item) => {
    setSelectedClient(item);
  };
  const moveColumn = (index, direction) => {
    const newCols = [...columns];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    setColumns(newCols);
  };

  const toggleColumn = (key) => setColumns(columns.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  const renameColumnLabel = (key) => {
    const currentCol = columns.find(c => c.key === key);
    const newLabel = window.prompt(`Įveskite naują stulpelio "${currentCol.label}" pavadinimą:`, currentCol.label);
    if (newLabel && newLabel.trim() !== "") {
      pushActionToHistory({ type: 'COLUMNS_STATE', oldColumns: JSON.parse(JSON.stringify(columns)) });
      setColumns(columns.map(c => c.key === key ? { ...c, label: newLabel.trim().toUpperCase() } : c));
    }
  };

  const deleteColumnEntirely = (key) => {
    const currentCol = columns.find(c => c.key === key);
    if (window.confirm(`Ar tikrai norite VISIŠKAI IŠTRINTI stulpelį "${currentCol.label}" iš CRM sąrašo?`)) {
      pushActionToHistory({ type: 'COLUMNS_STATE', oldColumns: JSON.parse(JSON.stringify(columns)) });
      setColumns(columns.filter(c => c.key !== key));
    }
  };

  const handleDeleteRow = async (id) => {
    const rowToDelete = equipment.find(item => item.id === id);
    if (!rowToDelete || !window.confirm("Ar tikrai norite IŠTRINTI šį įrašą?")) return;
    pushActionToHistory({ type: 'DELETE_ROW', rowData: rowToDelete });
    await fetch(`${BASE_URL}?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
    setEquipment(prev => prev.filter(item => item.id !== id));
  };

  const resizerRef = useRef({ x: 0, width: 0, key: null });
  const onMouseMove = (e) => {
    if (!resizerRef.current.key) return;
    const newWidth = Math.max(30, resizerRef.current.width + (e.clientX - resizerRef.current.x));
    setWidths(prev => ({ ...prev, [resizerRef.current.key]: newWidth }));
  };
  const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); resizerRef.current.key = null; };
  const onMouseDown = (e, key) => { resizerRef.current = { x: e.clientX, width: widths[key], key }; document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); };

  const visibleCols = columns.filter(c => c.visible);
  const filteredData = equipment.filter(item => {
    if (!globalSearch.trim()) return true;
    const query = globalSearch.toLowerCase();
    return (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(query) || (item["Įrangos pavadinimas"]?.toLowerCase() || '').includes(query) || (item["Adresas"]?.toLowerCase() || '').includes(query) || (item["Serijos numeris"]?.toLowerCase() || '').includes(query);
  });
  const sortedAndFilteredData = [...filteredData].sort((a, b) => {
    const aFault = a["Prižiūri"] && a["Prižiūri"].toLowerCase().includes('gedimas') && !a["Prižiūri"].toLowerCase().includes('sutaisyta');
    const bFault = b["Prižiūri"] && b["Prižiūri"].toLowerCase().includes('gedimas') && !b["Prižiūri"].toLowerCase().includes('sutaisyta');
    return aFault && !bFault ? -1 : !aFault && bFault ? 1 : 0;
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden', position: 'fixed', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .main-header { height: 85px; display: flex; padding: 0 35px; background: #113c32; align-items: center; flex-shrink: 0; }
        .nav-menu { display: flex; gap: 20px; color: #ffffff; font-size: 14px; font-weight: bold; align-items: center; width: 100%; }
        .nav-item { cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-add-gold { color: #b4965d !important; margin-left: 20px;}
        .btn-undo { color: #acca23 !important; cursor: pointer; font-size: 18px; font-weight: bold; transition: opacity 0.2s; margin-right: -10px; }
        .btn-undo.disabled { opacity: 0.3; cursor: not-allowed; color: #ffffff !important; }
        .nav-separator { color: rgba(255,255,255,0.2); }
        .search-box-global { background: #194a3f; border: 1px solid #235d51; padding: 10px 18px; color: white; font-size: 13px; outline: none; width: 320px; margin-left: 15px; border-radius: 4px; }
        .search-box-global::placeholder { color: rgba(255,255,255,0.5); }
        .crm-title-right { margin-left: auto; color: #acca23; font-size: 22px; font-family: 'Candara', serif; }
        .crm-card-wrapper { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        .table-wrap { flex: 1; overflow: auto; width: 100vw; -webkit-overflow-scrolling: touch; }
        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        th { background: #1e1e1e; color: #ffffff !important; position: sticky; top: 0; z-index: 30; font-size: 11px; font-weight: bold; text-align: center; padding: 16px 5px; border-right: 1px solid #333333; border-bottom: 2px solid #000000; }
        td { padding: 0; border-right: 1px solid #e3e7eb; border-bottom: 1px solid #e3e7eb; position: relative; background: #ffffff; }
        tr:nth-child(even) td { background-color: #f8fafb; }
        tr:hover td { background-color: #edf2f7 !important; }
        .row-overdue td { background-color: #fff0f0 !important; }
        @keyframes pulse-red-white { 0% { background-color: #ffffff; } 50% { background-color: #ffdde0; } 100% { background-color: #ffffff; } }
        .row-fault td { animation: pulse-red-white 1.5s infinite ease-in-out !important; }
        .text-overdue { color: #e30613 !important; font-weight: bold; }
        .cell-content { padding: 12px 10px; font-size: 13px; color: #232323; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; min-height: 20px; cursor: pointer; }
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 6px; cursor: col-resize; z-index: 31; }
        .cell-edit { width: 100%; border: 2px solid #113c32; padding: 6px; font-size: 13px; outline: none; box-sizing: border-box; background: white; }
        .action-btn { border: none; background: none; cursor: pointer; font-size: 14px; margin: 0 6px; }
        .btn-del { color: #e30613; }
        .btn-edit-icon { color: #113c32; font-weight: bold; }
        .col-manage-btn { border: none; background: none; cursor: pointer; font-size: 11px; margin-left: 5px; padding: 2px 4px; border-radius: 3px; }
        .col-manage-btn:hover { background: #f0f0f0; }
        @media (max-width: 768px) { .main-header { height: auto; padding: 15px 15px; } .nav-menu { flex-direction: column; align-items: stretch; gap: 10px; } .nav-separator { display: none; } .crm-title-right { margin-left: 0; text-align: center; order: -1; font-size: 18px; } .search-box-global { width: 100%; margin-left: 0; } }
      `}</style>
      <div className="main-header">
        <div className="nav-menu">
          <span className={`nav-item btn-undo ${history.length === 0 ? 'disabled' : ''}`} onClick={handleUndo} title={history.length > 0 ? `Atšaukti paskutinį veiksmą (galima ${history.length} kartų)` : "Istorija tuščia"}>↩️</span>
          <span className="nav-separator">|</span>
          <span className="nav-item" onClick={() => setShowColManager(!showColManager)}>STULPELIŲ VALDYMAS</span>
          <span className="nav-separator">|</span>
          <span className="nav-item btn-add-gold" onClick={handleAddRow}>+ NAUJAS ĮRAŠAS</span>
          <input className="search-box-global" placeholder="🔍 Ieškoti (Kliento, Įrangos, Adreso, S/N)..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} />
          <div className="crm-title-right">MD Impex CRM</div>
        </div>
      </div>
      <div className="crm-card-wrapper">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                {visibleCols.map(col => (
                  <th key={col.key} style={{ width: `${widths[col.key]}px` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {col.label}
                      <div style={{ marginTop: '5px' }}>
                        <span style={{ cursor: 'pointer', marginRight: '8px', fontSize: '10px', color: '#b4965d' }} onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), -1)}>◀</span>
                        <span style={{ cursor: 'pointer', fontSize: '10px', color: '#b4965d' }} onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), 1)}>▶</span>
                      </div>
                    </div>
                    <div className="resizer" onMouseDown={e => onMouseDown(e, col.key)} />
                  </th>
                ))}
                <th style={{ width: '100px' }}>VEIKSMAI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={visibleCols.length + 2} style={{ textAlign: 'center', padding: '50px' }}>KRAUNAMA...</td></tr> :
                sortedAndFilteredData.map((item, index) => {
                  const isOverdue = item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date();
                  const hasFault = item["Prižiūri"] && item["Prižiūri"].toLowerCase().includes('gedimas') && !item["Prižiūri"].toLowerCase().includes('sutaisyta');
                  return (
                    <tr key={item.id} className={hasFault ? 'row-fault' : isOverdue ? 'row-overdue' : ''}>
                      <td style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>{index + 1}</td>
                      {visibleCols.map(col => (
                        <td key={col.key}>
                          <div style={{ width: `${widths[col.key]}px` }}>
                            {editingCell?.id === item.id && editingCell?.field === col.key ? (
                              col.key === "Sutartis YRA/NĖRA" ? (
                                <select className="cell-edit" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, inputValue)}>
                                  <option value="">—</option><option value="YES">YES</option><option value="NO">NO</option>
                                </select>
                              ) : col.key === "Atlikta" ? (
                                <select className="cell-edit" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, inputValue)}>
                                  <option value="Ne">Ne</option><option value="Taip">Taip</option>
                                </select>
                              ) : col.key === "Komentaras" ? (
                                <span style={{ cursor: 'pointer', color: '#113c32', textDecoration: 'underline', padding: '12px 10px', display: 'block' }} onClick={() => { setSelectedEquipmentId(item.id); fetchKomentarai(item.id); }}>
                                  {item["Komentaras"] ? "Peržiūrėti" : "Įrašyti"}
                                </span>
                              ) : col.key.toLowerCase().includes('data') || col.key.toLowerCase().includes('patikra') ? (
  <input 
  autoFocus 
  type="date" 
  className="cell-edit" 
  // Priverstinai konvertuojame į YYYY-MM-DD prieš pat atvaizduojant
  value={formatDateForInput(inputValue)} 
  onChange={e => setInputValue(e.target.value)} 
  onBlur={() => handleSave(item.id, col.key, inputValue)}
    onKeyDown={e => { 
      if (e.key === 'Enter') handleSave(item.id, col.key, inputValue); 
      if (e.key === 'Escape') setEditingCell(null); 
    }} 
  />
) : (
  <input 
    autoFocus 
    type="text" 
    className="cell-edit" 
    value={inputValue} 
    onChange={e => setInputValue(e.target.value)} 
    onBlur={() => handleSave(item.id, col.key, inputValue)} 
    onKeyDown={e => { 
      if (e.key === 'Enter') handleSave(item.id, col.key, inputValue); 
      if (e.key === 'Escape') setEditingCell(null); 
    }} 
  />
)
) : (
  <span
    className={`cell-content ${col.key === "Sekanti patikra" && isOverdue ? 'text-overdue' : ''}`}
    onDoubleClick={() => handleStartEdit(item.id, col.key, item[col.key])}
    onClick={() => col.key === "Kliento pavadinimas" ? openClientCard(item) : null}
    style={col.key === "Kliento pavadinimas" ? { cursor: 'pointer', textDecoration: 'underline' } : {}}
  >
    {item[col.key] || '—'}
  </span>
)}
                          </div>
                        </td>
                      ))}
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button className="action-btn btn-edit-icon" onClick={() => handleStartEdit(item.id, "Prižiūri", item["Prižiūri"])}>✏️</button>
                          <button className="action-btn btn-del" onClick={() => handleDeleteRow(item.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
      {/* STULPELIŲ VALDYMAS */}
      {showColManager && (
        <div style={{ position: 'absolute', top: '90px', left: '30px', background: 'white', padding: '20px', zIndex: 100, border: '1px solid #113c32', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '280px' }}>
          <h4 style={{ marginTop: 0, fontSize: '12px', letterSpacing: '0.5px', borderBottom: '1px solid #e3e7eb', paddingBottom: '8px' }}>STULPELIŲ VALDYMAS</h4>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {columns.map(col => (
              <div key={col.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingRight: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} style={{ cursor: 'pointer' }} />
                  <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: col.visible ? 'bold' : 'normal', color: col.visible ? '#232323' : '#999' }}>{col.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button className="col-manage-btn" title="Pervadinti stulpelį" onClick={() => renameColumnLabel(col.key)}>✏️</button>
                  <button className="col-manage-btn" title="Visiškai ištrinti stulpelį" onClick={() => deleteColumnEntirely(col.key)} style={{ color: '#e30613' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const label = prompt("Įveskite naujo stulpelio pavadinimą:");
              if (label) {
                const newKey = label.toLowerCase().replace(/\s+/g, '_');
                const newColumn = { label: label.toUpperCase(), key: newKey, visible: true };
                setColumns([...columns, newColumn]);
                setWidths(prev => ({ ...prev, [newKey]: 120 }));
              }
            }}
            style={{ width: '100%', padding: '10px', background: '#acca23', color: '#113c32', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px' }}
          >
            + PRIDĖTI NAUJĄ STULPELĮ
          </button>
        </div>
      )}

      {/* KLIENTO KORTELĖ */}
      {selectedClient && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ background: 'white', padding: '25px', width: '950px', height: '85vh', borderRadius: '12px', display: 'flex', gap: '25px', position: 'relative' }}>
      
      <button style={{ position: 'absolute', top: '10px', right: '10px' }} onClick={() => setSelectedClient(null)}>✕</button>
      
      {/* Uždarymo mygtukas */}
      <button style={{ position: 'absolute', top: '10px', right: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}
        onClick={() => { setSelectedClient(null); setKomentarai([]); }}>✕</button>

      {/* KAIRĖ: Redagavimo laukai */}
      <div style={{ flex: 1.5, overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginTop: 0 }}>{selectedClient["Kliento pavadinimas"]}</h2>
        
        <div style={{ flex: 1 }}>
          {columns.map(col => {
            if (col.key === "Komentaras") return null;
            return (
              <div key={col.key} style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', color: '#666' }}>{col.label}</label>
                <input 
                  type={col.key.toLowerCase().includes('data') || col.key.toLowerCase().includes('patikra') ? 'date' : 'text'}
                  value={selectedClient[col.key] || ''} 
                  onChange={(e) => updateClientField(col.key, e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} 
                />
              </div>
            );
          })}
        </div>

        <button 
          onClick={async () => {
            try {
              const res = await fetch(`${BASE_URL}?id=eq.${selectedClient.id}`, {
                method: 'PATCH',
                headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedClient)
              });
              if (res.ok) {
                setEquipment(equipment.map(item => item.id === selectedClient.id ? selectedClient : item));
                alert("Išsaugota!");
                setSelectedClient(null);
              }
            } catch (err) { console.error(err); }
          }}
          style={{ marginTop: '20px', padding: '12px', background: '#113c32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          IŠSAUGOTI PAKEITIMUS
        </button>
      </div>

      {/* DEŠINĖ: Įrenginio būklė, Kamera, Failai ir Komentarai */}
<div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
  
  {/* FOTOAPARATO MYGTUKAS */}
  <label style={{ display: 'block', padding: '12px', background: '#113c32', color: 'white', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
    📷 FOTOGRAFUOTI ARBA ĮKELTI
    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileUpload} />
  </label>

  {/* 1. PATIKROS PROGRESAS (365 d.) */}
  <div>
    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>PATIKROS PROGRESAS (Metinis)</div>
    {(() => {
      const sekantiData = new Date(selectedClient["Sekanti patikra"] || new Date());
      const diffTime = sekantiData - new Date();
      const daysLeft = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
      const progress = Math.min(Math.max(1 - (daysLeft / 365), 0), 1);
      return (
        <div>
          <div style={{ background: '#eee', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${progress * 100}%`, height: '100%', background: getProgressColor(progress), transition: '0.3s' }} />
          </div>
          <p style={{ fontSize: '10px', marginTop: '3px', color: '#555' }}>Liko iki patikros: {daysLeft} d. ({Math.round(progress * 100)}%)</p>
        </div>
      );
    })()}
  </div>

  {/* 2. REMONTO PROGRESAS (30 d.) */}
  {selectedClient["Prižiūri"]?.toLowerCase().includes('gedimas') && (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>REMONTO PROGRESAS (30 d.)</div>
      {(() => {
        const daysPassed = Math.min(Math.max((new Date() - new Date()) / (1000 * 60 * 60 * 24) + 1, 0), 30);
        const progress = daysPassed / 30;
        return (
          <div>
            <div style={{ background: '#eee', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${progress * 100}%`, height: '100%', background: getProgressColor(progress), transition: '0.3s' }} />
            </div>
            <p style={{ fontSize: '10px', marginTop: '3px', color: '#555' }}>Praėjo nuo gedimo: {Math.round(daysPassed)} d. ({Math.round(progress * 100)}%)</p>
          </div>
        );
      })()}
    </div>
  )}

  {/* FAILŲ SĄRAŠAS SU TRYNIMU */}
<h4 style={{ margin: '10px 0 5px 0', fontSize: '12px' }}>ĮKELTI FAILAI</h4>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
  {klientoFailai.map((failas) => (
    <div key={failas.id} style={{ position: 'relative', textAlign: 'center' }}>
      
      {/* Trynimo mygtukas */}
      <button 
        onClick={() => deleteFile(failas.id)} 
        style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e30613', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '10px', width: '20px', height: '20px', zIndex: 10 }}
      >x</button>
      
      {/* Failo nuoroda */}
      <a href={failas.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ width: '70px', height: '70px', background: '#f4f4f4', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '0 auto', border: '1px solid #ddd' }}>
  {/* Patikriname, ar failo_pavadinimas turi paveikslėlio plėtinį, arba tiesiog bandome rodyti img */}
  {failas.failo_pavadinimas && failas.failo_pavadinimas.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 
    <img 
      src={failas.url} 
      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      alt="nuotrauka" 
      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} 
    /> 
    : 
    <span style={{ fontSize: '24px' }}>📄</span>
  }
</div>
        {/* FAILO PAVADINIMAS (ČIA PAKEITIMAS) */}
        <div style={{ fontSize: '10px', marginTop: '5px', wordBreak: 'break-word', color: '#555', maxWidth: '70px', margin: '5px auto 0 auto' }}>
          {failas.failo_pavadinimas || "Nežinomas failas"}
        </div>
      </a>
    </div>
  ))}
</div>

  {/* KOMENTARAI SU EDIT/DELETE */}
  <h4 style={{ margin: '15px 0 5px 0' }}>Komentarai</h4>
  <div style={{ display: 'flex', gap: '5px' }}>
    <input id="new-comment" style={{ flex: 1, padding: '5px' }} />
    <button onClick={() => { handleAddComment(document.getElementById('new-comment').value); document.getElementById('new-comment').value = ''; }}>Siųsti</button>
  </div>

  <div style={{ flex: 1, overflowY: 'auto' }}>
    {komentarai.map((k) => (
      <div key={k.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
        {editingComment?.id === k.id ? (
          <>
            <textarea defaultValue={k.tekstas} id={`edit-${k.id}`} style={{ width: '100%' }} />
            <button onClick={() => updateComment(k.id, document.getElementById(`edit-${k.id}`).value)}>Išsaugoti</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '10px', color: '#888' }}>{new Date(k.sukurta_data).toLocaleString()}</div>
            <div style={{ fontSize: '13px', marginBottom: '5px' }}>{k.tekstas}</div>
            <button onClick={() => setEditingComment({id: k.id})} style={{ fontSize: '10px', marginRight: '5px' }}>Redaguoti</button>
            <button onClick={() => deleteComment(k.id)} style={{ fontSize: '10px', color: 'red' }}>Trinti</button>
          </>
        )}
      </div>
    ))}
  </div>
</div>
    </div>
  </div>
)}
    </div>
  );
}

export default App;