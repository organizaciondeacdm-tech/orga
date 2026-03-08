// src/components/SchoolCard.jsx
import { useState } from "react";

// ... (Componente DaysRemaining se mantiene igual que antes)

export default function SchoolCard({ escuela }) {
  const [expanded, setExpanded] = useState(false);
  const hasAlerts = !escuela.acdmMail || !escuela.docentes || escuela.docentes.length === 0;

  const openMaps = (e) => {
    e.stopPropagation();
    const query = encodeURIComponent(`${escuela.escuela}, ${escuela.direccion}`);
    window.open(`https://www.google.com{query}`, "_blank", "noopener,noreferrer");
  };

  const handleMail = (mail, e) => {
    e.stopPropagation();
    window.location.href = `mailto:${mail}`;
  };

  return (
    <div className="school-card">
      <div className="school-card-header" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="school-de">DE {escuela.de}</div>
          <div className="school-name">{escuela.escuela}</div>
          <div className="school-meta">
            <span className="school-meta-item">📚 {escuela.nivel}</span>
            <span className="school-meta-item clickable" onClick={openMaps}>
              📍 {escuela.direccion}
            </span>
          </div>
        </div>
        {hasAlerts && <span className="alert-icon">⚠️</span>}
      </div>
      
      {expanded && (
        <div className="school-card-body">
          {/* SECCIÓN DE CONTACTO ACTUALIZADA */}
          <div className="contact-section">
            <p>
              <span className="clickable" onClick={(e) => handleMail(escuela.mail, e)}>
                📧 {escuela.mail || "Sin mail institucional"}
              </span>
            </p>
            
            {/* Bloque solicitado para ACDM */}
            {escuela.acdmMail && (
              <p>
                <span 
                  className="clickable" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`mailto:${escuela.acdmMail}`, '_blank');
                  }}
                >
                  📨 ACDM: {escuela.acdmMail}
                </span>
              </p>
            )}

            <p>📞 {escuela.telefonos?.join(" | ") || "Sin teléfono"}</p>
          </div>

          <h4 className="mt-16">Docentes ({escuela.docentes?.length || 0})</h4>
          {escuela.docentes?.length > 0 ? (
            escuela.docentes.map(doc => (
              <div key={doc.id} className="docente-row">
                <span className="docente-name">{doc.nombreApellido}</span>
                <span className={`badge ${doc.estado === "Activo" ? "badge-active" : "badge-licencia"}`}>
                  {doc.estado}
                </span>
                {doc.estado === "Licencia" && <DaysRemaining fechaFin={doc.fechaFinLicencia} />}
              </div>
            ))
          ) : (
            <p className="text-muted">Sin docentes asignados</p>
          )}
        </div>
      )}
    </div>
  );
}
