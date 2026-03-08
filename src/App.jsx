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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Estados para modales
  const [escuelaModal, setEscuelaModal] = useState({ show: false, isNew: true, data: null });

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

  // 2. Lógica para EDITAR Y ELIMINAR ESCUELAS
  const handleEditSchool = (escuela) => {
    setEscuelaModal({ 
      show: true,
      isNew: false, 
      data: escuela 
    });
  };

  const handleDeleteSchool = async (escuelaId) => {
    try {
      const nuevasEscuelas = escuelas.filter(e => e.id !== escuelaId);
      setEscuelas(nuevasEscuelas);
      await saveEscuelas(nuevasEscuelas);
    } catch (error) {
      alert('Error al eliminar la escuela de la nube');
    }
  };

  // 3. Lógica para AGREGAR DOCENTE
  const handleDocenteAdded = async (escuelaId, nuevoDocente) => {
    const updatedEscuelas = escuelas.map(esc => 
      esc.id === escuelaId 
        ? { ...esc, docentes: [...(esc.docentes || []), nuevoDocente] }
        : esc
    );
    setEscuelas(updatedEscuelas);
    await saveEscuelas(updatedEscuelas);
  };

  // 4. Guardar/Actualizar Escuela (Conserva docentes existentes al editar)
  const handleSaveSchool = async (schoolData) => {
    let updated;
    if (escuelaModal.isNew) {
      updated = [...escuelas, { ...schoolData, id: `e${Date.now()}`, docentes: [], alumnos: [] }];
    } else {
      updated = escuelas.map(e => 
        e.id === schoolData.id 
          ? { ...e, ...schoolData } // Mantiene e.docentes y e.alumnos originales si no vienen en schoolData
          : e
      );
    }
    
    setEscuelas(updated);
    await saveEscuelas(updated);
    setEscuelaModal({ show: false, isNew: true, data: null });
  };

  // 5. Filtro inteligente y Contadores
  const filteredEscuelas = useMemo(() => {
    const term = search.toLowerCase();
    return escuelas.filter(e => 
      !search || 
      e.escuela?.toLowerCase().includes(term) ||
      e.de?.toString().includes(term) ||
      e.direccion?.toLowerCase().includes(term)
    );
  }, [escuelas, search]);

  const licenciasActivas = useMemo(() => {
    return escuelas.flatMap(e => e.docentes || [])
      .filter(d => d.estado === "Licencia").length;
  }, [escuelas]);

  // 6. Exportación a CSV con BOM para Excel
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

  // Atajo de administrador (Backdoor)
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
                  />
                ))}
              </div>
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
