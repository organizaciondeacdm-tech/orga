// src/components/Dashboard.jsx
import { useEffect, useState } from "react";

function AlertPanel({ alerts }) {
  if (alerts.length === 0) return null;

  return (
    <div className="mt-24 fade-in">
      <h3 className="mb-16">🚨 Alertas Activas ({alerts.length})</h3>
      <div className="alerts-list">
        {alerts.map((a, i) => (
          <div key={i} className={`alert alert-${a.type} mb-8 shadow-sm`}>
            <span className="alert-icon">{a.icon}</span>
            <div>
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
  const [isMuted, setIsMuted] = useState(true); // Por defecto silenciado (regla del navegador)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // 1. Lógica de Cálculos y Alertas
  const stats = escuelas.reduce((acc, esc) => {
    const docentes = esc.docentes || [];
    acc.totalAlumnos += (esc.alumnos?.length || 0);
    acc.totalDocentes += docentes.length;

    if (!esc.acdmMail) {
      acc.sinMailAcdm++;
      acc.alerts.push({ type: "warning", icon: "📧", title: "Mail ACDM faltante", desc: esc.escuela });
    }

    if (docentes.length === 0) {
      acc.sinAcdm++;
      acc.alerts.push({ type: "danger", icon: "🏫", title: "Sin ACDM asignado", desc: esc.escuela });
    }

    docentes.forEach(doc => {
      if (doc.estado === "Licencia") {
        acc.docentesLicencia++;
        if (doc.fechaFinLicencia) {
          const fechaFin = new Date(doc.fechaFinLicencia);
          fechaFin.setHours(0, 0, 0, 0);
          const dias = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
          if (dias <= 5) {
            acc.alerts.push({ 
              type: "danger", 
              icon: "⛔", 
              title: dias < 0 ? "Licencia Vencida" : "Próximo Vencimiento", 
              desc: `${doc.nombreApellido} — ${esc.escuela}` 
            });
          }
        }
      }
    });
    return acc;
  }, { totalAlumnos: 0, totalDocentes: 0, docentesLicencia: 0, sinAcdm: 0, sinMailAcdm: 0, alerts: [] });

  // 2. Sistema de Alarma Sonora
  useEffect(() => {
    const hayPeligro = stats.alerts.some(a => a.type === "danger");
    
    if (hayPeligro && !isMuted) {
      const audio = new Audio("https://assets.mixkit.co");
      audio.volume = 0.4;
      audio.play().catch(() => console.log("Interactuá con la web para activar audio"));
    }
  }, [stats.alerts.length, isMuted]); // Suena cuando cambia el nro de alertas o activas sonido

  const docentesActivos = stats.totalDocentes - stats.docentesLicencia;

  return (
    <div className="dashboard p-16">
      <div className="flex justify-between items-center mb-16">
        <h2>Panel de Control</h2>
        <button 
          className={`btn-sm btn ${isMuted ? 'btn-secondary' : 'btn-danger anim-pulse'}`}
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? "🔇 Alarma Silenciada" : "🔊 Alarma Activa"}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{escuelas.length}</div>
          <div className="stat-label">Escuelas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalAlumnos}</div>
          <div className="stat-label">Alumnos</div>
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

      <AlertPanel alerts={stats.alerts} />
    </div>
  );
}
