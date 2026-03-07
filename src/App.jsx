// Papiweb desarrollos informáticos - Versión Pro Cloud
import { useState, useEffect } from "react";
import { getEscuelas, saveEscuelas, initializeKV } from './services/kvStorage.client.js';
import "./styles.css"; 
import UserPanel from './components/UserPanel.jsx';

// ============================================================
// UTILS Y FUNCIONES AUXILIARES
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

function saveDB(data) {
  const json = JSON.stringify(data);
  localStorage.setItem("acdm_db", xorEncrypt(json, SECRET_KEY));
}

function loadDB() {
  const enc = localStorage.getItem("acdm_db");
  if (!enc) return null;
  const dec = xorDecrypt(enc, SECRET_KEY);
  if (!dec) return null;
  try { return JSON.parse(dec); } catch { return null; }
}

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
// En App.jsx, agregá en los estados:
const [view, setView] = useState("escuelas"); // o "dashboard"
// Agregá "usuarios" como opción

// En el sidebar, después de Escuelas:
<div className={`nav-item ${view === 'usuarios' ? 'active' : ''}`} onClick={() => setView('usuarios')}>
  <span className="nav-icon">👥</span> Usuarios
</div>

// En el contenido, después de escuelas:
{view === "usuarios" && <UserPanel />}
// ============================================================
// COMPONENTE: LOGIN CON VIDEO
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
// COMPONENTE: MINI CALENDARIO
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
          <div key={i} className={`cal-day ${d && isToday(d) ? 'today' : ''} ${d && isInRange(d) ? 'in-range' : ''}`}>
            {d || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: DÍAS RESTANTES BADGE
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
// COMPONENTE: ALERT PANEL
// ============================================================
function AlertPanel({ escuelas }) {
  const alerts = [];
  
  escuelas.forEach(esc => {
    if (!esc.acdmMail) {
      alerts.push({ type: "warning", icon: "📧", title: "Mail ACDM no registrado", desc: `${esc.escuela}` });
    }
    if (esc.docentes?.length === 0) {
      alerts.push({ type: "danger", icon: "🏫", title: "Sin ACDM asignado", desc: `${esc.escuela}` });
    }
    esc.docentes?.forEach(doc => {
      if (doc.estado === "Licencia" && doc.fechaFinLicencia) {
        const dias = diasRestantes(doc.fechaFinLicencia);
        if (dias <= 0) {
          alerts.push({ type: "danger", icon: "⛔", title: "Licencia VENCIDA", desc: `${doc.nombreApellido} - ${esc.escuela}` });
        } else if (dias <= 5) {
          alerts.push({ type: "danger", icon: "🔴", title: `Licencia por vencer (${dias} días)`, desc: `${doc.nombreApellido} - ${esc.escuela}` });
        } else if (dias <= 10) {
          alerts.push({ type: "warning", icon: "⚠️", title: `Licencia próxima a vencer (${dias} días)`, desc: `${doc.nombreApellido} - ${esc.escuela}` });
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
// COMPONENTE: DASHBOARD
// ============================================================
function Dashboard({ escuelas }) {
  const totalEsc = escuelas.length;
  const totalAlumnos = escuelas.reduce((a, e) => a + (e.alumnos?.length || 0), 0);
  const totalDocentes = escuelas.reduce((a, e) => a + (e.docentes?.length || 0), 0);
  const docentesLicencia = escuelas.reduce((a, e) => a + (e.docentes?.filter(d => d.estado === "Licencia").length || 0), 0);
  const docentesActivos = totalDocentes - docentesLicencia;
  const sinAcdm = escuelas.filter(e => !e.docentes?.length).length;
  const sinMailAcdm = escuelas.filter(e => !e.acdmMail).length;

  return (
    <div>
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
          <div className="stat-value">{sinAcdm}</div>
          <div className="stat-label">Sin ACDM</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sinMailAcdm}</div>
          <div className="stat-label">Sin Mail ACDM</div>
        </div>
      </div>
      <AlertPanel escuelas={escuelas} />
    </div>
  );
}

// ============================================================
// COMPONENTE: MODAL DE NUEVA ESCUELA
// ============================================================
function AddSchoolModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    de: "", escuela: "", nivel: "Primario", direccion: "", 
    mail: "", acdmMail: "", jornada: "Simple", turno: "SIMPLE MAÑANA", 
    lat: "", lng: "", telefonos: [""]
  });

  const handlePhoneChange = (index, value) => {
    const newPhones = [...formData.telefonos];
    newPhones[index] = value;
    setFormData({...formData, telefonos: newPhones});
  };

  const addPhone = () => {
    setFormData({...formData, telefonos: [...formData.telefonos, ""]});
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">➕ NUEVA ESCUELA</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Distrito Escolar (DE)</label>
            <input 
              className="form-input" 
              placeholder="Ej: DE 01" 
              onChange={e => setFormData({...formData, de: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nivel</label>
            <select 
              className="form-select" 
              onChange={e => setFormData({...formData, nivel: e.target.value})}
            >
              <option>Inicial</option>
              <option>Primario</option>
              <option>Secundario</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nombre de la Institución</label>
          <input 
            className="form-input" 
            placeholder="Nombre completo" 
            onChange={e => setFormData({...formData, escuela: e.target.value})} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Dirección</label>
          <input 
            className="form-input" 
            placeholder="Calle, número, localidad" 
            onChange={e => setFormData({...formData, direccion: e.target.value})} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mail Institucional</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="escuela@bue.edu.ar" 
            onChange={e => setFormData({...formData, mail: e.target.value})} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mail del ACDM</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="acdm@escuela.edu.ar" 
            onChange={e => setFormData({...formData, acdmMail: e.target.value})} 
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Jornada</label>
            <select 
              className="form-select" 
              onChange={e => setFormData({...formData, jornada: e.target.value})}
            >
              <option>Simple</option>
              <option>Completa</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Turno</label>
            <select 
              className="form-select" 
              onChange={e => setFormData({...formData, turno: e.target.value})}
            >
              <option>SIMPLE MAÑANA</option>
              <option>SIMPLE TARDE</option>
              <option>SIMPLE MAÑANA Y TARDE</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Teléfonos</label>
          {formData.telefonos.map((tel, i) => (
            <div key={i} className="flex gap-8 mb-8">
              <input 
                className="form-input" 
                value={tel} 
                placeholder="011-XXXX-XXXX"
                onChange={e => handlePhoneChange(i, e.target.value)} 
              />
              {formData.telefonos.length > 1 && (
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={() => {
                    const newPhones = formData.telefonos.filter((_, idx) => idx !== i);
                    setFormData({...formData, telefonos: newPhones});
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={addPhone}>
            + Agregar teléfono
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>CANCELAR</button>
          <button className="btn btn-primary" onClick={() => onSave(formData)}>GUARDAR</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: TARJETA DE ESCUELA
// ============================================================
function SchoolCard({ escuela }) {
  const [expanded, setExpanded] = useState(false);
  const hasAlerts = !escuela.acdmMail || escuela.docentes?.length === 0;

  const openMaps = (e) => {
    e.stopPropagation();
    const q = encodeURIComponent(escuela.direccion);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };
  
  const openMail = (mailAddr, e) => {
    e.stopPropagation();
    window.open(`mailto:${mailAddr}`, "_blank");
  };

  return (
    <div className="school-card">
      <div className="school-card-header" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="school-de">{escuela.de}</div>
          <div className="school-name">{escuela.escuela}</div>
          <div className="school-meta">
            <span className="school-meta-item">📚 {escuela.nivel}</span>
            <span className="school-meta-item">⏱ {escuela.jornada}</span>
            <span className="school-meta-item">🕒 {escuela.turno}</span>
            <span className="school-meta-item clickable" onClick={openMaps}>
              📍 {escuela.direccion}
            </span>
          </div>
        </div>
        {hasAlerts && <span className="alert-icon">⚠️</span>}
      </div>
      
      {expanded && (
        <div className="school-card-body">
          <p>
            <span className="clickable" onClick={(e) => openMail(escuela.mail, e)}>
              📧 {escuela.mail}
            </span>
          </p>
          {escuela.acdmMail && (
            <p>
              <span className="clickable" onClick={(e) => openMail(escuela.acdmMail, e)}>
                📨 ACDM: {escuela.acdmMail}
              </span>
            </p>
          )}
          <p>📞 {escuela.telefonos?.join(" | ")}</p>
          
          <h4 className="mt-16">Docentes ({escuela.docentes?.length || 0})</h4>
          {escuela.docentes?.length === 0 ? (
            <p className="text-muted">Sin docentes asignados</p>
          ) : (
            escuela.docentes?.map(doc => (
              <div key={doc.id} className="docente-row">
                <span className="docente-name">{doc.nombreApellido}</span>
                <span className={`badge ${doc.estado === "Activo" ? "badge-active" : "badge-licencia"}`}>
                  {doc.estado}
                </span>
                {doc.estado === "Licencia" && <DaysRemaining fechaFin={doc.fechaFinLicencia} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("escuelas"); // Cambiado a "escuelas" para ver las tarjetas
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    async function init() {
      try {
        await initializeKV();
        const data = await getEscuelas();
        setEscuelas(data || []);
      } catch (err) { 
        console.error("Error loading data:", err);
      } finally { 
        setLoading(false); 
      }
    }
    init();
  }, []);

  // Guardar nueva escuela
  const handleAddSchool = async (newSchool) => {
    const updated = [...escuelas, { 
      ...newSchool, 
      id: `e${Date.now()}`,
      alumnos: [], 
      docentes: [],
      lat: newSchool.lat ? parseFloat(newSchool.lat) : null,
      lng: newSchool.lng ? parseFloat(newSchool.lng) : null
    }];
    setEscuelas(updated);
    await saveEscuelas(updated);
    setShowAddModal(false);
  };

  // Filtrar escuelas por búsqueda
  const filteredEscuelas = escuelas.filter(e =>
    !search || 
    e.escuela?.toLowerCase().includes(search.toLowerCase()) ||
    e.de?.toLowerCase().includes(search.toLowerCase()) ||
    e.nivel?.toLowerCase().includes(search.toLowerCase())
  );

  // Atajo de teclado
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.altKey && e.key === "a") {
        setUser({ username: "admin", rol: "admin" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!user) return <Login onLogin={setUser} />;
  if (loading) return <div className="loader">Cargando datos desde la nube...</div>;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="flex items-center gap-16">
          <button className="btn-icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button>
          <div className="papiweb-brand">
            <div className="papiweb-logo">
              <span className="papiweb-text">PAPIWEB</span>
            </div>
            <h1 className="header-title">ACDM CLOUD</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-16">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input 
              className="form-input" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar escuela..." 
            />
          </div>
          <div className="flex items-center gap-8">
            <span className="badge badge-active">{user.username}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setUser(null)}>Salir</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              ➕ NUEVA
            </button>
          </div>
        </div>
      </header>

      <div className="main">
        {/* SIDEBAR */}
        <nav className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="nav-section">Navegación</div>
          <div className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </div>
          <div className={`nav-item ${view === 'escuelas' ? 'active' : ''}`} onClick={() => setView('escuelas')}>
            <span className="nav-icon">🏫</span> Escuelas
          </div>
        </nav>

        {/* CONTENT */}
        <main className="content">
          {view === "dashboard" && <Dashboard escuelas={escuelas} />}
          
          {view === "escuelas" && (
            <div>
              <h2 className="mb-16">Escuelas ({filteredEscuelas.length})</h2>
              {filteredEscuelas.length === 0 ? (
                <div className="no-data">No se encontraron escuelas</div>
              ) : (
                <div className="card-grid">
                  {filteredEscuelas.map(esc => <SchoolCard key={esc.id} escuela={esc} />)}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL DE NUEVA ESCUELA */}
      {showAddModal && <AddSchoolModal onClose={() => setShowAddModal(false)} onSave={handleAddSchool} />}
    </div>
  );
}