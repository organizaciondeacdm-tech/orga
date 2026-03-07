// Papiweb desarrollos informáticos - Versión Pro Cloud
import { useState, useEffect } from "react";
import { getEscuelas, saveEscuelas, initializeKV } from './services/kvStorage.client.js';
import "./styles.css"; 
import UserPanel from './components/UserPanel.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import SchoolCard from './components/SchoolCard.jsx';
import AddSchoolModal from './components/AddSchoolModal.jsx';
import UserPanel from './components/UserPanel.jsx';
// todos los hooks DENTRO del componente
// =========================================
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