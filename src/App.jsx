import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [colWidths, setColWidths] = useState([100, 90, 180, 180, 180, 100, 100, 100, 80, 70, 100, 120, 250]);

  useEffect(() => { fetchData() }, [])

  // Pagalbinės funkcijos datos formatų konvertavimui (Kalendorius <-> DB)
  const toDbFormat = (dateStr) => {
    if (!dateStr) return '';
    if (!dateStr.includes('-')) return dateStr; // Jei ne datos formatas iš kalendoriaus
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(m)}/${parseInt(d)}/${y}`;
  }

  const toInputFormat = (dbStr) => {
    if (!dbStr || !dbStr.includes('/')) return '';
    const parts = dbStr.split('/');
    if (parts.length !== 3) return '';
    const [m, d, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase.from('equipment').select('*').order('id', { ascending: true })
    if (error) console.error('Klaida:', error)
    else setEquipment(data || [])
    setLoading(false)
  }

  const handleSendReport = async () => {
    if (!window.confirm("Ar siųsti vėluojančių patikrų ataskaitą el. paštu?")) return;
    try {
      const { data, error } = await supabase.rpc('send_ataskaita_final');
      if (error) alert("Klaida: " + error.message);
      else alert("Ataskaita sėkmingai išsiųsta!");
    } catch (error) {
      alert("Sistemos klaida: " + error.message);
    }
  };

  const onMouseDown = (e, index) => {
    const startX = e.pageX;
    const startWidth = colWidths[index];
    const onMouseMove = (e) => {
      const newWidth = Math.max(30, startWidth + (e.pageX - startX));
      setColWidths(prev => { const next = [...prev]; next[index] = newWidth; return next; });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleSave = async (id, field, value) => {
    // Jei tai datos laukas, konvertuojame į DB formatą
    const isDateCol = field.includes('data') || field === "Sekanti patikra";
    const finalValue = isDateCol ? toDbFormat(value) : value;
    
    const { error } = await supabase.from('equipment').update({ [field]: finalValue }).eq('id', id)
    if (error) alert("Klaida saugant: " + error.message)
    else {
      setEquipment(equipment.map(item => item.id === id ? { ...item, [field]: finalValue } : item))
      setEditingCell(null)
    }
  }

  const columns = [
    { label: "Montavimo data", key: "Montavimo data" },
    { label: "Įm. Kodas", key: "Kliento įmonės kodas" },
    { label: "Klientas", key: "Kliento pavadinimas" },
    { label: "Adresas", key: "Adresas" },
    { label: "Įranga", key: "Įrangos pavadinimas" },
    { label: "S/N", key: "Serijos numeris" },
    { label: "Prižiūri", key: "Prižiūri" },
    { label: "Periodiškumas", key: "Patikr. Periodiškumas" },
    { label: "Sutartis", key: "Sutartis YRA/NĖRA" },
    { label: "Atlikta", key: "Atlikta" },
    { label: "Pask. Patikra", key: "Patikros data" },
    { label: "Sekanti patikra", key: "Sekanti patikra" },
    { label: "Komentaras", key: "Komentaras" }
  ];

  const filteredData = equipment.filter(item => {
    const s = searchTerm.toLowerCase()
    return (item["Kliento pavadinimas"]?.toLowerCase() || '').includes(s) || 
           (item["Įrangos pavadinimas"]?.toLowerCase() || '').includes(s) ||
           (item["Serijos numeris"]?.toLowerCase() || '').includes(s)
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <style>{`
        .table-container { flex: 1; overflow: auto; background: white; width: 100%; }
        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; }
        th { background: #1e293b; color: white; padding: 10px; text-align: left; font-size: 11px; border-right: 1px solid #334155; border-bottom: 1px solid #334155; position: sticky; top: 0; z-index: 10; text-transform: uppercase; overflow: hidden; }
        .resizer { position: absolute; right: 0; top: 0; width: 8px; height: 100%; cursor: col-resize; z-index: 11; }
        .resizer:hover { border-right: 3px solid #0ea5e9; }
        td { padding: 8px 10px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .row-overdue { background-color: #fee2e2; }
        .text-overdue { color: #dc2626; font-weight: bold; }
        .text-upcoming { color: #16a34a; font-weight: bold; }
        .report-btn { background: #f59e0b; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        input.edit-input { width: 100%; font-size: 12px; padding: 2px; border: 1px solid #0052cc; outline: none; }
      `}</style>

      <div style={{ display: 'flex', padding: '12px 20px', gap: '15px', background: '#0052cc', alignItems: 'center', color: 'white', zIndex: 20 }}>
        <b style={{ fontSize: '18px' }}>MD IMPEX CRM</b>
        <input placeholder="Ieškoti..." style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none' }} onChange={(e) => setSearchTerm(e.target.value)} />
        <button className="report-btn" onClick={handleSendReport}>SIŲSTI ATASKAITĄ</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={{ width: colWidths[i], minWidth: colWidths[i], maxWidth: colWidths[i] }}>
                  {col.label}
                  <div className="resizer" onMouseDown={(e) => onMouseDown(e, i)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => {
              const isOverdue = item["Sekanti patikra"] && item["Sekanti patikra"].includes('/') && new Date(item["Sekanti patikra"]) < new Date();
              return (
                <tr key={item.id} className={isOverdue ? 'row-overdue' : ''}>
                  {columns.map((col, i) => {
                    const isDateCol = col.key.includes('data') || col.key === "Sekanti patikra";
                    
                    return (
                      <td 
                        key={i} 
                        style={{ width: colWidths[i], minWidth: colWidths[i], maxWidth: colWidths[i] }}
                        className={col.key === "Sekanti patikra" ? (isOverdue ? "text-overdue" : "text-upcoming") : ""}
                        onDoubleClick={() => setEditingCell({ id: item.id, field: col.key })}
                        title={item[col.key]}
                      >
                        {editingCell?.id === item.id && editingCell?.field === col.key ? (
                          <input 
                            className="edit-input"
                            type={isDateCol ? "date" : "text"}
                            autoFocus 
                            defaultValue={isDateCol ? toInputFormat(item[col.key]) : item[col.key]} 
                            onBlur={(e) => handleSave(item.id, col.key, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave(item.id, col.key, e.target.value)}
                          />
                        ) : (item[col.key] || '—')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;