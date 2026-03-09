// src/components/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import DaysRemaining from './DaysRemaining.jsx';
import CalendarWidget from './CalendarWidget.jsx';

function AlertPanel({ alerts }) {
  if (alerts.length === 0) return null;

  return (
    <div className="mt-24 fade-in">
      <h3 className="title-rajdhani mb-16 text-danger">🚨 ALERTAS CRÍTICAS ({alerts.length})</h3>
      <div className="alerts-list">
        {alerts.map((a, i) => (
          <div key={i} className={`alert alert-${a.type} mb-8 shadow-sm flex items-center gap-12`}>
            <span className="alert-icon text-2xl">{a.icon}</span>
            <div className="alert-content">
              <strong className="block">{a.title}</strong>
              <div className="text-small opacity-80">{a.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ escuelas }) {
  const [isMuted, setIsMuted] = useState(true);
  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // 1. Procesamiento de Datos Único (Stats, Alertas, Licencias e Intervenciones)
  const { stats, licenciasActivas, totalIntervenciones } = useMemo(() => {
    const res = {
      stats: { totalAlumnos: 0, totalDocentes: 0, docentesLicencia: 0, sinAcdm: 0, sinMailAcdm: 0, alerts: [] },
      licenciasActivas: [],
      totalIntervenciones: 0
    };

    escuelas.forEach(esc => {
      const docentes = esc.docentes || [];
      res.stats.totalAlumnos += (esc.alumnos?.length || 0);
      res.stats.totalDocentes += docentes.length;
      
      // Contar Visitas + Informes para la métrica de gestión
      res.totalIntervenciones += (esc.visitas?.length || 0) + (esc.informes?.length || 0);

      if (!esc.acdmMail) {
        res.stats.sinMailAcdm++;
        res.stats.alerts.push({ type: "warning", icon: "📧", title: "Mail ACDM faltante", desc: esc.escuela });
      }

      if (docentes.length === 0) {
        res.stats.sinAcdm++;
        res.stats.alerts.push({ type: "danger", icon: "🏫", title: "Sin ACDM asignado", desc: esc.escuela });
      }

      docentes.forEach(doc => {
        if (doc.estado === "Licencia") {
          res.stats.docentesLicencia++;
          res.licenciasActivas.push({ ...doc, escuelaNombre: esc.escuela });

          if (doc.fechaFinLicencia) {
            const fechaFin = new Date(doc.fechaFinLicencia);
            fechaFin.setHours(0, 0, 0, 0);
            const dias = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
            
            if (dias <= 5) {
              res.stats.alerts.push({ 
                type: "danger", 
                icon: "⛔", 
                title: dias < 0 ? "Licencia Vencida" : "Próximo Vencimiento", 
                desc: `${doc.nombreApellido} — ${esc.escuela} (${dias < 0 ? 'Expiró' : dias + ' días'})` 
              });
            }
          }
        }
      });
    });
    return res;
  }, [escuelas, hoy]);

  // 2. Sistema de Alarma
  useEffect(() => {
    const hayPeligro = stats.alerts.some(a => a.type === "danger");
    if (hayPeligro && !isMuted) {
      const audio = new Audio("https://assets.mixkit.co");
      audio.volume = 0.3;
      audio.play().catch(() => console.log("Audio bloqueado"));
    }
  }, [stats.alerts.length, isMuted]);

  const docentesActivos = stats.totalDocentes - stats.docentesLicencia;

  return (
    <div className="dashboard-container p-16 fade-in">
      
      {/* HEADER DASHBOARD */}
      <div className="flex justify-between items-center mb-24">
        <div>
          <h2 className="title-rajdhani text-accent mb-0">PANEL ESTRATÉGICO ACDM</h2>
          <p className="text-muted small">Versión Pro Cloud — Estado del Sistema</p>
        </div>
        <button 
          className={`btn-sm btn ${isMuted ? 'btn-secondary' : 'btn-danger anim-pulse'}`}
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? "🔇 Alarma Silenciada" : "🔊 Monitoreo Activo"}
        </button>
      </div>

      {/* SECCIÓN 1: AGENDA CENTRALIZADA */}
      <div className="mb-24">
        <CalendarWidget escuelas={escuelas} />
      </div>

      {/* SECCIÓN 2: GRID DE ESTADÍSTICAS */}
      <div className="stats-grid mb-24">
        <div className="stat-card shadow-sm">
          <div className="stat-value">{escuelas.length}</div>
          <div className="stat-label">Escuelas</div>
        </div>
        <div className="stat-card shadow-sm">
          <div className="stat-value text-accent">{docentesActivos}</div>
          <div className="stat-label">ACDM Activos</div>
        </div>
        <div className={`stat-card shadow-sm ${stats.docentesLicencia > 0 ? 'border-warning' : ''}`}>
          <div className="stat-value text-warning">{stats.docentesLicencia}</div>
          <div className="stat-label">En Licencia</div>
        </div>
        <div className="stat-card shadow-sm">
          <div className="stat-value">{totalIntervenciones}</div>
          <div className="stat-label">Intervenciones</div>
        </div>
        <div className={`stat-card shadow-sm ${stats.sinAcdm > 0 ? 'highlight-danger' : ''}`}>
          <div className="stat-value text-danger">{stats.sinAcdm}</div>
          <div className="stat-label">Sin ACDM</div>
        </div>
      </div>

      {/* SECCIÓN 3: SEGUIMIENTO DE LICENCIAS Y ALERTAS */}
      <div className="grid grid-cols-1 lg-grid-cols-2 gap-24">
        
        {/* Columna Licencias */}
        <div className="card shadow-lg border-accent p-16">
          <h3 className="title-rajdhani mb-16">📅 CONTROL DE LICENCIAS</h3>
          {licenciasActivas.length > 0 ? (
            <div className="licencias-dashboard-list">
              {licenciasActivas.map((lic, i) => (
                <div key={i} className="licencia-item-card mb-8 p-12 bg-light rounded flex justify-between items-center">
                  <div className="licencia-info">
                    <strong className="block">{lic.nombreApellido}</strong>
                    <span className="school-tag text-muted small">{lic.escuelaNombre}</span>
                  </div>
                  <DaysRemaining fechaFin={lic.fechaFinLicencia} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center p-20">No hay licencias activas actualmente.</p>
          )}
        </div>

        {/* Columna Alertas */}
        <div>
          <AlertPanel alerts={stats.alerts} />
        </div>
      </div>
    </div>
  );
}
