import { useEffect, useState, useRef } from 'react'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchEquipment, setSearchEquipment] = useState('') 
  const [searchAddress, setSearchAddress] = useState('') 
  const [editingCell, setEditingCell] = useState(null)
  const [showColManager, setShowColManager] = useState(false)
  
  // Šis kintamasis saugo realiu laiku įvedamą tekstą, kad jis nedingtų
  const [tempValue, setTempValue] = useState('')

  const [columns, setColumns] = useState(() => {
    const savedCols = localStorage.getItem('crm_columns')
    return savedCols ? JSON.parse(savedCols) : [
      { label: "MONTAVIMO DATA", key: "Montavimo data", visible: true },
      { label: "ALIGNMENT KODAS", key: "Kliento įmonės kodas", visible: true },
      { label: "KLIENTAS", key: "Kliento pavadinimas", visible: true },
      { label: "ADRESAS", key: "Adresas", visible: true },
      { label: "ĮRANGOS PAVADINIMAS", key: "Įrangos pavadinimas", visible: true },
      { label: "SERIJOS NUMERIS", key: "Serijos numeris", visible: true },
      { label: "PRIŽIŪRI", key: "Prižiūri", visible: true }, 
      { label: "PERIODAS", key: "Patikr. Periodiškumas", visible: true },
      { label: "PASK. PATIKRA", key: "Patikros data", visible: true },
      { label: "SEKANTI PATIKRA", key: "Sekanti patikra", visible: true },
      { label: "ATK. PERIODAS", key: "Atk. Periodas", visible: true },
      { label: "KOMENTARAS", key: "Komentaras", visible: true },
      { label: "SUTARTIS YRA/NĖRA", key: "Sutartis YRA/NĖRA", visible: true },
      { label: "ATLIKTA", key: "Atlikta", visible: true }
    ]
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
  }, [columns])

  useEffect(() => {
    localStorage.setItem('crm_widths', JSON.stringify(widths))
  }, [widths])

  useEffect(() => { 
    fetchData() 
    // eslint-disable-next-line
  }, [])

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
          html: `
            <div style="font-family:Arial,sans-serif;padding:25px;line-height:1.6;max-width:600px;border:1px solid #e3e7eb;border-radius:8px;">
              <h2 style="color:#e30613;margin-top:0;border-bottom:2px solid #e30613;padding-bottom:10px;">🚨 Užregistruotas skubus gedimas!</h2>
              <table style="width:100%;border-collapse:collapse;margin-top:15px;">
                <tr><td style="padding:8px 0;font-weight:bold;width:150px;color:#555;">Klientas:</td><td style="padding:8px 0;font-size:15px;color:#000;">${klientas}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Adresas:</td><td style="padding:8px 0;font-size:15px;color:#000;">${adresas}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Įranga:</td><td style="padding:8px 0;font-size:15px;color:#000;">${iranga}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Serijos numeris:</td><td style="padding:8px 0;font-size:15px;color:#000;font-family:monospace;">${serijosNumeris}</td></tr>
                <tr><td style="padding:15px 0 8px 0;font-weight:bold;color:#e30613;vertical-align:top;">Gedimo aprašymas:</td><td style="padding:15px 0 8px 0;font-size:15px;color:#e30613;font-weight:bold;background-color:#fff0f0;padding:10px;border-radius:4px;">${faultDetails}</td></tr>
              </table>
            </div>
          `
        })
      });
    } catch (err) { console.error(err) }
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
      }
    } catch (err) { alert(err.message) }
  };

  const handleSave = async (id, field, value) => {
    const currentItem = equipment.find(item => item.id === id);
    if (!currentItem) return;
    
    const oldValue = currentItem[field] || '';
    const newValue = value !== undefined && value !== null ? value.toString().trim() : '';

    // SAUGIKLIS: Jei bandoma ištrinti jau esamą tekstą
    if (!newValue || newValue === "") {
      if (oldValue && oldValue !== '—') {
        const confirmDeleteValue = window.confirm(`Ar tikrai norite IŠTRINTI reikšmę iš stulpelio "${field}"?`);
        if (!confirmDeleteValue) {
          setEditingCell(null);
          return;
        }
      } else {
        setEditingCell(null);
        return;
      }
    }

    if (newValue === oldValue) {
      setEditingCell(null);
      return;
    }

    let updates = { [field]: newValue };

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
      const res = await fetch(`${BASE_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error("Nepavyko išsaugoti");

      const updatedItem = { ...currentItem, ...updates };

      // GEDIMO FUNKCIJA: Tikriname, ar įvestas gedimas
      if (field === "Prižiūri" && newValue.toLowerCase().includes('gedimas')) {
        if (!newValue.toLowerCase().includes('sutaisyta')) {
          sendUrgentEmail(updatedItem, newValue);
        }
      }

      // Atnaujiname sąrašą ekrane realiu laiku, kad reikšmė pasiliktų!
      setEquipment(equipment.map(item => item.id === id ? { ...item, ...updates } : item));
      setEditingCell(null);
    } catch (err) { 
      console.error("Klaida:", err);
      setEditingCell(null);
    }
  };

  const startEditing = (id, field, value) => {
    setEditingCell({ id, field });
    setTempValue(value || '');
  };

  const moveColumn = (index, direction) => {
    const newCols = [...columns];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    setColumns(newCols);
  };

  const toggleColumn = (key) => setColumns(columns.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  
  const handleDeleteRow = async (id) => {
    if (!window.confirm("Ar tikrai norite IŠTRINTI šį įrašą?")) return;
    await fetch(`${BASE_URL}?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
    setEquipment(prev => prev.filter(item => item.id !== id));
  };

  const resizerRef = useRef({ x: 0, width: 0, key: null });

  const onMouseMove = (e) => {
    if (!resizerRef.current.key) return;
    const newWidth = Math.max(30, resizerRef.current.width + (e.clientX - resizerRef.current.x));
    setWidths(prev => ({ ...prev, [resizerRef.current.key]: newWidth }));
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    resizerRef.current.key = null;
  };

  const onMouseDown = (e, key) => {
    resizerRef.current = { x: e.clientX, width: widths[key], key };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const visibleCols = columns.filter(c => c.visible);

  const filteredData = equipment.filter(item => {
    const matchesClient = (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesEquipment = (item["Įrangos pavadinimas"]?.toLowerCase() || '').includes(searchEquipment.toLowerCase());
    const matchesAddress = (item["Adresas"]?.toLowerCase() || '').includes(searchAddress.toLowerCase());
    return matchesClient && matchesEquipment && matchesAddress;
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden', position: 'fixed', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .main-header { height: 85px; display: flex; padding: 0 35px; background: #113c32; align-items: center; flex-shrink: 0; }
        .nav-menu { display: flex; gap: 20px; color: #ffffff; font-size: 14px; font-weight: bold; align-items: center; width: 100%; }
        .nav-item { cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-add-gold { color: #b4965d !important; }
        .nav-separator { color: rgba(255,255,255,0.2); }
        .search-box-embedded { background: #194a3f; border: 1px solid #235d51; padding: 9px 15px; color: white; font-size: 13px; outline: none; width: 220px; margin-left: 10px; }
        .crm-title-right { margin-left: auto; color: #acca23; font-size: 22px; font-family: 'Candara', serif; }
        .crm-card-wrapper { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        .table-wrap { flex: 1; overflow: auto; width: 100vw; -webkit-overflow-scrolling: touch; }
        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        th { background: #1e1e1e; color: #ffffff !important; position: sticky; top: 0; z-index: 30; font-size: 11px; font-weight: bold; text-align: center; padding: 16px 5px; border-right: 1px solid #333333; border-bottom: 2px solid #000000; }
        td { padding: 0; border-right: 1px solid #e3e7eb; border-bottom: 1px solid #e3e7eb; position: relative; background: #ffffff; }
        tr:nth-child(even) td { background-color: #f8fafb; }
        tr:hover td { background-color: #edf2f7 !important; }
        .row-overdue td { background-color: #fff0f0 !important; }
        .row-fault td { background-color: #fff3cd !important; }
        .text-overdue { color: #e30613 !important; font-weight: bold; }
        .cell-content { padding: 12px 10px; font-size: 13px; color: #232323; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; min-height: 20px; cursor: pointer; }
        .resizer { position: absolute; right: 0; top: 0; height: 100%; width: 6px; cursor: col-resize; z-index: 31; }
        .cell-edit { width: 100%; border: 2px solid #113c32; padding: 6px; font-size: 13px; outline: none; box-sizing: border-box; background: white; }
        .action-btn { border: none; background: none; cursor: pointer; font-size: 14px; margin: 0 6px; }
        .btn-del { color: #e30613; }
        .btn-edit-icon { color: #113c32; font-weight: bold; }
        @media (max-width: 768px) { .main-header { height: auto; padding: 15px 15px; } .nav-menu { flex-direction: column; align-items: stretch; gap: 10px; } .nav-separator { display: none; } .crm-title-right { margin-left: 0; text-align: center; order: -1; font-size: 18px; } .search-box-embedded { width: 100%; margin-left: 0; } }
      `}</style>

      <div className="main-header">
        <div className="nav-menu">
          <span className="nav-item" onClick={() => setShowColManager(!showColManager)}>STULPELIAI</span>
          <span className="nav-separator">|</span>
          <span className="nav-item btn-add-gold" onClick={handleAddRow}>+ NAUJAS ĮRAŠAS</span>
          
          <input className="search-box-embedded" placeholder="🔍 Filtruoti klientą..." onChange={e => setSearchTerm(e.target.value)} />
          <input className="search-box-embedded" placeholder="⚙️ Filtruoti įrangą..." onChange={e => setSearchEquipment(e.target.value)} />
          <input className="search-box-embedded" placeholder="📍 Filtruoti adresą..." onChange={e => setSearchAddress(e.target.value)} />

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
                        <span style={{cursor:'pointer', marginRight: '8px', fontSize: '10px', color: '#b4965d'}} onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), -1)}>◀</span>
                        <span style={{cursor:'pointer', fontSize: '10px', color: '#b4965d'}} onClick={() => moveColumn(columns.findIndex(c => c.key === col.key), 1)}>▶</span>
                      </div>
                    </div>
                    <div className="resizer" onMouseDown={e => onMouseDown(e, col.key)} />
                  </th>
                ))}
                <th style={{ width: '100px' }}>VEIKSMAI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleCols.length + 2} style={{textAlign: 'center', padding: '50px'}}>KRAUNAMA...</td></tr>
              ) : (
                filteredData.map((item, index) => {
                  const isOverdue = item["Sekanti patikra"] && new Date(item["Sekanti patikra"]) < new Date();
                  const hasFault = item["Prižiūri"] && item["Prižiūri"].toLowerCase().includes('gedimas') && !item["Prižiūri"].toLowerCase().includes('sutaisyta');
                  let rowClass = '';
                  if (hasFault) rowClass = 'row-fault'; else if (isOverdue) rowClass = 'row-overdue';

                  return (
                    <tr key={item.id} className={rowClass}>
                      <td style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>{index + 1}</td>
                      {visibleCols.map(col => (
                        <td key={col.key}>
                          <div style={{ width: `${widths[col.key]}px` }}>
                            {editingCell?.id === item.id && editingCell?.field === col.key ? (
                              col.key === "Sutartis YRA/NĖRA" ? (
                                <select className="cell-edit" autoFocus value={tempValue} onChange={e => setTempValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, tempValue)}>
                                  <option value="">—</option><option value="YES">YES</option><option value="NO">NO</option>
                                </select>
                              ) : col.key === "Atlikta" ? (
                                <select className="cell-edit" autoFocus value={tempValue} onChange={e => setTempValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, tempValue)}>
                                  <option value="Ne">Ne</option><option value="Taip">Taip</option>
                                </select>
                              ) : col.key.toLowerCase().includes('data') || col.key.toLowerCase().includes('patikra') ? (
                                <input autoFocus type="date" className="cell-edit" value={tempValue} onChange={e => setTempValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, tempValue)} onKeyDown={e => { if (e.key === 'Enter') handleSave(item.id, col.key, tempValue); if (e.key === 'Escape') setEditingCell(null); }} />
                              ) : (
                                <input autoFocus type="text" className="cell-edit" value={tempValue} onChange={e => setTempValue(e.target.value)} onBlur={() => handleSave(item.id, col.key, tempValue)} onKeyDown={e => { if (e.key === 'Enter') handleSave(item.id, col.key, tempValue); if (e.key === 'Escape') setEditingCell(null); }} />
                              )
                            ) : (
                              <span className={`cell-content ${col.key === "Sekanti patikra" && isOverdue ? 'text-overdue' : ''}`} onClick={() => startEditing(item.id, col.key, item[col.key])}>
                                {item[col.key] || '—'}
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button className="action-btn btn-edit-icon" onClick={() => startEditing(item.id, "Prižiūri", item["Prižiūri"])}>✏️</button>
                          <button className="action-btn btn-del" onClick={() => handleDeleteRow(item.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showColManager && (
        <div style={{ position: 'absolute', top: '90px', left: '30px', background: 'white', padding: '20px', zIndex: 100, border: '1px solid #113c32', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <h4 style={{marginTop: 0, fontSize: '12px'}}>STULPELIŲ VALDYMAS</h4>
          <div style={{maxHeight: '300px', overflowY: 'auto'}}>
            {columns.map(col => (
              <div key={col.key} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} />
                <span style={{ marginLeft: '10px', fontSize: '12px' }}>{col.label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowColManager(false)} style={{ width: '100%', marginTop: '15px', padding: '8px', background: '#113c32', color: 'white', border: 'none', cursor: 'pointer' }}>UŽDARYTI</button>
        </div>
      )}
    </div>
  );
}

export default App;