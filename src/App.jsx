// Papiweb desarrollos informaticos 
import { useState, useEffect } from "react";
import { initializeKV } from './services/kvStorage';

// ============================================================
// CRYPTO UTILS - Ya no se usan con Redis, pero los mantenemos
// ============================================================
const SECRET_KEY = "PAPIWEB_ACDM_2025_KEY";
function xorEncrypt(text, key) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}
function xorDecrypt(encoded, key) {
  try {
    const text = atob(encoded);
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch { return null; }
}

// ============================================================
// DATE UTILS
// ============================================================
function diasRestantes(fechaFin) {
  if (!fechaFin) return null;
  const hoy = new Date();
  const fin = new Date(fechaFin);
  const diff = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
  return diff;
}
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ============================================================
// STYLES (mantenemos el mismo STYLES que ya tenés)
// ============================================================
const STYLES = `/* tu mismo CSS de siempre */`;

// ============================================================
// CALENDAR COMPONENT
// ============================================================
function MiniCalendar({ year, month, rangeStart, rangeEnd, onNavigate }) {
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const dayNames = ["D","L","M","M","J","V","S"];
  
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function isInRange(d) {
    if (!rangeStart || !rangeEnd || !d) return false;
    const cur = new Date(year, month, d);
    const s = new Date(rangeStart); const e = new Date(rangeEnd);
    return cur >= s && cur <= e;
  }
  function isRangeStart(d) {
    if (!rangeStart || !d) return false;
    const s = new Date(rangeStart);
    return s.getFullYear() === year && s.getMonth() === month && s.getDate() === d;
  }
  function isRangeEnd(d) {
    if (!rangeEnd || !d) return false;
    const e = new Date(rangeEnd);
    return e.getFullYear() === year && e.getMonth() === month && e.getDate() === d;
  }
  function isToday(d) {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  }

  return (
    <div className="calendar">
      <div className="cal-header">
        <button className="btn-icon" onClick={() => onNavigate(-1)}>◀</button>
        <span>{monthNames[month]} {year}</span>
        <button className="btn-icon" onClick={() => onNavigate(1)}>▶</button>
      </div>
      <div className="cal-grid" style={{padding:'8px'}}>
        {dayNames.map(n => <div key={n} className="cal-day-header">{n}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={[
            "cal-day",
            !d ? "empty" : "",
            d && isToday(d) ? "today" : "",
            d && isRangeStart(d) ? "range-start" : "",
            d && isRangeEnd(d) ? "range-end" : "",
            d && isInRange(d) && !isRangeStart(d) && !isRangeEnd(d) ? "in-range" : "",
          ].join(" ")}>
            {d || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// DAYS REMAINING BADGE
// ============================================================
function DaysRemaining({ fechaFin }) {
  if (!fechaFin) return null;
  const dias = diasRestantes(fechaFin);
  const cls = dias <= 0 ? "days-danger" : dias <= 5 ? "days-danger" : dias <= 10 ? "days-warn" : "days-ok";
  const icon = dias <= 0 ? "🔴" : dias <= 5 ? "⚠️" : dias <= 10 ? "🟡" : "🟢";
  return (
    <span className={`days-remaining ${cls}`}>
      {icon} {dias <= 0 ? "VENCIDA" : `${dias} días`}
    </span>
  );
}

// ============================================================
// ALERT PANEL
// ============================================================
function AlertPanel({ escuelas }) {
  const alerts = [];
  
  escuelas.forEach(esc => {
    if (esc.docentes?.length === 0) {
      alerts.push({ type: "danger", icon: "🏫", title: `Sin ACDM asignado`, desc: `${esc.escuela} (${esc.de}) no tiene docente asignado.`, school: esc.escuela });
    }
    esc.docentes?.forEach(doc => {
      if (doc.estado === "Licencia" && doc.fechaFinLicencia) {
        const dias = diasRestantes(doc.fechaFinLicencia);
        if (dias <= 0) {
          alerts.push({ type: "danger", icon: "⛔", title: "Licencia VENCIDA", desc: `${doc.nombreApellido} — ${esc.escuela}. ${doc.motivo}. Vencida el ${formatDate(doc.fechaFinLicencia)}`, school: esc.escuela });
        } else if (dias <= 5) {
          alerts.push({ type: "danger", icon: "🔴", title: `Licencia por vencer (${dias} días)`, desc: `${doc.nombreApellido} — ${esc.escuela}. ${doc.motivo}. Vence ${formatDate(doc.fechaFinLicencia)}`, school: esc.escuela });
        } else if (dias <= 10) {
          alerts.push({ type: "warning", icon: "⚠️", title: `Licencia próxima a vencer (${dias} días)`, desc: `${doc.nombreApellido} — ${esc.escuela}. Vence ${formatDate(doc.fechaFinLicencia)}`, school: esc.escuela });
        }
      }
    });
    if (esc.alumnos?.length === 0 && esc.docentes?.length > 0) {
      alerts.push({ type: "info", icon: "👤", title: "Sin alumnos registrados", desc: `${esc.escuela} no tiene alumnos cargados en el sistema.`, school: esc.escuela });
    }
  });

  if (alerts.length === 0) return (
    <div className="alert alert-success"><span className="alert-icon">✅</span><div><strong>Sin alertas activas</strong><br/><span style={{fontSize:12}}>Todas las licencias y asignaciones están en orden.</span></div></div>
  );

  return (
    <div>
      {alerts.map((a, i) => (
        <div key={i} className={`alert alert-${a.type}`}>
          <span className="alert-icon">{a.icon}</span>
          <div><strong>{a.title}</strong><br/><span style={{fontSize:12,opacity:0.9}}>{a.desc}</span></div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// STATISTICS
// ============================================================
function Statistics({ escuelas }) {
  const totalEsc = escuelas.length;
  const totalAlumnos = escuelas.reduce((a, e) => a + (e.alumnos?.length || 0), 0);
  const totalDocentes = escuelas.reduce((a, e) => a + (e.docentes?.length || 0), 0);
  const docentesLicencia = escuelas.reduce((a, e) => a + (e.docentes?.filter(d => d.estado === "Licencia").length || 0), 0);
  const docentesActivos = totalDocentes - docentesLicencia;
  const sinAcdm = escuelas.filter(e => e.docentes?.length === 0).length;
  const totalSuplentes = escuelas.reduce((a, e) => a + (e.docentes?.reduce((b, d) => b + (d.suplentes?.length || 0), 0) || 0), 0);
  
  const byNivel = {};
  escuelas.forEach(e => { byNivel[e.nivel] = (byNivel[e.nivel] || 0) + 1; });
  const byDE = {};
  escuelas.forEach(e => { byDE[e.de] = (byDE[e.de] || 0) + 1; });
  
  const maxByNivel = Math.max(...Object.values(byNivel));
  const colors = ["#00d4ff","#00ff88","#ffd700","#ff6b35","#ff4757"];

  return (
    <div>
      <div className="stats-grid mb-24">
        {[
          { val: totalEsc, label: "Escuelas", icon: "🏫", color: "linear-gradient(90deg, #00d4ff, #0099cc)" },
          { val: totalAlumnos, label: "Alumnos", icon: "👨‍🎓", color: "linear-gradient(90deg, #00ff88, #00cc66)" },
          { val: docentesActivos, label: "ACDM Activos", icon: "✅", color: "linear-gradient(90deg, #00ff88, #00cc66)" },
          { val: docentesLicencia, label: "En Licencia", icon: "🔴", color: "linear-gradient(90deg, #ff4757, #cc2233)" },
          { val: totalSuplentes, label: "Suplentes", icon: "↔", color: "linear-gradient(90deg, #ffa502, #cc8800)" },
          { val: sinAcdm, label: "Sin ACDM", icon: "⚠️", color: "linear-gradient(90deg, #ff6b35, #cc4400)" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{"--gradient": s.color}}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      
      <div className="card-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Distribución por Nivel</span></div>
          <div className="chart-bar-wrap">
            {Object.entries(byNivel).map(([nivel, count], i) => (
              <div key={nivel} className="chart-bar-row">
                <div className="chart-bar-label">{nivel}</div>
                <div className="chart-bar-bg">
                  <div className="chart-bar-fill" style={{ width: `${(count/maxByNivel)*100}%`, background: colors[i % colors.length] }}>{count}</div>
                </div>
                <div className="chart-val">{count}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header"><span className="card-title">Estado ACDM</span></div>
          <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:40, padding:'20px 0'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:48, fontFamily:'Rajdhani', fontWeight:700, color:'var(--accent3)'}}>{docentesActivos}</div>
              <div style={{fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:1}}>Activos</div>
            </div>
            <div style={{fontSize:32, color:'var(--border2)'}}>VS</div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:48, fontFamily:'Rajdhani', fontWeight:700, color:'var(--red)'}}>{docentesLicencia}</div>
              <div style={{fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:1}}>En Licencia</div>
            </div>
          </div>
          {totalDocentes > 0 && (
            <div style={{background:'var(--bg2)', borderRadius:10, height:16, overflow:'hidden', marginTop:8}}>
              <div style={{height:'100%', width:`${(docentesActivos/totalDocentes)*100}%`, background:'linear-gradient(90deg, var(--accent3), var(--accent))', borderRadius:10, transition:'width 1s ease'}}></div>
            </div>
          )}
        </div>
        
        <div className="card">
          <div className="card-header"><span className="card-title">Por Distrito Escolar</span></div>
          <div className="chart-bar-wrap">
            {Object.entries(byDE).map(([de, count], i) => (
              <div key={de} className="chart-bar-row">
                <div className="chart-bar-label">{de}</div>
                <div className="chart-bar-bg">
                  <div className="chart-bar-fill" style={{ width: `${(count/Math.max(...Object.values(byDE)))*100}%`, background: colors[i % colors.length] }}>{count}</div>
                </div>
                <div className="chart-val">{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Alertas de Licencias</span></div>
          <AlertPanel escuelas={escuelas} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL COMPONENTS (se mantienen igual)
// ============================================================
function DocenteModal({ docente, titularId, isNew, onSave, onClose }) {
  const [form, setForm] = useState(docente || {
    id: `d${Date.now()}`, cargo: "Titular", nombreApellido: "",
    estado: "Activo", motivo: "-", diasAutorizados: 0,
    fechaInicioLicencia: null, fechaFinLicencia: null, suplentes: []
  });
  
  const MOTIVOS = ["-","Art. 101 - Enfermedad","Art. 102 - Familiar enfermo","Art. 103 - Maternidad","Art. 104 - Accidente de trabajo","Art. 108 - Gremial","Art. 115 - Estudio","Art. 140 - Concurso","Otro"];
  
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  
  function navCal(d) {
    let m = calMonth + d; let y = calYear;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setCalMonth(m); setCalYear(y);
  }
  
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isNew ? "➕ Nuevo Docente" : "✏️ Editar Docente"}</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cargo</label>
            <select className="form-select" value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})}>
              <option>Titular</option><option>Suplente</option><option>Interino</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nombre y Apellido</label>
            <input className="form-input" value={form.nombreApellido} onChange={e => setForm({...form, nombreApellido: e.target.value})} placeholder="Apellido, Nombre" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="form-select" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
              <option>Activo</option><option>Licencia</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Motivo (Art.)</label>
            <select className="form-select" value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})}>
              {MOTIVOS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        {form.estado === "Licencia" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Días Autorizados</label>
                <input type="number" className="form-input" value={form.diasAutorizados} onChange={e => setForm({...form, diasAutorizados: Number(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Inicio Licencia</label>
                <input type="date" className="form-input" value={form.fechaInicioLicencia || ""} onChange={e => setForm({...form, fechaInicioLicencia: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha Fin Licencia</label>
                <input type="date" className="form-input" value={form.fechaFinLicencia || ""} onChange={e => setForm({...form, fechaFinLicencia: e.target.value})} />
              </div>
            </div>
            {(form.fechaInicioLicencia || form.fechaFinLicencia) && (
              <div className="mb-16">
                <MiniCalendar year={calYear} month={calMonth} rangeStart={form.fechaInicioLicencia} rangeEnd={form.fechaFinLicencia} onNavigate={navCal} />
              </div>
            )}
          </>
        )}
        <div className="flex gap-8 justify-end mt-16">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSave(form); onClose(); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function AlumnoModal({ alumno, isNew, onSave, onClose }) {
  const [form, setForm] = useState(alumno || { id: `a${Date.now()}`, gradoSalaAnio: "", nombre: "", diagnostico: "", observaciones: "" });
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isNew ? "➕ Nuevo Alumno" : "✏️ Editar Alumno"}</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Grado / Sala / Año</label>
            <input className="form-input" value={form.gradoSalaAnio} onChange={e => setForm({...form, gradoSalaAnio: e.target.value})} placeholder="Ej: 3° Grado" />
          </div>
          <div className="form-group">
            <label className="form-label">Alumno (Apellido, Nombre)</label>
            <input className="form-input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Apellido, Nombre" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Diagnóstico</label>
          <input className="form-input" value={form.diagnostico} onChange={e => setForm({...form, diagnostico: e.target.value})} placeholder="Ej: TEA Nivel 1, TDAH..." />
        </div>
        <div className="form-group">
          <label className="form-label">Observaciones</label>
          <textarea className="form-textarea" value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} placeholder="Observaciones adicionales..." />
        </div>
        <div className="flex gap-8 justify-end mt-16">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSave(form); onClose(); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function EscuelaModal({ escuela, isNew, onSave, onClose }) {
  const [form, setForm] = useState(escuela || {
    id: `e${Date.now()}`, de: "", escuela: "", nivel: "Primario",
    direccion: "", lat: null, lng: null, telefonos: [""], mail: "",
    jornada: "Completa", turno: "Mañana", alumnos: [], docentes: []
  });
  
  function setPhone(i, val) {
    const t = [...form.telefonos]; t[i] = val; setForm({...form, telefonos: t});
  }
  
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isNew ? "➕ Nueva Escuela" : "✏️ Editar Escuela"}</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Distrito Escolar (DE)</label>
            <input className="form-input" value={form.de} onChange={e => setForm({...form, de: e.target.value})} placeholder="Ej: DE 01" />
          </div>
          <div className="form-group">
            <label className="form-label">Nivel</label>
            <select className="form-select" value={form.nivel} onChange={e => setForm({...form, nivel: e.target.value})}>
              <option>Inicial</option><option>Primario</option><option>Secundario</option><option>Especial</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Nombre de la Escuela</label>
          <input className="form-input" value={form.escuela} onChange={e => setForm({...form, escuela: e.target.value})} placeholder="Ej: Escuela N°1 ..." />
        </div>
        <div className="form-group">
          <label className="form-label">Dirección</label>
          <input className="form-input" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Calle, número, localidad" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Latitud (opcional)</label>
            <input type="number" className="form-input" value={form.lat || ""} onChange={e => setForm({...form, lat: parseFloat(e.target.value)})} placeholder="-34.603" />
          </div>
          <div className="form-group">
            <label className="form-label">Longitud (opcional)</label>
            <input type="number" className="form-input" value={form.lng || ""} onChange={e => setForm({...form, lng: parseFloat(e.target.value)})} placeholder="-58.381" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Mail Institucional</label>
          <input type="email" className="form-input" value={form.mail} onChange={e => setForm({...form, mail: e.target.value})} placeholder="escuela@bue.edu.ar" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Jornada</label>
            <select className="form-select" value={form.jornada} onChange={e => setForm({...form, jornada: e.target.value})}>
              <option>Simple</option><option>Completa</option><option>Extendida</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Turno</label>
            <select className="form-select" value={form.turno} onChange={e => setForm({...form, turno: e.target.value})}>
              <option>Mañana</option><option>Tarde</option><option>Vespertino</option><option>Noche</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Teléfonos</label>
          {form.telefonos.map((t, i) => (
            <div key={i} className="flex gap-8 mb-8">
              <input className="form-input" value={t} onChange={e => setPhone(i, e.target.value)} placeholder="011-XXXX-XXXX" />
              {form.telefonos.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => setForm({...form, telefonos: form.telefonos.filter((_,j)=>j!==i)})}>✕</button>}
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={() => setForm({...form, telefonos: [...form.telefonos, ""]})}>+ Agregar teléfono</button>
        </div>
        <div className="flex gap-8 justify-end mt-16">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSave(form); onClose(); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SCHOOL DETAIL VIEW (simplificado por espacio)
// ============================================================
function EscuelaDetail({ esc, onEdit, onAddDocente, onEditDocente, onDeleteDocente, onAddAlumno, onEditAlumno, onDeleteAlumno, viewMode, isAdmin }) {
  const [expanded, setExpanded] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [activeTab, setActiveTab] = useState("docentes");
  
  function navCal(d) {
    let m = calMonth + d; let y = calYear;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setCalMonth(m); setCalYear(y);
  }
  
  const hasAlerts = esc.docentes?.length === 0 || esc.docentes?.some(d => d.estado === "Licencia" && d.fechaFinLicencia && diasRestantes(d.fechaFinLicencia) <= 10);

  const openMaps = (e) => {
    e.stopPropagation();
    const q = esc.lat && esc.lng ? `${esc.lat},${esc.lng}` : encodeURIComponent(esc.direccion);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };
  
  const openMail = (mailAddr, e) => {
    e.stopPropagation();
    const subject = encodeURIComponent(`Sistema ACDM - ${esc.escuela}`);
    window.open(`mailto:${mailAddr}?subject=${subject}`, "_blank");
  };

  return (
    <div className="school-card">
      <div className="school-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between flex-wrap gap-8">
          <div>
            <div className="school-de">{esc.de}</div>
            <div className="school-name">{esc.escuela}</div>
          </div>
          <div className="flex items-center gap-8">
            {hasAlerts && <span style={{animation:'pulse 1s infinite', fontSize:18}}>⚠️</span>}
            <span style={{color:'var(--text3)', fontSize:20}}>{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
        <div className="school-meta">
          <span className="school-meta-item">📚 {esc.nivel}</span>
          <span className="school-meta-item">⏱ {esc.jornada}</span>
          <span className="school-meta-item">🌅 {esc.turno}</span>
          <span className="school-meta-item clickable" onClick={openMaps}>📍 {esc.direccion}</span>
          {esc.telefonos?.map((t, i) => <span key={i} className="school-meta-item">📞 {t}</span>)}
          <span className="school-meta-item link" onClick={(e) => openMail(esc.mail, e)}>✉️ {esc.mail}</span>
        </div>
      </div>
      {expanded && (
        <div className="school-card-body">
          <div className="flex items-center justify-between mb-16">
            <div className="view-toggle">
              <button className={`view-btn ${activeTab === "docentes" ? "active" : ""}`} onClick={() => setActiveTab("docentes")}>👨‍🏫 Docentes</button>
              <button className={`view-btn ${activeTab === "alumnos" ? "active" : ""}`} onClick={() => setActiveTab("alumnos")}>👨‍🎓 Alumnos</button>
              <button className={`view-btn ${activeTab === "info" ? "active" : ""}`} onClick={() => setActiveTab("info")}>ℹ️ Info</button>
            </div>
            <div className="flex gap-8">
              {isAdmin && <button className="btn btn-secondary btn-sm" onClick={onEdit}>✏️ Editar</button>}
              {isAdmin && activeTab === "docentes" && <button className="btn btn-primary btn-sm" onClick={() => onAddDocente(esc.id)}>+ ACDM</button>}
              {isAdmin && activeTab === "alumnos" && <button className="btn btn-primary btn-sm" onClick={() => onAddAlumno(esc.id)}>+ Alumno</button>}
            </div>
          </div>
          
          {activeTab === "docentes" && (
            <div>
              {!esc.docentes?.length && <div className="no-data">⚠️ Sin docentes asignados</div>}
              {esc.docentes?.map(doc => (
                <div key={doc.id}>
                  <div className="docente-row">
                    <div className="docente-header">
                      <span className={`badge badge-${doc.cargo?.toLowerCase()}`}>{doc.cargo}</span>
                      <span className="docente-name">{doc.nombreApellido}</span>
                      <span className={`badge badge-${doc.estado === "Activo" ? "active" : "licencia"}`}>{doc.estado}</span>
                      {doc.estado === "Licencia" && <DaysRemaining fechaFin={doc.fechaFinLicencia} />}
                      {isAdmin && (
                        <div className="flex gap-4" style={{marginLeft:'auto'}}>
                          <button className="btn btn-secondary btn-sm" onClick={() => onEditDocente(esc.id, doc)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => onDeleteDocente(esc.id, doc.id)}>🗑️</button>
                          {doc.cargo === "Titular" && <button className="btn btn-secondary btn-sm" onClick={() => onAddDocente(esc.id, doc.id)}>+ Suplente</button>}
                        </div>
                      )}
                    </div>
                    {doc.estado === "Licencia" && (
                      <div className="docente-details mt-8">
                        <div className="detail-item"><div className="detail-label">Motivo</div><div className="detail-val">{doc.motivo}</div></div>
                        <div className="detail-item"><div className="detail-label">Días Autorizados</div><div className="detail-val">{doc.diasAutorizados} días</div></div>
                        <div className="detail-item"><div className="detail-label">Inicio</div><div className="detail-val">{formatDate(doc.fechaInicioLicencia)}</div></div>
                        <div className="detail-item"><div className="detail-label">Fin</div><div className="detail-val">{formatDate(doc.fechaFinLicencia)}</div></div>
                      </div>
                    )}
                  </div>
                  {doc.suplentes?.map(s => (
                    <div key={s.id} className="docente-row suplente-row">
                      <div className="docente-header">
                        <span style={{fontSize:12, color:'var(--yellow)'}}>↳ Cubre a: <strong>{doc.nombreApellido}</strong></span>
                        <span className={`badge badge-${s.cargo?.toLowerCase()}`}>{s.cargo}</span>
                        <span className="docente-name">{s.nombreApellido}</span>
                        <span className={`badge badge-${s.estado === "Activo" ? "active" : "licencia"}`}>{s.estado}</span>
                        {s.fechaIngreso && <span style={{fontSize:11, color:'var(--text3)'}}>desde {formatDate(s.fechaIngreso)}</span>}
                        {isAdmin && (
                          <div className="flex gap-4" style={{marginLeft:'auto'}}>
                            <button className="btn btn-secondary btn-sm" onClick={() => onEditDocente(esc.id, s, doc.id)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => onDeleteDocente(esc.id, s.id, doc.id)}>🗑️</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          
          {activeTab === "alumnos" && (
            <div className="table-wrap">
              {!esc.alumnos?.length ? <div className="no-data">Sin alumnos registrados</div> : (
                <table>
                  <thead><tr><th>Grado/Sala</th><th>Alumno</th><th>Diagnóstico</th><th>Observaciones</th>{isAdmin && <th>Acciones</th>}</tr></thead>
                  <tbody>
                    {esc.alumnos.map(a => (
                      <tr key={a.id}>
                        <td><span className="badge badge-info" style={{background:'rgba(0,212,255,0.1)', color:'var(--accent)', border:'1px solid rgba(0,212,255,0.2)'}}>{a.gradoSalaAnio}</span></td>
                        <td style={{fontWeight:600}}>{a.nombre}</td>
                        <td><span style={{color:'var(--yellow)', fontSize:12}}>{a.diagnostico}</span></td>
                        <td style={{color:'var(--text2)', fontSize:12, maxWidth:200}}>{a.observaciones}</td>
                        {isAdmin && <td><div className="flex gap-4">
                          <button className="btn btn-secondary btn-sm" onClick={() => onEditAlumno(esc.id, a)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => onDeleteAlumno(esc.id, a.id)}>🗑️</button>
                        </div></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          
          {activeTab === "info" && (
            <div className="school-info-grid">
              <div>
                <div className="school-info-label">Dirección</div>
                <div className="school-info-val link" onClick={openMaps}>📍 {esc.direccion}</div>
              </div>
              <div>
                <div className="school-info-label">Mail</div>
                <div className="school-info-val link" onClick={(e) => openMail(esc.mail, e)}>✉️ {esc.mail}</div>
              </div>
              <div>
                <div className="school-info-label">Teléfonos</div>
                <div className="school-info-val">{esc.telefonos?.join(" | ")}</div>
              </div>
              <div>
                <div className="school-info-label">Jornada / Turno</div>
                <div className="school-info-val">{esc.jornada} — {esc.turno}</div>
              </div>
              <div>
                <div className="school-info-label">Nivel</div>
                <div className="school-info-val">{esc.nivel}</div>
              </div>
              <div>
                <div className="school-info-label">Distrito Escolar</div>
                <div className="school-info-val">{esc.de}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PDF EXPORT
// ============================================================
function ExportPDF({ escuelas, onClose }) {
  const [filter, setFilter] = useState("all");
  const [tipo, setTipo] = useState("completo");
  
  function doExport() {
    const data = filter === "all" ? escuelas : escuelas.filter(e => e.de === filter);
    const lines = [];
    lines.push(`SISTEMA ACDM - REPORTE ${tipo.toUpperCase()}`);
    lines.push(`Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`);
    lines.push(`Desarrollado por: PAPIWEB Desarrollos Informáticos`);
    lines.push("─".repeat(60));
    data.forEach(esc => {
      lines.push(`\n${esc.de} | ${esc.escuela}`);
      lines.push(`Nivel: ${esc.nivel} | Jornada: ${esc.jornada} | Turno: ${esc.turno}`);
      lines.push(`Dirección: ${esc.direccion}`);
      lines.push(`Mail: ${esc.mail} | Tel: ${esc.telefonos?.join(", ")}`);
      if (tipo !== "mini") {
        lines.push(`\n  DOCENTES (${esc.docentes?.length || 0}):`);
        esc.docentes?.forEach(d => {
          lines.push(`  - [${d.cargo}] ${d.nombreApellido} — ${d.estado}${d.estado === "Licencia" ? ` (${d.motivo}, hasta ${formatDate(d.fechaFinLicencia)})` : ""}`);
          d.suplentes?.forEach(s => lines.push(`      ↳ [${s.cargo}] ${s.nombreApellido} — ${s.estado}`));
        });
        lines.push(`\n  ALUMNOS (${esc.alumnos?.length || 0}):`);
        esc.alumnos?.forEach(a => lines.push(`  - ${a.gradoSalaAnio}: ${a.nombre} — ${a.diagnostico}`));
      }
      lines.push("─".repeat(60));
    });
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ACDM_Reporte_${new Date().toISOString().split("T")[0]}.txt`;
    a.click(); URL.revokeObjectURL(url);
    onClose();
  }
  
  const des = [...new Set(escuelas.map(e => e.de))];
  
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">📄 Exportar Reporte</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Filtrar por DE</label>
            <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">Todos los distritos</option>
              {des.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tipo de Reporte</label>
            <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="completo">Completo (escuelas + docentes + alumnos)</option>
              <option value="docentes">Solo Docentes y Licencias</option>
              <option value="mini">Resumen ejecutivo</option>
            </select>
          </div>
        </div>
        
        <div className="pdf-preview">
          <div className="pdf-header">
            <div className="pdf-title">Sistema ACDM — Reporte {tipo}</div>
            <div className="pdf-sub">Generado por PAPIWEB Desarrollos Informáticos · {new Date().toLocaleDateString('es-AR')}</div>
          </div>
          {(filter === "all" ? escuelas : escuelas.filter(e => e.de === filter)).map(esc => (
            <div key={esc.id} style={{marginBottom:12, paddingBottom:8, borderBottom:'1px solid #ddd'}}>
              <div style={{fontWeight:700, color:'#0066aa'}}>{esc.de} — {esc.escuela}</div>
              <div style={{fontSize:11, color:'#444'}}>{esc.nivel} | {esc.jornada} | {esc.turno} | {esc.mail}</div>
              {tipo !== "mini" && esc.docentes?.map(d => (
                <div key={d.id} style={{marginLeft:12, marginTop:4, fontSize:11}}>
                  <span style={{fontWeight:700}}>[{d.cargo}]</span> {d.nombreApellido} — <span style={{color: d.estado === "Activo" ? "green" : "red"}}>{d.estado}</span>
                  {d.estado === "Licencia" && <span style={{color:'#888'}}> · {d.motivo} hasta {formatDate(d.fechaFinLicencia)}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <div className="flex gap-8 justify-end mt-16">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={doExport}>⬇️ Exportar TXT</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  
  async function doLogin() {
    const success = await onLogin(user, pass);
    if (!success) {
      setErr("Credenciales incorrectas");
    }
  }
  
  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{textAlign:'center', marginBottom:24}}>
          <div style={{marginBottom:12, display:'flex', justifyContent:'center'}}>
            <div className="papiweb-logo" style={{padding:'8px 20px'}}>
              <div className="papiweb-text" style={{fontSize:22, letterSpacing:3}}>PAPIWEB</div>
              <div className="papiweb-sub">Desarrollos Informáticos</div>
            </div>
          </div>
          <div className="login-title">Sistema ACDM</div>
          <div className="login-sub">Gestión de Asistentes de Clase</div>
        </div>
        <div className="form-group">
          <label className="form-label">Usuario</label>
          <input className="form-input" value={user} onChange={e => setUser(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()} placeholder="Usuario" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input type="password" className="form-input" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()} placeholder="••••••••" />
        </div>
        {err && <div className="alert alert-danger" style={{marginBottom:12}}><span>⚠️</span>{err}</div>}
        <button className="btn btn-primary" style={{width:'100%', justifyContent:'center', marginTop:8}} onClick={doLogin}>Ingresar →</button>
        <div className="hint-text">
          Demo: <span className="hint-key">admin</span> / <span className="hint-key">admin2025</span>
          <br/>Acceso rápido: <span className="hint-key">Ctrl+Alt+A</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CALENDARIO VIEW
// ============================================================
function CalendarioView({ escuelas }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const dayNames = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  
  function navCal(d) {
    let m = month + d; let y = year;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  function getEventsForDay(d) {
    const date = new Date(year, month, d);
    const events = [];
    escuelas.forEach(esc => {
      esc.docentes?.forEach(doc => {
        if (doc.fechaInicioLicencia && doc.fechaFinLicencia) {
          const s = new Date(doc.fechaInicioLicencia);
          const e = new Date(doc.fechaFinLicencia);
          if (date >= s && date <= e) {
            events.push({ type: "licencia", name: doc.nombreApellido, esc: esc.escuela, motivo: doc.motivo });
          }
        }
      });
    });
    return events;
  }
  
  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];
  const today = new Date();
  
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  
  return (
    <div>
      <h1 style={{fontFamily:'Rajdhani', fontSize:28, fontWeight:700, color:'var(--accent)', letterSpacing:2, marginBottom:24}}>Calendario Interactivo</h1>
      <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:24}}>
        <div className="card">
          <div className="flex items-center justify-between mb-16">
            <button className="btn btn-secondary" onClick={() => navCal(-1)}>◀ Anterior</button>
            <div style={{fontFamily:'Rajdhani', fontSize:22, fontWeight:700, color:'var(--accent)', letterSpacing:2}}>{monthNames[month]} {year}</div>
            <button className="btn btn-secondary" onClick={() => navCal(1)}>Siguiente ▶</button>
          </div>
          
          <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4}}>
            {dayNames.map(n => (
              <div key={n} style={{textAlign:'center', padding:'8px 4px', fontSize:11, color:'var(--text3)', fontWeight:700, letterSpacing:1, textTransform:'uppercase'}}>{n}</div>
            ))}
            {cells.map((d, i) => {
              const events = d ? getEventsForDay(d) : [];
              const isToday = d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
              const isSelected = d === selectedDay;
              return (
                <div key={i} onClick={() => d && setSelectedDay(d)} style={{
                  minHeight:60, padding:'6px 8px', borderRadius:8, cursor: d ? 'pointer' : 'default',
                  background: isSelected ? 'rgba(0,212,255,0.15)' : isToday ? 'rgba(0,212,255,0.08)' : events.length > 0 ? 'rgba(255,71,87,0.08)' : 'var(--card2)',
                  border: isSelected ? '1px solid var(--accent)' : isToday ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}>
                  {d && <>
                    <div style={{fontSize:13, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--accent)' : 'var(--text)'}}>{d}</div>
                    {events.slice(0, 2).map((ev, j) => (
                      <div key={j} style={{fontSize:9, background:'rgba(255,71,87,0.3)', color:'var(--red)', borderRadius:3, padding:'1px 4px', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>🔴</div>
                    ))}
                    {events.length > 2 && <div style={{fontSize:9, color:'var(--text3)'}}>+{events.length-2}</div>}
                  </>}
                </div>
              );
            })}
          </div>
        </div>
        
        <div>
          {selectedDay ? (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{selectedDay} de {monthNames[month]}</span>
                <button className="btn-icon" onClick={() => setSelectedDay(null)}>✕</button>
              </div>
              {dayEvents.length === 0 ? (
                <div style={{color:'var(--text3)', fontSize:13, padding:'20px 0'}}>Sin eventos para este día</div>
              ) : (
                dayEvents.map((ev, i) => (
                  <div key={i} className="alert alert-danger" style={{marginBottom:8}}>
                    <span>🔴</span>
                    <div>
                      <strong>{ev.name}</strong><br/>
                      <span style={{fontSize:12}}>{ev.esc}</span><br/>
                      <span style={{fontSize:11, opacity:0.8}}>{ev.motivo}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="card">
              <div className="card-header"><span className="card-title">📋 Licencias del Mes</span></div>
              {escuelas.flatMap(esc => esc.docentes?.filter(d => d.fechaInicioLicencia).map(d => ({...d, esc: esc.escuela})) || []).map((d, i) => (
                <div key={i} className="docente-row" style={{marginBottom:8}}>
                  <div style={{fontFamily:'Rajdhani', fontWeight:700}}>{d.nombreApellido}</div>
                  <div style={{fontSize:11, color:'var(--text2)', marginTop:2}}>{d.esc}</div>
                  <div style={{fontSize:11, color:'var(--yellow)', marginTop:2}}>{d.motivo}</div>
                  <div style={{fontSize:11, color:'var(--text3)', marginTop:2}}>{formatDate(d.fechaInicioLicencia)} → {formatDate(d.fechaFinLicencia)}</div>
                </div>
              ))}
              {!escuelas.some(esc => esc.docentes?.some(d => d.fechaInicioLicencia)) && (
                <div className="no-data">Sin licencias registradas</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [db, setDB] = useState({ escuelas: [], usuarios: [], alertasLeidas: [] });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [viewMode, setViewMode] = useState("full");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  
  const [escuelaModal, setEscuelaModal] = useState(null);
  const [docenteModal, setDocenteModal] = useState(null);
  const [alumnoModal, setAlumnoModal] = useState(null);
  
  const isAdmin = currentUser?.rol === "admin";

  // Función para cargar datos desde Redis
  async function loadData() {
    try {
      setLoading(true);
      
      // Cargar escuelas
      const escuelasRes = await fetch('/api/kv/escuelas');
      const escuelas = await escuelasRes.json();
      
      // Cargar usuarios (sin contraseñas)
      const usuariosRes = await fetch('/api/kv/usuarios');
      const usuarios = await usuariosRes.json();
      
      setDB({ escuelas, usuarios, alertasLeidas: [] });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }

  // Inicializar KV y cargar datos al montar
  useEffect(() => {
    async function init() {
      await initializeKV();
      await loadData();
    }
    init();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e) {
      if (e.ctrlKey && e.altKey && e.key === "a") {
        // Auto-login como admin
        handleLogin("admin", "admin2025");
      }
      if (e.ctrlKey && e.key === "f") { 
        e.preventDefault(); 
        document.querySelector(".search-main")?.focus(); 
      }
      if (e.ctrlKey && e.key === "e" && isAdmin) setShowExport(true);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAdmin]);

  // Función de login
  async function handleLogin(username, password) {
    try {
      // Primero intentar con el usuario por defecto
      if (username === "admin" && password === "admin2025") {
        setCurrentUser({ id: "u1", username: "admin", rol: "admin" });
        return true;
      }
      
      // Si no, buscar en Redis
      const usuariosRes = await fetch('/api/kv/usuarios');
      const usuarios = await usuariosRes.json();
      
      const found = usuarios.find(u => u.username === username && u.passwordHash === btoa(password));
      if (found) {
        setCurrentUser(found);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  }

  // Funciones para guardar cambios
  async function saveEscuelasToRedis(escuelas) {
    try {
      await fetch('/api/kv/escuelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escuelas })
      });
    } catch (error) {
      console.error('Error guardando escuelas:', error);
    }
  }

  // Operaciones CRUD
  function updateEscuelas(updater) {
    setDB(prev => {
      const newEscuelas = updater(prev.escuelas);
      saveEscuelasToRedis(newEscuelas);
      return { ...prev, escuelas: newEscuelas };
    });
  }
  
  function saveEscuela(form) {
    updateEscuelas(escuelas => {
      const idx = escuelas.findIndex(e => e.id === form.id);
      if (idx >= 0) { 
        const a = [...escuelas]; 
        a[idx] = {...a[idx], ...form, updatedAt: new Date().toISOString()}; 
        return a; 
      }
      return [...escuelas, {...form, id: form.id || `e${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()}];
    });
    setEscuelaModal(null);
  }
  
  function deleteEscuela(id) {
    if (!confirm("¿Eliminar escuela?")) return;
    updateEscuelas(esc => esc.filter(e => e.id !== id));
  }
  
  async function addDocente(escuelaId, docForm, titularId) {
    try {
      const response = await fetch('/api/kv/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escuelaId, docente: docForm, titularId })
      });
      
      const result = await response.json();
      if (result.success) {
        await loadData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error agregando docente:', error);
    }
    setDocenteModal(null);
  }
  
  async function updateDocente(escuelaId, docForm, titularId) {
    try {
      const response = await fetch('/api/kv/docentes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escuelaId, docente: docForm, titularId })
      });
      
      const result = await response.json();
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error actualizando docente:', error);
    }
    setDocenteModal(null);
  }
  
  async function deleteDocente(escuelaId, docenteId, titularId) {
    if (!confirm("¿Eliminar docente?")) return;
    
    try {
      const response = await fetch('/api/kv/docentes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escuelaId, docenteId, titularId })
      });
      
      const result = await response.json();
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error eliminando docente:', error);
    }
  }
  
  function addAlumno(escuelaId, alumnoForm) {
    updateEscuelas(escuelas => escuelas.map(esc => 
      esc.id !== escuelaId ? esc : { 
        ...esc, 
        alumnos: [...(esc.alumnos || []), {
          ...alumnoForm,
          id: alumnoForm.id || `a${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }] 
      }
    ));
    setAlumnoModal(null);
  }
  
  function updateAlumno(escuelaId, alumnoForm) {
    updateEscuelas(escuelas => escuelas.map(esc => 
      esc.id !== escuelaId ? esc : { 
        ...esc, 
        alumnos: (esc.alumnos || []).map(a => 
          a.id === alumnoForm.id ? {...alumnoForm, updatedAt: new Date().toISOString()} : a
        ) 
      }
    ));
    setAlumnoModal(null);
  }
  
  function deleteAlumno(escuelaId, alumnoId) {
    if (!confirm("¿Eliminar alumno?")) return;
    updateEscuelas(escuelas => escuelas.map(esc => 
      esc.id !== escuelaId ? esc : { 
        ...esc, 
        alumnos: (esc.alumnos || []).filter(a => a.id !== alumnoId) 
      }
    ));
  }

  const alertCount = db.escuelas.reduce((a, esc) => {
    if (!esc.docentes?.length) a++;
    esc.docentes?.forEach(d => { 
      if (d.estado === "Licencia" && d.fechaFinLicencia && diasRestantes(d.fechaFinLicencia) <= 10) a++; 
    });
    return a;
  }, 0);
  
  const filteredEscuelas = db.escuelas.filter(e =>
    !search || e.escuela?.toLowerCase().includes(search.toLowerCase()) ||
    e.de?.toLowerCase().includes(search.toLowerCase()) ||
    e.nivel?.toLowerCase().includes(search.toLowerCase()) ||
    e.docentes?.some(d => d.nombreApellido?.toLowerCase().includes(search.toLowerCase())) ||
    e.alumnos?.some(a => a.nombre?.toLowerCase().includes(search.toLowerCase()))
  );
  
  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'var(--bg)'}}>
          <div className="papiweb-logo" style={{padding:'20px'}}>
            <div className="papiweb-text" style={{fontSize:24}}>Cargando...</div>
          </div>
        </div>
      </>
    );
  }
  
  if (!currentUser) {
    return (
      <>
        <style>{STYLES}</style>
        <Login onLogin={handleLogin} />
      </>
    );
  }
  
  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "escuelas", icon: "🏫", label: "Escuelas", badge: 0 },
    { id: "alertas", icon: "🔔", label: "Alertas", badge: alertCount },
    { id: "estadisticas", icon: "📈", label: "Estadísticas" },
    { id: "calendario", icon: "📅", label: "Calendario" },
    { id: "exportar", icon: "📄", label: "Exportar" },
  ];
  
  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <header className="header">
          <div className="flex items-center gap-16">
            <button className="btn-icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{fontSize:18}}>☰</button>
            <div>
              <div className="header-title">🏫 Sistema ACDM</div>
              <div className="header-sub">Gestión de Asistentes de Clase para Discapacidad Motriz</div>
            </div>
          </div>
          <div className="flex items-center gap-16">
            <div className="search-input-wrap" style={{width:220}}>
              <span className="search-icon">🔍</span>
              <input className="form-input search-main" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{paddingLeft:32}} />
            </div>
            <div className="papiweb-brand">
              <div className="led-dot" />
              <div className="papiweb-logo">
                <div className="papiweb-text">PAPIWEB</div>
                <div className="papiweb-sub">Desarrollos Informáticos</div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <span style={{fontSize:11, color:'var(--text2)'}}>{currentUser.username}</span>
              <span className={`badge ${isAdmin ? "badge-titular" : "badge-active"}`}>{currentUser.rol}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentUser(null)}>Salir</button>
            </div>
          </div>
        </header>
        
        <div className="main">
          <nav className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
            <div className="nav-section" style={{display: sidebarCollapsed ? 'none' : 'block'}}>Navegación</div>
            {navItems.map(item => (
              <div key={item.id} className={`nav-item ${activeSection === item.id ? "active" : ""}`} onClick={() => setActiveSection(item.id)}>
                <span className="nav-icon">{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
                {!sidebarCollapsed && item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
            
            {isAdmin && !sidebarCollapsed && (
              <>
                <hr className="divider" />
                <div className="nav-section">Admin</div>
                <div className="nav-item" onClick={() => { setEscuelaModal({ isNew: true, data: null }); setActiveSection("escuelas"); }}>
                  <span className="nav-icon">➕</span>
                  <span>Nueva Escuela</span>
                </div>
              </>
            )}
            
            {!sidebarCollapsed && (
              <div style={{padding:'20px 16px', marginTop:'auto'}}>
                <div style={{fontSize:9, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', lineHeight:1.6}}>
                  Atajos de teclado:<br/>
                  Ctrl+F: Buscar<br/>
                  Ctrl+E: Exportar<br/>
                  Ctrl+Alt+A: Admin
                </div>
              </div>
            )}
          </nav>
          
          <main className="content">
            {activeSection === "dashboard" && (
              <div>
                <div className="flex items-center justify-between mb-24">
                  <div>
                    <h1 style={{fontFamily:'Rajdhani', fontSize:28, fontWeight:700, color:'var(--accent)', letterSpacing:2}}>Dashboard</h1>
                    <p style={{color:'var(--text2)', fontSize:13}}>Vista general del sistema — {new Date().toLocaleDateString('es-AR', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</p>
                  </div>
                </div>
                <Statistics escuelas={db.escuelas} />
              </div>
            )}
            
            {activeSection === "escuelas" && (
              <div>
                <div className="flex items-center justify-between mb-16">
                  <div>
                    <h1 style={{fontFamily:'Rajdhani', fontSize:28, fontWeight:700, color:'var(--accent)', letterSpacing:2}}>Escuelas</h1>
                    <p style={{color:'var(--text2)', fontSize:13}}>{filteredEscuelas.length} escuela(s) encontrada(s)</p>
                  </div>
                  <div className="flex gap-8 items-center flex-wrap">
                    <div className="view-toggle">
                      <button className={`view-btn ${viewMode === "full" ? "active" : ""}`} onClick={() => setViewMode("full")}>Completo</button>
                      <button className={`view-btn ${viewMode === "compact" ? "active" : ""}`} onClick={() => setViewMode("compact")}>Compacto</button>
                    </div>
                    {isAdmin && <button className="btn btn-primary" onClick={() => setEscuelaModal({ isNew: true, data: null })}>➕ Nueva Escuela</button>}
                  </div>
                </div>
                
                {filteredEscuelas.length === 0 && <div className="no-data card">No se encontraron escuelas. {isAdmin && <button className="btn btn-primary btn-sm" style={{marginLeft:8}} onClick={() => setEscuelaModal({isNew:true,data:null})}>Crear primera escuela</button>}</div>}
                
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {filteredEscuelas.map(esc => (
                    <EscuelaDetail key={esc.id} esc={esc} viewMode={viewMode} isAdmin={isAdmin}
                      onEdit={() => setEscuelaModal({ isNew: false, data: esc })}
                      onAddDocente={(escId, titularId) => setDocenteModal({ isNew: true, escuelaId: escId, titularId: titularId || null, data: null })}
                      onEditDocente={(escId, doc, titularId) => setDocenteModal({ isNew: false, escuelaId: escId, titularId: titularId || null, data: doc })}
                      onDeleteDocente={deleteDocente}
                      onAddAlumno={(escId) => setAlumnoModal({ isNew: true, escuelaId: escId, data: null })}
                      onEditAlumno={(escId, alumno) => setAlumnoModal({ isNew: false, escuelaId: escId, data: alumno })}
                      onDeleteAlumno={deleteAlumno}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {activeSection === "alertas" && (
              <div>
                <h1 style={{fontFamily:'Rajdhani', fontSize:28, fontWeight:700, color:'var(--accent)', letterSpacing:2, marginBottom:8}}>Centro de Alertas</h1>
                <p style={{color:'var(--text2)', fontSize:13, marginBottom:24}}>{alertCount} alerta(s) activa(s)</p>
                <AlertPanel escuelas={db.escuelas} />
                
                <div className="card mt-16">
                  <div className="card-header"><span className="card-title">📋 Resumen de Licencias Activas</span></div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Escuela</th><th>Docente</th><th>Motivo</th><th>Inicio</th><th>Fin</th><th>Días Rest.</th><th>Suplente</th></tr></thead>
                      <tbody>
                        {db.escuelas.flatMap(esc => esc.docentes?.filter(d => d.estado === "Licencia").map(d => (
                          <tr key={`${esc.id}-${d.id}`}>
                            <td style={{maxWidth:180, fontSize:12}}>{esc.escuela}</td>
                            <td style={{fontFamily:'Rajdhani', fontWeight:700}}>{d.nombreApellido}</td>
                            <td style={{fontSize:12}}>{d.motivo}</td>
                            <td style={{fontSize:12}}>{formatDate(d.fechaInicioLicencia)}</td>
                            <td style={{fontSize:12}}>{formatDate(d.fechaFinLicencia)}</td>
                            <td><DaysRemaining fechaFin={d.fechaFinLicencia} /></td>
                            <td style={{fontSize:12}}>{d.suplentes?.length > 0 ? d.suplentes.map(s => s.nombreApellido).join(", ") : <span className="badge badge-danger">SIN SUPLENTE</span>}</td>
                          </tr>
                        ))) || []}
                      </tbody>
                    </table>
                    {!db.escuelas.some(esc => esc.docentes?.some(d => d.estado === "Licencia")) && <div className="no-data">No hay licencias activas</div>}
                  </div>
                </div>
              </div>
            )}
            
            {activeSection === "estadisticas" && (
              <div>
                <h1 style={{fontFamily:'Rajdhani', fontSize:28, fontWeight:700, color:'var(--accent)', letterSpacing:2, marginBottom:24}}>Estadísticas</h1>
                <Statistics escuelas={db.escuelas} />
              </div>
            )}
            
            {activeSection === "calendario" && <CalendarioView escuelas={db.escuelas} />}
            
            {activeSection === "exportar" && (
              <div>
                <h1 style={{fontFamily:'Rajdhani', fontSize:28, fontWeight:700, color:'var(--accent)', letterSpacing:2, marginBottom:24}}>Exportar</h1>
                <div className="card">
                  <div className="card-header"><span className="card-title">Exportar datos</span></div>
                  <p style={{color:'var(--text2)', marginBottom:16}}>Genera reportes en formato texto exportable con los datos del sistema.</p>
                  <button className="btn btn-primary" onClick={() => setShowExport(true)}>📄 Generar Reporte</button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* MODALS */}
      {escuelaModal && (
        <EscuelaModal isNew={escuelaModal.isNew} escuela={escuelaModal.data}
          onSave={saveEscuela} onClose={() => setEscuelaModal(null)} />
      )}
      {docenteModal && (
        <DocenteModal isNew={docenteModal.isNew} docente={docenteModal.data} titularId={docenteModal.titularId}
          onSave={(form) => docenteModal.isNew ? addDocente(docenteModal.escuelaId, form, docenteModal.titularId) : updateDocente(docenteModal.escuelaId, form, docenteModal.titularId)}
          onClose={() => setDocenteModal(null)} />
      )}
      {alumnoModal && (
        <AlumnoModal isNew={alumnoModal.isNew} alumno={alumnoModal.data}
          onSave={(form) => alumnoModal.isNew ? addAlumno(alumnoModal.escuelaId, form) : updateAlumno(alumnoModal.escuelaId, form)}
          onClose={() => setAlumnoModal(null)} />
      )}
      {showExport && <ExportPDF escuelas={db.escuelas} onClose={() => setShowExport(false)} />}
    </>
  );
}