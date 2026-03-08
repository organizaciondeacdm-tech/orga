// src/components/SchoolCard.jsx
import { useState } from "react";
import DaysRemaining from './DaysRemaining.jsx';
import AddDocenteModal from './AddDocenteModal.jsx'; 

export default function SchoolCard({ escuela, isAdmin, onDocenteAdded, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddDocente, setShowAddDocente] = useState(false);

  const hasAlerts = !escuela.acdmMail || !escuela.docentes || escuela.docentes.length === 0;

  const openMaps = (e) => {
    e.stopPropagation();
    const query = encodeURIComponent(`${escuela.escuela}, ${escuela.direccion}, CABA`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  const handleMail = (mail, e) => {
    e.stopPropagation();
    if (!mail) return;
    window.location.href = `mailto:${mail}`;
  };

  return (
    <div className={`school-card ${expanded ? 'is-expanded' : ''} ${hasAlerts ? 'border-warning' : ''}`}>
      
      {/* HEADER DE LA TARJETA */}
      <div className="school-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="header-info">
          <div className="school-de">Distrito Escolar {escuela.de}</div>
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
        <div className="header-icons">
           {hasAlerts && <span className="alert-icon" title="Requiere atención">⚠️</span>}
           <span className="chevron-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {/* CUERPO EXPANDIDO */}
      {expanded && (
        <div className="school-card-body fade-in">
          <div className="contact-section">
            <p className="contact-row">
              <strong>Email:</strong> <span className="clickable text-link" onClick={(e) => handleMail(escuela.mail, e)}>{escuela.mail || "No registrado"}</span>
            </p>
            {escuela.acdmMail && (
              <p className="contact-row">
                <strong>ACDM:</strong> <span className="clickable text-link" onClick={(e) => handleMail(escuela.acdmMail, e)}>{escuela.acdmMail}</span>
              </p>
            )}
            <p className="contact-row">
              <strong>Tel:</strong> {escuela.telefonos?.length > 0 ? escuela.telefonos.join(" | ") : "Sin teléfono"}
            </p>
          </div>

          {/* SECCIÓN DOCENTES */}
          <div className="docentes-section mt-16">
            <div className="flex justify-between items-center mb-8 border-bottom pb-4">
              <h4 className="title-rajdhani uppercase">Docentes ({escuela.docentes?.length || 0})</h4>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setShowAddDocente(true); }}>
                  ➕ Agregar
                </button>
              )}
            </div>

            {escuela.docentes?.length > 0 ? (
              <div className="docente-list">
                {escuela.docentes.map(doc => (
                  <div key={doc.id} className="docente-row shadow-sm">
                    <div className="docente-info">
                      <span className="docente-name">{doc.nombreApellido}</span>
                      <span className={`badge ${doc.estado === "Activo" ? "badge-active" : "badge-licencia"}`}>
                        {doc.estado}
                      </span>
                    </div>
                    
                    {doc.estado === "Licencia" && (
                      <div className="licencia-detalle mt-4">
                        <DaysRemaining fechaFin={doc.fechaFinLicencia} />
                        {doc.motivo && doc.motivo !== "-" && (
                          <span className="licencia-motivo text-small block mt-2" title={doc.motivo}>
                            📝 {doc.motivo.length > 40 ? doc.motivo.substring(0, 40) + '…' : doc.motivo}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted italic p-8 text-center">Sin docentes asignados.</p>
            )}
          </div>

          {/* ACCIONES DE ESCUELA (Solo Admin) */}
          {isAdmin && (
            <div className="school-actions mt-16 pt-16 border-top flex gap-8">
              <button className="btn btn-secondary btn-sm flex-1" onClick={(e) => { e.stopPropagation(); onEdit(escuela); }}>
                ✏️ Editar Escuela
              </button>
              <button className="btn btn-danger btn-sm flex-1" onClick={(e) => {
                e.stopPropagation();
                if (confirm(`¿Eliminar la escuela "${escuela.escuela}"?`)) onDelete(escuela.id);
              }}>
                🗑️ Eliminar
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL AGREGAR DOCENTE */}
      {showAddDocente && (
        <AddDocenteModal
          escuelaId={escuela.id}
          onClose={() => setShowAddDocente(false)}
          onSave={(nuevoDocente) => {
            if (onDocenteAdded) onDocenteAdded(escuela.id, nuevoDocente);
            setShowAddDocente(false);
          }}
        />
      )}
    </div>
  );
}
