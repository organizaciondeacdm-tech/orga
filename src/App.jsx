// Papiweb desarrollos informáticos - Versión Pro Cloud 2024
import { useState, useEffect, useMemo } from "react";
import { getEscuelas, saveEscuelas, initializeKV } from './services/kvStorage.client.js';
import { useTheme } from './context/ThemeContext.jsx'; 
import "./styles.css"; 

// Componentes
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import SchoolCard from './components/SchoolCard.jsx';
import AddSchoolModal from './components/AddSchoolModal.jsx';
import CalendarView from './components/CalendarView.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';

export default function App() {
  const { deviceType } = useTheme(); 
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Estados para modales
  const [escuelaModal, setEscuelaModal] = useState({ show: false, isNew: true, data: null });

  // 1. Carga inicial y lógica de Responsividad
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

  // Colapsar sidebar automáticamente en dispositivos pequeños
  useEffect(() => {
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [deviceType]);

  // 2. Filtro inteligente mejorado
  const filteredEscuelas = useMemo(() => {
    try {
      if (!search || search.trim() === '') return escuelas;
      const term = search.toLowerCase().trim();
      if (term.length < 2) return escuelas;

      return escuelas.filter(e => {
        if (!e) return false;
        const nombre = (e.escuela || '').toLowerCase();
        const distrito = (e.de?.toString() || '');
        const direccion = (e.direccion || '').toLowerCase();
        const nivel = (e.nivel || '').toLowerCase();
        return nombre.includes(term) || distrito.includes(term) || direccion.includes(term) || nivel.includes(term);
      });
    } catch (error) {
      console.error('Error en filtro:', error);
      return escuelas;
    }
  }, [escuelas, search]);

  // 3. Handlers de datos
  const handleEditSchool = (escuela) => setEscuelaModal({ show: true, isNew: false, data: escuela });

  const handleDeleteSchool = async (escuelaId) => {
    if (!window.confirm("¿Eliminar esta escuela?")) return;
    const nuevas = escuelas.filter(e => e.id !== escuelaId);
    setEscuelas(nuevas);
    await saveEscuelas(nuevas);
  };

  const handleUpdateEscuela = async (updated) => {
    setEscuelas(prev => {
      const nuevas = prev.map(e => e.id === updated.id ? updated : e);
      saveEscuelas(nuevas);
      return nuevas;
    });
  };

  const handleDocenteAdded = async (escuelaId, nuevoDocente) => {
    const updated = escuelas.map(esc => 
      esc.id === escuelaId ? { ...esc, docentes: [...(esc.docentes || []), nuevoDocente] } : esc
    );
    setEscuelas(updated);
    await saveEscuelas(updated);
  };

  const handleSaveSchool = async (schoolData) => {
    let updated;
    if (escuelaModal.isNew) {
      updated = [...escuelas, { ...schoolData, id: `e${Date.now()}`, docentes: [], visitas: [], proyectos: [], informes: [] }];
    } else {
      updated = escuelas.map(e => e.id === schoolData.id ? { ...e, ...schoolData } : e);
    }
    setEscuelas(updated);
    await saveEscuelas(updated);
    setEscuelaModal({ show: false, isNew: true, data: null });
  };

  const exportToCSV = () => {
    const headers = ['DE', 'Escuela', 'Nivel', 'Dirección'];
    const rows = escuelas.map(esc => [esc.de, esc.escuela, esc.nivel, esc.direccion]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_acdm_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const licenciasActivas = useMemo(() => {
    return escuelas.flatMap(e => e.docentes || []).filter(d => d.estado === "Licencia").length;
  }, [escuelas]);

  // Backdoor Admin
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.altKey && e.key === "a") setUser({ username: "admin_root", rol: "admin" });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (loading) return <div className="loader-container"><div className="loader"></div><p>Sync Cloud Pro...</p></div>;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className={`app-container ${sidebarCollapsed ? "sidebar-collapsed" : ""} device-${deviceType}`}>
      <header className="header">
        <div className="header-left">
          <button className="btn-icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button>
          <div className="brand">
            <span className="brand-name">PAPIWEB ACDM</span>
            <span className="brand-sub">CLOUD PRO</span>
          </div>
        </div>
        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input 
              className="search-input" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar institución..." 
            />
          </div>
        </div>
        <div className="header-right">
          <ThemeToggle />
          <button className="btn-export" onClick={exportToCSV}>📥</button>
          <button className="btn-add" onClick={() => setEscuelaModal({ show: true, isNew: true, data: null })}>➕</button>
          <button className="btn-logout" onClick={() => setUser(null)}>🔌</button>
        </div>
      </header>

      <div className="layout-body">
        <aside className="sidebar">
          <div className="nav-group">MENU</div>
          <button className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>📊 Dashboard</button>
          <button className={`nav-link ${view === 'escuelas' ? 'active' : ''}`} onClick={() => setView('escuelas')}>🏫 Escuelas</button>
          <button className={`nav-link ${view === 'calendario' ? 'active' : ''}`} onClick={() => setView('calendario')}>
            📅 Licencias {licenciasActivas > 0 && <span className="nav-badge">{licenciasActivas}</span>}
          </button>
        </aside>

        <main className="content-area">
          {view === "dashboard" && <Dashboard escuelas={escuelas} />}
          
          {view === "escuelas" && (
            <div className="fade-in">
              <h2 className="mb-16 title-rajdhani">
                INSTITUCIONES ({filteredEscuelas.length})
                {search && <span className="search-term"> · "{search}"</span>}
              </h2>
              
              {filteredEscuelas.length === 0 && search && (
                <div className="no-results card p-20 text-center">
                  <p>🔍 No hay coincidencias para "{search}"</p>
                  <button className="btn btn-secondary btn-sm mt-12" onClick={() => setSearch('')}>Limpiar</button>
                </div>
              )}
              
              <div className="school-grid">
                {filteredEscuelas.map(esc => (
                  <SchoolCard 
                    key={esc.id} 
                    escuela={esc} 
                    isAdmin={user?.rol === 'admin'}
                    onDocenteAdded={handleDocenteAdded}
                    onEdit={handleEditSchool}
                    onDelete={handleDeleteSchool}
                    onUpdate={handleUpdateEscuela}
                  />
                ))}
              </div>
            </div>
          )}

          {view === "calendario" && <CalendarView escuelas={escuelas} />}
        </main>
      </div>

      {escuelaModal.show && (
        <AddSchoolModal 
          onClose={() => setEscuelaModal({ show: false, isNew: true, data: null })} 
          onSave={handleSaveSchool} 
          initialData={escuelaModal.data}
          isNew={escuelaModal.isNew}
        />
      )}
    </div>
  );
}
