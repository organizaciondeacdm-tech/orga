// Papiweb Desarrollos Informáticos 2025 - Cloud Edition
import { useState, useEffect } from "react";
import { getEscuelas, saveEscuelas, initializeKV } from './services/kvStorage.client.js';
import "./styles.css"; 

// ============================================================
// DATE UTILS (UNA SOLA VEZ)
// ============================================================
function diasRestantes(fechaFin) {
  if (!fechaFin) return null;
  const hoy = new Date();
  const fin = new Date(fechaFin);
  return Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
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
// MINI CALENDAR COMPONENT
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
    const s = new Date(rangeStart); 
    const e = new Date(rangeEnd);
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
      <div className="cal-grid">
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
    if (!esc.acdmMail) {
      alerts.push({ 
        type: "warning", 
        icon: "📧", 
        title: "Mail ACDM no registrado", 
        desc: `${esc.escuela} no tiene registrado el mail del ACDM.`
      });
    }
    
    if (esc.docentes?.length === 0) {
      alerts.push({ type: "danger", icon: "🏫", title: "Sin ACDM asignado", desc: `${esc.escuela} no tiene docente asignado.` });
    }
    
    esc.docentes?.forEach(doc => {
      if (doc.estado === "Licencia" && doc.fechaFinLicencia) {
        const dias = diasRestantes(doc.fechaFinLicencia);
        if (dias <= 0) {
          alerts.push({ type: "danger", icon: "⛔", title: "Licencia VENCIDA", desc: `${doc.nombreApellido} — ${esc.escuela}` });
        } else if (dias <= 5) {
          alerts.push({ type: "danger", icon: "🔴", title: `Licencia por vencer (${dias} días)`, desc: `${doc.nombreApellido} — ${esc.escuela}` });
        } else if (dias <= 10) {
          alerts.push({ type: "warning", icon: "⚠️", title: `Licencia próxima a vencer (${dias} días)`, desc: `${doc.nombreApellido} — ${esc.escuela}` });
        }
      }
    });
  });

  if (alerts.length === 0) {
    return <div className="alert alert-success">✅ Sin alertas activas</div>;
  }

  return (
    <div>
      {alerts.map((a, i) => (
        <div key={i} className={`alert alert-${a.type}`}>
          <span className="alert-icon">{a.icon}</span>
          <div><strong>{a.title}</strong><br/>{a.desc}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// STATISTICS COMPONENT
// ============================================================
function Statistics({ escuelas }) {
  const totalEsc = escuelas.length;
  const totalAlumnos = escuelas.reduce((a, e) => a + (e.alumnos?.length || 0), 0);
  const totalDocentes = escuelas.reduce((a, e) => a + (e.docentes?.length || 0), 0);
  const docentesLicencia = escuelas.reduce((a, e) => a + (e.docentes?.filter(d => d.estado === "Licencia").length || 0), 0);
  const docentesActivos = totalDocentes - docentesLicencia;
  const sinAcdm = escuelas.filter(e => !e.docentes?.length).length;
  const totalSuplentes = escuelas.reduce((a, e) => a + (e.docentes?.reduce((b, d) => b + (d.suplentes?.length || 0), 0) || 0), 0);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-value">{totalEsc}</div>
        <div className="stat-label">Escuelas</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{totalAlumnos}</div>
        <div className="stat-label">Alumnos</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{docentesActivos}</div>
        <div className="stat-label">ACDM Activos</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{docentesLicencia}</div>
        <div className="stat-label">En Licencia</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{totalSuplentes}</div>
        <div className="stat-label">Suplentes</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{sinAcdm}</div>
        <div className="stat-label">Sin ACDM</div>
      </div>
    </div>
  );
}

// ============================================================
// DOCENTE FORM MODAL
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

// ============================================================
// ALUMNO FORM MODAL
// ============================================================
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

// ============================================================
// ESCUELA FORM MODAL
// ============================================================
function EscuelaModal({ escuela, isNew, onSave, onClose }) {
  const [form, setForm] = useState(escuela || {
    id: `e${Date.now()}`, de: "", escuela: "", nivel: "Primario",
    direccion: "", lat: null, lng: null, telefonos: [""], mail: "",
    acdmMail: "", jornada: "Simple", turno: "SIMPLE MAÑANA", alumnos: [], docentes: []
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
        
        <div className="form-group">
          <label className="form-label">Mail del ACDM</label>
          <input type="email" className="form-input" value={form.acdmMail || ""} onChange={e => setForm({...form, acdmMail: e.target.value})} placeholder="acdm@escuela.edu.ar" />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Jornada</label>
            <select className="form-select" value={form.jornada} onChange={e => setForm({...form, jornada: e.target.value})}>
              <option>Simple</option>
              <option>Completa</option>
              <option>Extendida</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Turno</label>
            <select className="form-select" value={form.turno} onChange={e => setForm({...form, turno: e.target.value})}>
              <option>SIMPLE MAÑANA</option>
              <option>SIMPLE TARDE</option>
              <option>SIMPLE MAÑANA Y TARDE</option>
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
// ESCUELA CARD
// ============================================================
function EscuelaCard({ esc, onEdit, onAddDocente, onAddAlumno, isAdmin }) {
  const [expanded, setExpanded] = useState(false);
  const hasAlerts = !esc.acdmMail || esc.docentes?.length === 0 || esc.docentes?.some(d => d.estado === "Licencia" && diasRestantes(d.fechaFinLicencia) <= 10);

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
        <div>
          <div className="school-de">{esc.de}</div>
          <div className="school-name">{esc.escuela}</div>
          <div className="school-meta">
            <span className="school-meta-item">📚 {esc.nivel}</span>
            <span className="school-meta-item">⏱ {esc.jornada}</span>
            <span className="school-meta-item">🕒 {esc.turno}</span>
            <span className="school-meta-item clickable" onClick={openMaps}>📍 {esc.direccion}</span>
          </div>
        </div>
        {hasAlerts && <span className="alert-icon">⚠️</span>}
      </div>
      
      {expanded && (
        <div className="school-card-body">
          <div className="school-info-grid">
            <div>
              <div className="school-info-label">Mail</div>
              <div className="school-info-val link" onClick={(e) => openMail(esc.mail, e)}>✉️ {esc.mail}</div>
            </div>
            {esc.acdmMail && (
              <div>
                <div className="school-info-label">Mail ACDM</div>
                <div className="school-info-val link" onClick={(e) => openMail(esc.acdmMail, e)}>📨 {esc.acdmMail}</div>
              </div>
            )}
            <div>
              <div className="school-info-label">Teléfonos</div>
              <div className="school-info-val">{esc.telefonos?.join(" | ")}</div>
            </div>
          </div>
          
          <h4 className="mt-16">Docentes ({esc.docentes?.length || 0})</h4>
          {esc.docentes?.length === 0 ? (
            <div className="no-data">Sin docentes asignados</div>
          ) : (
            esc.docentes?.map(doc => (
              <div key={doc.id} className="docente-row">
                <div className="docente-header">
                  <span className={`badge badge-${doc.cargo?.toLowerCase()}`}>{doc.cargo}</span>
                  <span className="docente-name">{doc.nombreApellido}</span>
                  <span className={`badge badge-${doc.estado === "Activo" ? "active" : "licencia"}`}>{doc.estado}</span>
                  {doc.estado === "Licencia" && <DaysRemaining fechaFin={doc.fechaFinLicencia} />}
                </div>
              </div>
            ))
          )}
          
          {isAdmin && (
            <div className="flex gap-8 mt-16">
              <button className="btn btn-secondary btn-sm" onClick={() => onEdit(esc)}>✏️ Editar</button>
              <button className="btn btn-primary btn-sm" onClick={() => onAddDocente(esc.id)}>+ Docente</button>
              <button className="btn btn-primary btn-sm" onClick={() => onAddAlumno(esc.id)}>+ Alumno</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// LOGIN Papiweb VIDEO DE FONDO 
// ============================================================
function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === "admin" && pass === "admin2025") {
      onLogin({ username: "admin", rol: "admin" });
    } else {
      setErr("Credenciales incorrectas");
    }
  };

  return (
    <div className="login-container">
      <video autoPlay muted loop playsInline className="login-video">
        <source src="/papiweb.mp4" type="video/mp4" />
      </video>
      
      <div className="login-overlay">
        <div className="login-box">
          <div className="papiweb-logo" style={{ display: 'inline-block', marginBottom: 20 }}>
            <span className="papiweb-text">PAPIWEB</span>
          </div>
          <h2 className="login-title">Sistema ACDM</h2>
          <p className="login-sub">Gestión de Asistentes de Clase</p>

          <form onSubmit={handleSubmit}>
            <input 
              type="text" 
              placeholder="Usuario" 
              value={user} 
              onChange={e => setUser(e.target.value)} 
              autoFocus
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={pass} 
              onChange={e => setPass(e.target.value)} 
            />
            {err && <div className="alert alert-danger">⚠️ {err}</div>}
            <button type="submit" className="btn-login-cloud">
              INGRESAR
            </button>
          </form>
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
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  
  // Modals
  const [escuelaModal, setEscuelaModal] = useState(null);
  const [docenteModal, setDocenteModal] = useState(null);
  const [alumnoModal, setAlumnoModal] = useState(null);

  const isAdmin = currentUser?.rol === "admin";

  // Load data from cloud
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        await initializeKV();
        const data = await getEscuelas();
        setEscuelas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Save to cloud
  const handleUpdateData = async (nuevasEscuelas) => {
    setEscuelas(nuevasEscuelas);
    await saveEscuelas(nuevasEscuelas);
  };

  // DB Operations
  function updateEscuelas(updater) {
    const nuevasEscuelas = updater(escuelas);
    setEscuelas(nuevasEscuelas);
    saveEscuelas(nuevasEscuelas);
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

  function addDocente(escuelaId, docForm, titularId) {
    updateEscuelas(escuelas => escuelas.map(esc => {
      if (esc.id !== escuelaId) return esc;
      if (titularId) {
        return {
          ...esc,
          docentes: esc.docentes.map(d =>
            d.id === titularId ? { ...d, suplentes: [...(d.suplentes || []), docForm] } : d
          )
        };
      }
      return { ...esc, docentes: [...(esc.docentes || []), { ...docForm, suplentes: [] }] };
    }));
    setDocenteModal(null);
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

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e) {
      if (e.ctrlKey && e.altKey && e.key === "a") {
        setCurrentUser({ username: "admin", rol: "admin" });
      }
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        document.querySelector(".search-main")?.focus();
      }
      if (e.ctrlKey && e.key === "e" && isAdmin) {
        setShowExport(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAdmin]);

  const alertCount = escuelas.reduce((a, esc) => {
    if (!esc.docentes?.length) a++;
    if (!esc.acdmMail) a++;
    esc.docentes?.forEach(d => {
      if (d.estado === "Licencia" && d.fechaFinLicencia && diasRestantes(d.fechaFinLicencia) <= 10) a++;
    });
    return a;
  }, 0);

  const filteredEscuelas = escuelas.filter(e =>
    !search ||
    e.escuela?.toLowerCase().includes(search.toLowerCase()) ||
    e.de?.toLowerCase().includes(search.toLowerCase()) ||
    e.nivel?.toLowerCase().includes(search.toLowerCase())
  );

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  if (loading) {
    return <div className="loader">Cargando datos desde la nube...</div>;
  }

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard", badge: 0 },
    { id: "escuelas", icon: "🏫", label: "Escuelas", badge: alertCount },
    { id: "alertas", icon: "🔔", label: "Alertas", badge: alertCount },
    { id: "exportar", icon: "📄", label: "Exportar", badge: 0 },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="flex items-center gap-16">
          <h1 className="header-title">🏫 Sistema ACDM</h1>
          <span className="header-sub">Gestión de Asistentes de Clase</span>
        </div>
        <div className="flex items-center gap-16">
          <div className="search-input-wrap">
            <input
              className="form-input search-main"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar escuela..."
            />
          </div>
          <div className="flex items-center gap-8">
            <span>{currentUser.username}</span>
            <span className={`badge ${isAdmin ? "badge-titular" : "badge-active"}`}>
              {currentUser.rol}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentUser(null)}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="main">
        <nav className="sidebar">
          <div className="nav-section">Navegación</div>
          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </div>
          ))}

          {isAdmin && (
            <>
              <hr className="divider" />
              <div className="nav-section">Admin</div>
              <div
                className="nav-item"
                onClick={() => {
                  setEscuelaModal({ isNew: true, data: null });
                  setActiveSection("escuelas");
                }}
              >
                <span className="nav-icon">➕</span> Nueva Escuela
              </div>
            </>
          )}
        </nav>

        <main className="content">
          {activeSection === "dashboard" && (
            <>
              <h2>Dashboard</h2>
              <Statistics escuelas={escuelas} />
              <AlertPanel escuelas={escuelas} />
            </>
          )}

          {activeSection === "escuelas" && (
            <>
              <div className="flex justify-between mb-16">
                <h2>Escuelas ({filteredEscuelas.length})</h2>
                {isAdmin && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setEscuelaModal({ isNew: true, data: null })}
                  >
                    ➕ Nueva Escuela
                  </button>
                )}
              </div>

              {filteredEscuelas.length === 0 ? (
                <div className="no-data">No se encontraron escuelas</div>
              ) : (
                <div className="card-grid">
                  {filteredEscuelas.map(esc => (
                    <EscuelaCard
                      key={esc.id}
                      esc={esc}
                      isAdmin={isAdmin}
                      onEdit={(escuela) => setEscuelaModal({ isNew: false, data: escuela })}
                      onAddDocente={(escuelaId) => setDocenteModal({ isNew: true, escuelaId, data: null })}
                      onAddAlumno={(escuelaId) => setAlumnoModal({ isNew: true, escuelaId, data: null })}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === "alertas" && (
            <>
              <h2>Centro de Alertas</h2>
              <p>{alertCount} alerta(s) activa(s)</p>
              <AlertPanel escuelas={escuelas} />
            </>
          )}

          {activeSection === "exportar" && (
            <>
              <h2>Exportar Datos</h2>
              <div className="card">
                <p>Genera reportes en formato JSON</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const dataStr = JSON.stringify(escuelas, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'escuelas.json';
                    a.click();
                  }}
                >
                  📥 Exportar JSON
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      {escuelaModal && (
        <EscuelaModal
          isNew={escuelaModal.isNew}
          escuela={escuelaModal.data}
          onSave={saveEscuela}
          onClose={() => setEscuelaModal(null)}
        />
      )}
      {docenteModal && (
        <DocenteModal
          isNew={docenteModal.isNew}
          docente={docenteModal.data}
          titularId={docenteModal.titularId}
          onSave={(form) => addDocente(docenteModal.escuelaId, form, docenteModal.titularId)}
          onClose={() => setDocenteModal(null)}
        />
      )}
      {alumnoModal && (
        <AlumnoModal
          isNew={alumnoModal.isNew}
          alumno={alumnoModal.data}
          onSave={(form) => addAlumno(alumnoModal.escuelaId, form)}
          onClose={() => setAlumnoModal(null)}
        />
      )}
    </div>
  );
}