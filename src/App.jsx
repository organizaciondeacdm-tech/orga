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
      // Actualizar localmente primero para velocidad de UI
      const nuevasEscuelas = escuelas.filter(e => e.id !== escuelaId);
      setEscuelas(nuevasEscuelas);
      
      // Sincronizar con la nube (Backend maneja la persistencia del array completo)
      await saveEscuelas(nuevasEscuelas);
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la escuela de la nube');
    }
  };

  // 3. Lógica para AGREGAR/ACTUALIZAR DOCENTE
  const handleDocenteAdded = async (escuelaId, nuevoDocente) => {
    const updatedEscuelas = escuelas.map(esc => 
      esc.id === escuelaId 
        ? { ...esc, docentes: [...(esc.docentes || []), nuevoDocente] }
        : esc
    );
    setEscuelas(updatedEscuelas);
    await saveEscuelas(updatedEscuelas);
  };

  // 4. Guardar/Actualizar Escuela (Desde Modal)
  const handleSaveSchool = async (schoolData) => {
    let updated;
    if (escuelaModal.isNew) {
      updated = [...escuelas, { ...schoolData, id: `e${Date.now()}`, docentes: [], alumnos: [] }];
    } else {
      updated = escuelas.map(e => e.id === schoolData.id ? { ...e, ...schoolData } : e);
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

  // 6. Exportación a CSV
  const exportToCSV = () => {
    const headers = ['Distrito', 'Escuela', 'Nivel', 'Dirección', 'Mail ACDM'];
    const rows = escuelas.map(esc => [esc.de, esc.escuela, esc.nivel, esc.direccion, esc.acdmMail]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_acdm.csv`);
    link.click();
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  if (loading) return <div className="loader-container"><div className="loader"></div><p>Sync Cloud...</p></div>;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className={`app-container ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <header className="header">
        <div className="header-left">
          <button className="btn-icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button>
          <div className="brand">
            <span className="brand-name">PAPIWEB ACDM</span>
          </div>
        </div>
        
        <div className="header-center">
          <div className="search-bar">
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." />
          </div>
        </div>

        <div className="header-right">
          <button className="btn-export" onClick={exportToCSV}>📥</button>
          <button className="btn-add" onClick={() => setEscuelaModal({ show: true, isNew: true, data: null })}>➕</button>
          <button className="btn-logout" onClick={() => setUser(null)}>🔌</button>
        </div>
        {showExportSuccess && <div className="toast-success">CSV Generado ✅</div>}
      </header>

      <div className="layout-body">
        <aside className="sidebar">
          <button className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>📊 Dashboard</button>
          <button className={`nav-link ${view === 'escuelas' ? 'active' : ''}`} onClick={() => setView('escuelas')}>🏫 Escuelas</button>
          <button className={`nav-link ${view === 'calendario' ? 'active' : ''}`} onClick={() => setView('calendario')}>
            📅 Licencias {licenciasActivas > 0 && <span className="nav-badge">{licenciasActivas}</span>}
          </button>
        </aside>

        <main className="content-area">
          {view === "dashboard" && <Dashboard escuelas={escuelas} />}
          {view === "escuelas" && (
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
