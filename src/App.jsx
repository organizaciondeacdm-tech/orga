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

  // 2. Filtro inteligente con useMemo
  const filteredEscuelas = useMemo(() => {
    const term = search.toLowerCase();
    return escuelas.filter(e => 
      !search || 
      e.escuela?.toLowerCase().includes(term) ||
      e.de?.toString().includes(term) ||
      e.direccion?.toLowerCase().includes(term)
    );
  }, [escuelas, search]);

  // 3. Contador de licencias para el Sidebar
  const licenciasActivas = useMemo(() => {
    return escuelas.flatMap(e => e.docentes || [])
      .filter(d => d.estado === "Licencia").length;
  }, [escuelas]);

  // 4. Guardado de datos
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

  // ============================================================
  // FUNCIÓN PARA EXPORTAR A CSV
  // ============================================================
  const exportToCSV = () => {
    // Definir las columnas del CSV
    const headers = [
      'Distrito',
      'Escuela', 
      'Nivel',
      'Jornada',
      'Turno',
      'Dirección',
      'Mail',
      'Mail ACDM',
      'Teléfonos',
      'Cant. Docentes',
      'Cant. Alumnos',
      'Alertas'
    ];

    // Crear filas de datos
    const rows = escuelas.map(esc => {
      const alertas = [];
      if (!esc.acdmMail) alertas.push('Sin mail ACDM');
      if (!esc.docentes?.length) alertas.push('Sin docentes');
      
      return [
        esc.de || '',
        esc.escuela || '',
        esc.nivel || '',
        esc.jornada || '',
        esc.turno || '',
        esc.direccion || '',
        esc.mail || '',
        esc.acdmMail || '',
        (esc.telefonos || []).join('; '),
        esc.docentes?.length || 0,
        esc.alumnos?.length || 0,
        alertas.join(' / ')
      ];
    });

    // Combinar headers y rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
      ).join(','))
    ].join('\n');

    // Crear y descargar el archivo
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `escuelas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Mostrar mensaje de éxito
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  // Atajo de administrador (Backdoor)
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.altKey && e.key === "a") setUser({ username: "admin_papiweb" });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (loading) return (
    <div className="loader-container">
      <div className="loader"></div>
      <p className="mt-16">PAPIWEB Cloud Sync...</p>
    </div>
  );

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
              placeholder="Buscar escuela, distrito o dirección..." 
            />
          </div>
        </div>

        <div className="header-right">
          <span className="user-badge hide-mobile">{user.username}</span>
          
          {/* BOTÓN DE EXPORTAR A CSV */}
          <button className="btn-export" onClick={exportToCSV} title="Exportar a CSV">
            📥 <span className="hide-mobile">CSV</span>
          </button>
          
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
             ➕ <span className="hide-mobile">Nueva Escuela</span>
          </button>
          <button className="btn-logout" onClick={() => setUser(null)}>🔌</button>
        </div>

        {/* MENSAJE DE ÉXITO */}
        {showExportSuccess && (
          <div className="export-success">
            <span className="export-success-icon">✅</span>
            <span>Archivo CSV descargado correctamente</span>
          </div>
        )}
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
            
            {/* OPCIÓN DE EXPORTAR EN SIDEBAR */}
            <div className="nav-group">HERRAMIENTAS</div>
            <button className={`nav-link ${view === 'exportar' ? 'active' : ''}`} onClick={() => setView('exportar')}>
              <span className="nav-icon">📥</span> 
              <span className="nav-text">Exportar</span>
            </button>
          </nav>
        </aside>

        {/* CONTENIDO */}
        <main className="content-area">
          {view === "dashboard" && <div className="fade-in"><Dashboard escuelas={escuelas} /></div>}
          
          {view === "escuelas" && (
            <div className="fade-in">
              <div className="view-header">
                <h2>Instituciones ({filteredEscuelas.length})</h2>
              </div>
              <div className="school-grid">
                {filteredEscuelas.map(esc => <SchoolCard key={esc.id} escuela={esc} />)}
                {filteredEscuelas.length === 0 && <div className="no-results">No se encontraron escuelas</div>}
              </div>
            </div>
          )}

          {view === "calendario" && <div className="fade-in"><CalendarView escuelas={escuelas} /></div>}

          {/* VISTA DE EXPORTACIÓN */}
          {view === "exportar" && (
            <div className="export-view fade-in">
              <h2>Exportar Datos</h2>
              <div className="export-options">
                <div className="export-card" onClick={exportToCSV}>
                  <div className="export-icon">📊</div>
                  <h3>Exportar a CSV</h3>
                  <p>Descargar todas las escuelas en formato CSV compatible con Excel</p>
                  <button className="btn-export-card">DESCARGAR</button>
                </div>
                <div className="export-card" onClick={() => {
                  // Exportar solo docentes
                  const docentes = escuelas.flatMap(esc => 
                    (esc.docentes || []).map(d => ({
                      escuela: esc.escuela,
                      ...d
                    }))
                  );
                  
                  const docentesCSV = [
                    ['Escuela', 'Docente', 'Cargo', 'Estado', 'Motivo'].join(','),
                    ...docentes.map(d => 
                      `"${d.escuela}","${d.nombreApellido}","${d.cargo}","${d.estado}","${d.motivo || ''}"`
                    )
                  ].join('\n');
                  
                  const blob = new Blob(['\uFEFF' + docentesCSV], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `docentes_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();

                  setShowExportSuccess(true);
                  setTimeout(() => setShowExportSuccess(false), 3000);
                }}>
                  <div className="export-icon">👥</div>
                  <h3>Exportar Docentes</h3>
                  <p>Listado completo de docentes con sus estados y cargos</p>
                  <button className="btn-export-card">DESCARGAR</button>
                </div>
                <div className="export-card" onClick={() => {
                  // Exportar solo alumnos
                  const alumnos = escuelas.flatMap(esc => 
                    (esc.alumnos || []).map(a => ({
                      escuela: esc.escuela,
                      ...a
                    }))
                  );
                  
                  const alumnosCSV = [
                    ['Escuela', 'Alumno', 'Grado', 'Diagnóstico', 'Observaciones'].join(','),
                    ...alumnos.map(a => 
                      `"${a.escuela}","${a.nombre}","${a.gradoSalaAnio}","${a.diagnostico || ''}","${a.observaciones || ''}"`
                    )
                  ].join('\n');
                  
                  const blob = new Blob(['\uFEFF' + alumnosCSV], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `alumnos_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();

                  setShowExportSuccess(true);
                  setTimeout(() => setShowExportSuccess(false), 3000);
                }}>
                  <div className="export-icon">👨‍🎓</div>
                  <h3>Exportar Alumnos</h3>
                  <p>Listado completo de alumnos con diagnósticos y observaciones</p>
                  <button className="btn-export-card">DESCARGAR</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showAddModal && <AddSchoolModal onClose={() => setShowAddModal(false)} onSave={handleAddSchool} />}
    </div>
  );
}