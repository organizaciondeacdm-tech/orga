// src/components/SchoolCard.jsx
import { useState } from "react";
import DaysRemaining from './DaysRemaining.jsx';
// Papiweb DaysRemaining está importado o definido arriba
// import DaysRemaining from "./DaysRemaining"; 

export default function SchoolCard({ escuela }) {
  const [expanded, setExpanded] = useState(false);
  
  // Alerta si falta el mail de ACDM o no hay docentes
  const hasAlerts = !escuela.acdmMail || !escuela.docentes || escuela.docentes.length === 0;

  // Función única para Mapas (Corregida)
  const openMaps = (e) => {
    e.stopPropagation();
    // Combinamos nombre y dirección para que Google Maps sea exacto
    const query = encodeURIComponent(`${escuela.escuela}, ${escuela.direccion}, CABA`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  const handleMail = (mail, e) => {
    e.stopPropagation();
    if (!mail) return;
    window.location.href = `mailto:${mail}`;
  };

  return (
    <div className={`school-card ${expanded ? 'is-expanded' : ''}`}>
      <div className="school-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="header-info">
          <div className="school-de">DE {escuela.de}</div>
          <div className="school-name">{escuela.escuela}</div>
          <div className="school-meta">
            <span className="school-meta-item">📚 {escuela.nivel}</span>
            {escuela.direccion && (
              <span className="school-meta-item clickable" onClick={openMaps} title="Ver en Google Maps">
                📍 {escuela.direccion}
              </span>
            )}
          </div>
        </div>
        {hasAlerts && <span className="alert-icon" title="Requiere atención">⚠️</span>}
      </div>
      
      {expanded && (
        <div className="school-card-body fade-in">
          <div className="contact-section">
            <p className="contact-row">
              <span className="clickable" onClick={(e) => handleMail(escuela.mail, e)}>
                📧 {escuela.mail || "Sin mail institucional"}
              </span>
            </p>
            
            {escuela.acdmMail && (
              <p className="contact-row">
                <span 
                  className="clickable" 
                  onClick={(e) => handleMail(escuela.acdmMail, e)}
                >
                  📨 ACDM: {escuela.acdmMail}
                </span>
              </p>
            )}

            <p className="contact-row">
              📞 {escuela.telefonos?.length > 0 ? escuela.telefonos.join(" | ") : "Sin teléfono"}
            </p>
          </div>

          <div className="docentes-section">
            <h4 className="mt-16">Docentes ({escuela.docentes?.length || 0})</h4>
            {escuela.docentes?.length > 0 ? (
              <div className="docente-list">
                {escuela.docentes.map(doc => (
                  <div key={doc.id} className="docente-row">
                    <div className="docente-info">
                      <span className="docente-name">{doc.nombreApellido}</span>
                      <span className={`badge ${doc.estado === "Activo" ? "badge-active" : "badge-licencia"}`}>
                        {doc.estado}
                      </span>
                    </div>
                    {doc.estado === "Licencia" && (
                      <DaysRemaining fechaFin={doc.fechaFinLicencia} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted italic">Sin docentes asignados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
