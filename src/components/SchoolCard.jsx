// src/components/SchoolCard.jsx
import { useState } from "react";

function DaysRemaining({ fechaFin }) {
  if (!fechaFin) return null;
  const dias = Math.ceil((new Date(fechaFin) - new Date()) / (1000 * 60 * 60 * 24));
  const cls = dias <= 0 ? "days-danger" : dias <= 5 ? "days-danger" : dias <= 10 ? "days-warn" : "days-ok";
  const icon = dias <= 0 ? "🔴" : dias <= 5 ? "⚠️" : dias <= 10 ? "🟡" : "🟢";
  
  return (
    <span className={`days-remaining ${cls}`}>
      {icon} {dias <= 0 ? "VENCIDA" : `${dias} días`}
    </span>
  );
}

export default function SchoolCard({ escuela }) {
  const [expanded, setExpanded] = useState(false);
  const hasAlerts = !escuela.acdmMail || escuela.docentes?.length === 0;

  const openMaps = (e) => {
    e.stopPropagation();
    const q = encodeURIComponent(escuela.direccion);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };
  
  const openMail = (mailAddr, e) => {
    e.stopPropagation();
    window.open(`mailto:${mailAddr}`, "_blank");
  };

  return (
    <div className="school-card">
      <div className="school-card-header" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="school-de">{escuela.de}</div>
          <div className="school-name">{escuela.escuela}</div>
          <div className="school-meta">
            <span className="school-meta-item">📚 {escuela.nivel}</span>
            <span className="school-meta-item">⏱ {escuela.jornada}</span>
            <span className="school-meta-item">🕒 {escuela.turno}</span>
            <span className="school-meta-item clickable" onClick={openMaps}>
              📍 {escuela.direccion}
            </span>
          </div>
        </div>
        {hasAlerts && <span className="alert-icon">⚠️</span>}
      </div>
      
      {expanded && (
        <div className="school-card-body">
          <p>
            <span className="clickable" onClick={(e) => openMail(escuela.mail, e)}>
              📧 {escuela.mail}
            </span>
          </p>
          {escuela.acdmMail && (
            <p>
              <span className="clickable" onClick={(e) => openMail(escuela.acdmMail, e)}>
                📨 ACDM: {escuela.acdmMail}
              </span>
            </p>
          )}
          <p>📞 {escuela.telefonos?.join(" | ")}</p>
          
          <h4 className="mt-16">Docentes ({escuela.docentes?.length || 0})</h4>
          {escuela.docentes?.length === 0 ? (
            <p className="text-muted">Sin docentes asignados</p>
          ) : (
            escuela.docentes?.map(doc => (
              <div key={doc.id} className="docente-row">
                <span className="docente-name">{doc.nombreApellido}</span>
                <span className={`badge ${doc.estado === "Activo" ? "badge-active" : "badge-licencia"}`}>
                  {doc.estado}
                </span>
                {doc.estado === "Licencia" && <DaysRemaining fechaFin={doc.fechaFinLicencia} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}