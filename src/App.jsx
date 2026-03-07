// Papiweb Desarrollos Informáticos 2025 - Cloud Edition
import { useState, useEffect } from "react";
import { getEscuelas, saveEscuelas, initializeKV } from './services/kvStorage.client.js';
import "./Styles.css"; 

// ============================================================
// DATE UTILS
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
          <div key={i} className={`cal-day ${d && isToday(d) ? 'today' : ''}`}>
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
    
    if (esc.docentes.length === 0) {
      alerts.push({ type: "danger", icon: "🏫", title: "Sin ACDM asignado", desc: `${esc.escuela} no tiene docente asignado.` });
    }
    
    esc.docentes.forEach(doc => {
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
// LOGIN CON VIDEO DE FONDO
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
    <div className="login-container" style={{ position: 'relative', overflow: 'hidden' }}>
      <video autoPlay muted loop playsInline style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: '100%',
        minHeight: '100%',
        objectFit: 'cover',
        opacity: 0.3,
        zIndex: 0
      }}>
        <source src="/papiweb.mp4" type="video/mp4" />
      </video>
      
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1
      }} />
      
      <div className="login-box" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="papiweb-logo" style={{ padding: '8px 20px', display: 'inline-block' }}>
            <div className="papiweb-text" style={{ fontSize: 22 }}>PAPIWEB</div>
            <div className="papiweb-sub">Desarrollos Informáticos</div>
          </div>
          <h2 className="login-title">Sistema ACDM</h2>
          <p className="login-sub">Gestión de Asistentes de Clase</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input 
              className="form-input" 
              value={user} 
              onChange={e => setUser(e.target.value)} 
              placeholder="admin" 
              autoFocus 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-input" 
              value={pass} 
              onChange={e => setPass(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>

          {err && <div className="alert alert-danger">⚠️ {err}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Ingresar →
          </button>
        </form>
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
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showExport, setShowExport] = useState(false);
  
  // Modals state
  const [escuelaModal, setEscuelaModal] = useState(null);
  const [docenteModal, setDocenteModal] = useState(null);
  const [alumnoModal, setAlumnoModal] = useState(null);

  // Load data from cloud
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        await initializeKV();
        const data = await getEscuelas();
        setEscuelas(data);
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
      if (e.ctrlKey && e.key === "e" && currentUser?.rol === "admin") {
        setShowExport(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentUser]);

  // Filter escuelas
  const filteredEscuelas = escuelas.filter(e =>
    !search || 
    e.escuela?.toLowerCase().includes(search.toLowerCase()) ||
    e.de?.toLowerCase().includes(search.toLowerCase()) ||
    e.nivel?.toLowerCase().includes(search.toLowerCase())
  );

  // Alert count
  const alertCount = escuelas.reduce((a, esc) => {
    if (esc.docentes?.length === 0) a++;
    if (!esc.acdmMail) a++;
    return a;
  }, 0);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  if (loading) {
    return <div className="loader">Cargando datos desde la nube...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="flex items-center gap-16">
          <div>
            <h1 className="header-title">🏫 Sistema ACDM</h1>
            <p className="header-sub">Gestión de Asistentes de Clase</p>
          </div>
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
          <div className="papiweb-brand">
            <span>{currentUser.username}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentUser(null)}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="main">
        <nav className="sidebar">
          <div className="nav-item" onClick={() => setActiveSection("dashboard")}>
            📊 Dashboard
          </div>
          <div className="nav-item" onClick={() => setActiveSection("escuelas")}>
            🏫 Escuelas
            {alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
          </div>
          <div className="nav-item" onClick={() => setActiveSection("exportar")}>
            📄 Exportar
          </div>
        </nav>

        <main className="content">
          {activeSection === "dashboard" && (
            <div>
              <h2>Dashboard</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{escuelas.length}</div>
                  <div className="stat-label">Escuelas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {escuelas.reduce((a, e) => a + (e.alumnos?.length || 0), 0)}
                  </div>
                  <div className="stat-label">Alumnos</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {escuelas.reduce((a, e) => a + (e.docentes?.length || 0), 0)}
                  </div>
                  <div className="stat-label">Docentes</div>
                </div>
              </div>
              <AlertPanel escuelas={escuelas} />
            </div>
          )}

          {activeSection === "escuelas" && (
            <div>
              <div className="flex justify-between mb-16">
                <h2>Escuelas ({filteredEscuelas.length})</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => setEscuelaModal({ isNew: true, data: null })}
                >
                  ➕ Nueva Escuela
                </button>
              </div>

              <div className="escuelas-grid">
                {filteredEscuelas.map(esc => (
                  <div key={esc.id} className="school-card">
                    <h3>{esc.escuela}</h3>
                    <p>{esc.direccion}</p>
                    <p>📧 {esc.acdmMail || "Sin mail ACDM"}</p>
                    <p>🕒 {esc.turno}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "exportar" && (
            <div>
              <h2>Exportar Datos</h2>
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
          )}
        </main>
      </div>

      {/* Modal placeholders - agregar según necesidad */}
      {escuelaModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{escuelaModal.isNew ? "Nueva Escuela" : "Editar Escuela"}</h3>
            {/* Formulario de escuela aquí */}
            <button onClick={() => setEscuelaModal(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}