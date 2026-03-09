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

  // Monitoreo de búsqueda y estado
  useEffect(() => {
    console.log('🔍 Término de búsqueda:', search);
    console.log('📊 Total escuelas:', escuelas.length);
  }, [search, escuelas]);

  // Colapsar sidebar automáticamente en dispositivos pequeños
  useEffect(() => {
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [deviceType]);

  // 2. Lógica para EDITAR Y ELIMINAR ESCUELAS
  const handleEditSchool = (escuela) => {
    setEscuelaModal({ show: true, isNew: false, data: escuela });
  };

  const handleDeleteSchool = async (escuelaId) => {
    try {
      const nuevasEscuelas = escuelas.filter(e => e.id !== escuelaId);
      setEscuelas(nuevasEscuelas);
      await saveEscuelas(nuevasEscuelas);
    } catch (error) {
      alert('Error al eliminar la escuela');
    }
  };

  // 3. Lógica para ACTUALIZACIÓN GENERAL (Seguimiento, Visitas, etc.)
  const handleUpdateEscuela = async (escuelaActualizada) => {
    try {
      setEscuelas(prevEscuelas => {
        const nuevas = prevEscuelas.map(e => 
          e.id === escuelaActualizada.id ? escuelaActualizada : e
        );
        saveEscuelas(nuevas); 
        return nuevas;
      });
      console.log('✅ Cambio guardado:', escuelaActualizada.escuela);
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  // 4. Lógica para AGREGAR DOCENTE
  const handleDocenteAdded = async (escuelaId, nuevoDocente) => {
    const updatedEscuelas = escuelas.map(esc => 
      esc.id === escuelaId 
        ? { ...esc, docentes: [...(esc.docentes || []), nuevoDocente] }
        : esc
    );
    setEscuelas(updatedEscuelas);
    await saveEscuelas(updatedEscuelas);
  };

  // 5. Guardar/Actualizar Escuela desde Modal
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

  // 6. Filtros y Contadores (Memoizados para performance)
  const filteredEscuelas = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return escuelas;
    return escuelas.filter(e => 
      e.escuela?.toLowerCase().includes(term) ||
      e.de?.toString().includes(term) ||
      e.direccion?.toLowerCase().includes(term)
    );
  }, [escuelas, search]);

  const licenciasActivas = useMemo(() => {
    return escuelas.flatMap(e => e.docentes || []).filter(d => d.estado === "Licencia").length;
  }, [escuelas]);

  // 7. Exportación a CSV
  const exportToCSV = () => {
    const headers = ['Distrito', 'Escuela', 'Nivel', 'Dirección', 'Mail ACDM'];
    const rows = escuelas.map(esc => [esc.de, esc.escuela, esc.nivel, esc.direccion, esc.acdmMail]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_acdm_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  // Atajo administrador (Ctrl+Alt+A)
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
              placeholder="Buscar escuela, distrito..." 
            />
          </div>
        </div>

        <div className="header-right">
          <ThemeToggle />
          <button className="btn-export" onClick={exportToCSV} title="Exportar CSV">📥</button>
          <button className="btn-add" onClick={() => setEscuelaModal({ show: true, isNew: true, data: null })} title="Nueva Escuela">➕</button>
          <button className="btn-logout" onClick={() => setUser(null)} title="Salir">🔌</button>
        </div>
        {showExportSuccess && <div className="toast-success">Archivo generado con éxito ✅</div>}
      </header>

      <div className="layout-body">
        <aside className="sidebar">
          <div className="nav-group">MENU</div>
          <button className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>📊 Dashboard</button>
          <button className={`nav-link ${view === 'escuelas' ? 'active' : ''}`} onClick={() => setView('escuelas')}>🏫 Escuelas</button>
          <button className={`nav-link ${view === 'calendario' ? 'active' : ''}`} onClick={() => setView('calendario')}>
            📅 Licencias {licenciasActivas > 0 && <span className="nav-badge">{licenciasActivas}</span>}
          </button>
          <div className="sidebar-footer">v2.4 Pro</div>
        </aside>

        <main className="content-area">
          {view === "dashboard" && <div className="fade-in"><Dashboard escuelas={escuelas} /></div>}
          
          {view === "escuelas" && (
            <div className="fade-in">
              <h2 className="mb-16 title-rajdhani">INSTITUCIONES ({filteredEscuelas.length})</h2>
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
              {filteredEscuelas.length === 0 && (
                <div className="text-center p-40 opacity-50">
                  <p>No se encontraron escuelas que coincidan con "{search}"</p>
                </div>
              )}
            </div>
          )}

          {view === "calendario" && <div className="fade-in"><CalendarView escuelas={escuelas} /></div>}
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
