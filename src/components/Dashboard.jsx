// src/components/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import DaysRemaining from './DaysRemaining.jsx';

function AlertPanel({ alerts }) {
  if (alerts.length === 0) return null;

  return (
    <div className="mt-24 fade-in">
      <h3 className="mb-16">🚨 Alertas Activas ({alerts.length})</h3>
      <div className="alerts-list">
        {alerts.map((a, i) => (
          <div key={i} className={`alert alert-${a.type} mb-8 shadow-sm`}>
            <span className="alert-icon">{a.icon}</span>
            <div className="alert-content">
              <strong>{a.title}</strong>
              <div className="text-small">{a.desc}</div>
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

  // 1. Cálculos de Estadísticas, Alertas y Lista de Licencias en un solo paso
  const { stats, licenciasActivas } = useMemo(() => {
    const res = {
      stats: { totalAlumnos: 0, totalDocentes: 0, docentesLicencia: 0, sinAcdm: 0, sinMailAcdm: 0, alerts: [] },
      licenciasActivas: []
    };

    escuelas.forEach(esc => {
      const docentes = esc.docentes || [];
      res.stats.totalAlumnos += (esc.alumnos?.length || 0);
      res.stats.totalDocentes += docentes.length;

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
          
          // Guardar para el panel de licencias
          res.licenciasActivas.push({ ...doc, escuelaNombre: esc.escuela });

          // Lógica de alerta por vencimiento
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

  // 2. Sistema de Alarma Sonora
  useEffect(() => {
    const hayPeligro = stats.alerts.some(a => a.type === "danger");
    if (hayPeligro && !isMuted) {
      // Usamos un sonido de alerta corto y claro
      const audio = new Audio("https://assets.mixkit.co");
      audio.volume = 0.4;
      audio.play().catch(() => console.log("Audio bloqueado por el navegador"));
    }
  }, [stats.alerts.length, isMuted]);

  const docentesActivos = stats.totalDocentes - stats.docentesLicencia;

  return (
    <div className="dashboard p-16">
      <div className="flex justify-between items-center mb-16">
        <h2 className="title-rajdhani">PANEL ESTRATÉGICO</h2>
        <button 
          className={`btn-sm btn ${isMuted ? 'btn-secondary' : 'btn-danger anim-pulse'}`}
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? "🔇 Alarma Off" : "🔊 Alarma On"}
        </button>
      </div>

      {/* Grid de Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{escuelas.length}</div>
          <div className="stat-label">Escuelas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalAlumnos}</div>
          <div className="stat-label">Total Alumnos</div>
        </div>
        <div className={`stat-card ${docentesActivos > 0 ? 'text-success' : ''}`}>
          <div className="stat-value">{docentesActivos}</div>
          <div className="stat-label">ACDM Activos</div>
        </div>
        <div className="stat-card text-warn">
          <div className="stat-value">{stats.docentesLicencia}</div>
          <div className="stat-label">En Licencia</div>
        </div>
        <div className={`stat-card ${stats.sinAcdm > 0 ? 'highlight-danger' : ''}`}>
          <div className="stat-value">{stats.sinAcdm}</div>
          <div className="stat-label">Sin ACDM</div>
        </div>
      </div>

      {/* Panel de Licencias Activas (Solicitado) */}
      {licenciasActivas.length > 0 && (
        <div className="card mt-24 shadow-lg border-accent">
          <h3 className="mb-16">📅 Seguimiento de Licencias Activas</h3>
          <div className="licencias-dashboard-grid">
            {licenciasActivas.map((lic, i) => (
              <div key={i} className="licencia-item-card">
                <div className="licencia-info">
                  <strong>{lic.nombreApellido}</strong>
                  <span className="school-tag">{lic.escuelaNombre}</span>
                </div>
                <DaysRemaining fechaFin={lic.fechaFinLicencia} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel de Alertas */}
      <AlertPanel alerts={stats.alerts} />
    </div>
  );
}
