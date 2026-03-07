// src/components/Dashboard.jsx
function AlertPanel({ escuelas }) {
  const alerts = [];
  
  escuelas.forEach(esc => {
    if (!esc.acdmMail) {
      alerts.push({ type: "warning", icon: "📧", title: "Mail ACDM no registrado", desc: esc.escuela });
    }
    if (esc.docentes?.length === 0) {
      alerts.push({ type: "danger", icon: "🏫", title: "Sin ACDM asignado", desc: esc.escuela });
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="mt-24">
      <h3>Alertas Activas</h3>
      {alerts.map((a, i) => (
        <div key={i} className={`alert alert-${a.type}`}>
          <span className="alert-icon">{a.icon}</span>
          <div><strong>{a.title}</strong><br/>{a.desc}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ escuelas }) {
  const totalEsc = escuelas.length;
  const totalAlumnos = escuelas.reduce((a, e) => a + (e.alumnos?.length || 0), 0);
  const totalDocentes = escuelas.reduce((a, e) => a + (e.docentes?.length || 0), 0);
  const docentesLicencia = escuelas.reduce((a, e) => a + (e.docentes?.filter(d => d.estado === "Licencia").length || 0), 0);
  const docentesActivos = totalDocentes - docentesLicencia;
  const sinAcdm = escuelas.filter(e => !e.docentes?.length).length;
  const sinMailAcdm = escuelas.filter(e => !e.acdmMail).length;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalEsc}</div>
          <div className="stat-label">Escuelas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalAlumnos}</div>
          <div className="stat-label">Alumnos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{docentesActivos}</div>
          <div className="stat-label">ACDM Activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{docentesLicencia}</div>
          <div className="stat-label">En Licencia</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sinAcdm}</div>
          <div className="stat-label">Sin ACDM</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sinMailAcdm}</div>
          <div className="stat-label">Sin Mail ACDM</div>
        </div>
      </div>
      <AlertPanel escuelas={escuelas} />
    </div>
  );
}