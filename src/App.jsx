// Papiweb desarrollos informáticos - Versión Pro Cloud 2024
import { useState, useEffect, useMemo } from "react";
import { getEscuelas, saveEscuelas, initializeKV } from './services/kvStorage.client.js';
import "./styles.css"; 

// Componentes
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import SchoolCard from './components/SchoolCard.jsx';
import AddSchoolModal from './components/AddSchoolModal.jsx';
import CalendarView from './components/CalendarView.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // 1. Carga inicial sincronizada
  useEffect(() => {
    async function init() {
      try {
        await initializeKV();
        const data = await getEscuelas();
        setEscuelas(Array.isArray(data) ? data : []);
      } catch (err) { 
        console.error("Error en la nube:", err);
      } finally { 
        setLoading(false); 
      }
    }
    init();
  }, []);

  // 2. Lógica para AGREGAR DOCENTE y persistir en la nube
  const handleDocenteAdded = async (escuelaId, nuevoDocente) => {
    const updatedEscuelas = escuelas.map(esc => 
      esc.id === escuelaId 
        ? { ...esc, docentes: [...(esc.docentes || []), nuevoDocente] }
        : esc
    );
    
    setEscuelas(updatedEscuelas);
    // Sincronizar con Upstash KV
    await saveEscuelas(updatedEscuelas);
  };

  // 3. Filtro inteligente
  const filteredEscuelas = useMemo(() => {
    const term = search.toLowerCase();
    return escuelas.filter(e => 
      !search || 
      e.escuela?.toLowerCase().includes(term) ||
      e.de?.toString().includes(term) ||
      e.direccion?.toLowerCase().includes(term)
    );
  }, [escuelas, search]);

  // 4. Contador de licencias para el Sidebar
  const licenciasActivas = useMemo(() => {
    return escuelas.flatMap(e => e.docentes || [])
      .filter(d => d.estado === "Licencia").length;
  }, [escuelas]);

  // 5. Guardado de nueva escuela
  const handleAddSchool = async (newSchool) => {
    const updated = [...escuelas, { 
      ...newSchool, 
      id: `e${Date.now()}`,
      alumnos: [], 
      docentes: [] 
    }];
    setEscuelas(updated);
    await saveEscuelas(updated);
    setShowAddModal(false);
  };

  // 6. Función para EXPORTAR A CSV
  const exportToCSV = () => {
    const headers = ['Distrito', 'Escuela', 'Nivel', 'Jornada', 'Dirección', 'Mail ACDM', 'Cant. Docentes'];
    const rows = escuelas.map(esc => [
      esc.de || '',
      esc.escuela || '',
      esc.nivel || '',
      esc.jornada || '',
      esc.direccion || '',
      esc.acdmMail || '',
      esc.docentes?.length || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_acdm_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  // Atajo de administrador (Backdoor: Ctrl + Alt + A)
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.altKey && e.key === "a") setUser({ username: "admin_papiweb", rol: "admin" });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (loading) return <div className="loader-container"><div className="loader"></div><p>Sync Cloud...</p></div>;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className={`app-container ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <button className="btn-icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button>
          <div className="brand">
            <span className="brand-logo">PW</span>
            <div className="brand-text">
              <span className="brand-name">PAPIWEB</span>
              <span className="brand-sub">ACDM PRO</span>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input 
              className="search-input" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar escuela, distrito..." 
            />
          </div>
        </div>

        <div className="header-right">
          <button className="btn-export" onClick={exportToCSV} title="Descargar Reporte">📥</button>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>➕</button>
          <button className="btn-logout" onClick={() => setUser(null)}>🔌</button>
        </div>

        {showExportSuccess && <div className="toast-success">CSV Generado ✅</div>}
      </header>

      <div className="layout-body">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <div className="nav-group">PRINCIPAL</div>
            <button className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
              <span className="nav-icon">📊</span> <span className="nav-text">Dashboard</span>
            </button>
            <button className={`nav-link ${view === 'escuelas' ? 'active' : ''}`} onClick={() => setView('escuelas')}>
              <span className="nav-icon">🏫</span> <span className="nav-text">Escuelas</span>
            </button>
            <button className={`nav-link ${view === 'calendario' ? 'active' : ''}`} onClick={() => setView('calendario')}>
              <span className="nav-icon">📅</span> 
              <span className="nav-text">Licencias</span>
              {licenciasActivas > 0 && <span className="nav-badge">{licenciasActivas}</span>}
            </button>
          </nav>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="content-area">
          {view === "dashboard" && <div className="fade-in"><Dashboard escuelas={escuelas} /></div>}
          
          {view === "escuelas" && (
            <div className="fade-in">
              <h2 className="mb-16">Instituciones ({filteredEscuelas.length})</h2>
              <div className="school-grid">
                {filteredEscuelas.map(esc => (
                  <SchoolCard 
                    key={esc.id} 
                    escuela={esc} 
                    isAdmin={user?.rol === 'admin'}
                    onDocenteAdded={handleDocenteAdded}
                  />
                ))}
              </div>
            </div>
          )}

          {view === "calendario" && <div className="fade-in"><CalendarView escuelas={escuelas} /></div>}
        </main>
      </div>

      {showAddModal && <AddSchoolModal onClose={() => setShowAddModal(false)} onSave={handleAddSchool} />}
    </div>
  );
}
