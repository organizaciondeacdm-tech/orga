// Papiweb desarrollos informáticos - Versión Pro Cloud con Soporte de Calendario
import { useState, useEffect } from "react";
import { getEscuelas, saveEscuelas, initializeKV } from './services/kvStorage.client.js';
import "./styles.css"; 

// Componentes
import UserPanel from './components/UserPanel.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import SchoolCard from './components/SchoolCard.jsx';
import AddSchoolModal from './components/AddSchoolModal.jsx';
import CalendarView from './components/CalendarView.jsx'; // Importamos el nuevo componente

export default function App() {
  const [user, setUser] = useState(null);
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // Por defecto al Dashboard
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  // 1. Cargar datos iniciales desde Upstash/KV
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

  // 2. Lógica de Guardado con ID único
  const handleAddSchool = async (newSchool) => {
    const updated = [...escuelas, { 
      ...newSchool, 
      id: `e${Date.now()}`,
      alumnos: newSchool.alumnos || [], 
      docentes: newSchool.docentes || [],
    }];
    setEscuelas(updated);
    await saveEscuelas(updated);
    setShowAddModal(false);
  };

  // 3. Filtro inteligente (Búsqueda por Nombre, DE o Nivel)
  const filteredEscuelas = escuelas.filter(e => {
    const term = search.toLowerCase();
    return !search || 
      e.escuela?.toLowerCase().includes(term) ||
      e.de?.toString().includes(term) ||
      e.nivel?.toLowerCase().includes(term) ||
      e.direccion?.toLowerCase().includes(term);
  });

  // 4. Atajo "Backdoor" para desarrollo/admin
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.altKey && e.key === "a") {
        setUser({ username: "admin_papiweb", rol: "admin" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Estados de carga y autenticación
  if (loading) return <div className="loader-container"><div className="loader"></div><p>Sincronizando con la nube...</p></div>;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className={`app-container ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      {/* HEADER SUPERIOR */}
      <header className="header">
        <div className="header-left">
          <button className="btn-icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button>
          <div className="brand">
            <span className="brand-logo">PW</span>
            <div className="brand-text">
              <span className="brand-name">PAPIWEB</span>
              <span className="brand-sub">ACDM CLOUD PRO</span>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text"
              className="search-input" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar por escuela, distrito o dirección..." 
            />
          </div>
        </div>

        <div className="header-right">
          <div className="user-profile">
            <span className="user-name">{user.username}</span>
            <button className="btn-logout" onClick={() => setUser(null)} title="Cerrar sesión">🔌</button>
          </div>
          <button className="btn-add-main" onClick={() => setShowAddModal(true)}>
            <span>+</span> <span className="hide-mobile">Nueva Escuela</span>
          </button>
        </div>
      </header>

      <div className="layout-body">
        {/* SIDEBAR DE NAVEGACIÓN */}
        <aside className="sidebar">
          <div className="sidebar-content">
            <div className="nav-group">Menú Principal</div>
            
            <button className={`nav-link ${view === 'dashboard' ? 'is-active' : ''}`} onClick={() => setView('dashboard')}>
              <span className="nav-icon">📊</span> <span className="nav-text">Dashboard</span>
            </button>
            
            <button className={`nav-link ${view === 'escuelas' ? 'is-active' : ''}`} onClick={() => setView('escuelas')}>
              <span className="nav-icon">🏫</span> <span className="nav-text">Escuelas</span>
            </button>
            
            <button className={`nav-link ${view === 'calendario' ? 'is-active' : ''}`} onClick={() => setView('calendario')}>
              <span className="nav-icon">📅</span> <span className="nav-text">Calendario Licencias</span>
            </button>
            
            <div className="sidebar-footer">
              <p>© 2024 Papiweb v2.1</p>
            </div>
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO DINÁMICO */}
        <main className="content-area">
          {view === "dashboard" && (
            <div className="fade-in">
              <Dashboard escuelas={escuelas} />
            </div>
          )}
          
          {view === "escuelas" && (
            <div className="fade-in">
              <div className="view-header">
                <h2>Listado de Instituciones</h2>
                <span className="count-badge">{filteredEscuelas.length} resultados</span>
              </div>
              
              {filteredEscuelas.length === 0 ? (
                <div className="empty-state">
                  <p>🔍 No hay coincidencias con tu búsqueda.</p>
                </div>
              ) : (
                <div className="school-grid">
                  {filteredEscuelas.map(esc => (
                    <SchoolCard key={esc.id} escuela={esc} />
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "calendario" && (
            <div className="fade-in">
              <CalendarView escuelas={escuelas} />
            </div>
          )}
        </main>
      </div>

      {/* MODALES */}
      {showAddModal && (
        <AddSchoolModal 
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddSchool} 
        />
      )}
    </div>
  );
}
