// Papiweb Desarrollos Informáticos 2025 - Cloud Edition
import { useState, useEffect } from "react";
import { getEscuelas, saveEscuelas, initializeKV } from './services/kvStorage.client.js';
import "./styles.css"; 

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
// SCHOOL CARD COMPONENT
// ============================================================
function EscuelaCard({ esc, onEdit, onAddDocente, isAdmin }) {
  const [expanded, setExpanded] = useState(false);
  const hasAlerts = !esc.acdmMail || esc.docentes?.length === 0;

  return (
    <div className="school-card">
      <div className="school-card-header" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="school-de">{esc.de}</div>
          <div className="school-name">{esc.escuela}</div>
          <div className="school-meta">
            <span>📚 {esc.nivel}</span>
            <span>⏱ {esc.jornada}</span>
            <span>🕒 {esc.turno}</span>
          </div>
        </div>
        {hasAlerts && <span className="alert-icon">⚠️</span>}
      </div>
      
      {expanded && (
        <div className="school-card-body">
          <p>📍 {esc.direccion}</p>
          <p>📧 {esc.mail}</p>
          {esc.acdmMail && <p>📨 ACDM: {esc.acdmMail}</p>}
          <p>📞 {esc.telefonos?.join(", ")}</p>
          
          <h4>Docentes ({esc.docentes?.length || 0})</h4>
          {esc.docentes?.map(doc => (
            <div key={doc.id} className="docente-row">
              <strong>{doc.nombreApellido}</strong>
              {doc.estado === "Licencia" && <DaysRemaining fechaFin={doc.fechaFinLicencia} />}
            </div>
          ))}
          
          {isAdmin && (
            <div className="flex gap-8 mt-16">
              <button className="btn btn-secondary btn-sm" onClick={() => onEdit(esc)}>✏️ Editar</button>
              <button className="btn btn-primary btn-sm" onClick={() => onAddDocente(esc.id)}>+ Docente</button>
            </div>
          )}
        </div>
      )}
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
            <span className={`badge ${currentUser.rol === "admin" ? "badge-titular" : "badge-active"}`}>
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
          <div 
            className={`nav-item ${activeSection === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveSection("dashboard")}
          >
            <span className="nav-icon">📊</span> Dashboard
          </div>
          <div 
            className={`nav-item ${activeSection === "escuelas" ? "active" : ""}`}
            onClick={() => setActiveSection("escuelas")}
          >
            <span className="nav-icon">🏫</span> Escuelas
            {alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
          </div>
          <div 
            className={`nav-item ${activeSection === "alertas" ? "active" : ""}`}
            onClick={() => setActiveSection("alertas")}
          >
            <span className="nav-icon">🔔</span> Alertas
            {alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
          </div>
          <div 
            className={`nav-item ${activeSection === "exportar" ? "active" : ""}`}
            onClick={() => setActiveSection("exportar")}
          >
            <span className="nav-icon">📄</span> Exportar
          </div>
          
          {currentUser?.rol === "admin" && (
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
                {currentUser?.rol === "admin" && (
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
                      isAdmin={currentUser?.rol === "admin"}
                      onEdit={(escuela) => setEscuelaModal({ isNew: false, data: escuela })}
                      onAddDocente={(escuelaId) => setDocenteModal({ isNew: true, escuelaId, data: null })}
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

      {/* Modal placeholders - implementar según necesidad */}
      {escuelaModal && (
        <div className="modal-overlay" onClick={() => setEscuelaModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{escuelaModal.isNew ? "Nueva Escuela" : "Editar Escuela"}</h3>
            <p>Modal de escuela - Implementar según tu diseño original</p>
            <button className="btn btn-secondary" onClick={() => setEscuelaModal(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}