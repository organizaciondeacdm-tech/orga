import { useState } from "react";
import DaysRemaining from './DaysRemaining.jsx';
import AddDocenteModal from './AddDocenteModal.jsx'; 
import SeguimientoPanel from './SeguimientoPanel.jsx';

export default function SchoolCard({ escuela, isAdmin, onDocenteAdded, onEdit, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('docentes'); // 'docentes' | 'seguimiento'
  const [showAddDocente, setShowAddDocente] = useState(false);

  // Alertas si faltan datos críticos
  const hasAlerts = !escuela.acdmMail || !escuela.docentes || escuela.docentes.length === 0;

  const openMaps = (e) => {
    e.stopPropagation();
    const query = encodeURIComponent(`${escuela.escuela}, ${escuela.direccion}, CABA`);
    window.open(`https://www.google.com{query}`, "_blank", "noopener,noreferrer");
  };

  const handleMail = (mail, e) => {
    e.stopPropagation();
    if (!mail) return;
    window.location.href = `mailto:${mail}`;
  };

  return (
    <div className={`school-card ${expanded ? 'is-expanded' : ''} ${hasAlerts ? 'border-warning' : ''}`}>
      
      {/* HEADER DE LA TARJETA */}
      <div 
        className="school-card-header" 
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex="0"
      >
        <div className="header-info">
          <div className="school-de">Distrito Escolar {escuela.de}</div>
          <div className="school-name">{escuela.escuela}</div>
          <div className="school-meta">
            <span className="school-meta-item">📚 {escuela.nivel}</span>
            {escuela.direccion && (
              <span className="school-meta-item clickable" onClick={openMaps}>📍 {escuela.direccion}</span>
            )}
          </div>
        </div>
        <div className="header-icons">
           {hasAlerts && <span className="alert-icon" title="Faltan datos de contacto o docentes">⚠️</span>}
           <span className="chevron-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {/* CUERPO EXPANDIDO */}
      {expanded && (
        <div className="school-card-body fade-in">
          
          {/* INFO DE CONTACTO RÁPIDA */}
          <div className="contact-section shadow-sm">
            <span className="clickable" onClick={(e) => handleMail(escuela.mail, e)}>📧 {escuela.mail || "S/M"}</span>
            {escuela.acdmMail && (
              <span className="clickable ml-8" onClick={(e) => handleMail(escuela.acdmMail, e)}>📨 ACDM: {escuela.acdmMail}</span>
            )}
            <span className="ml-8">📞 {escuela.telefonos?.[0] || "S/T"}</span>
          </div>

          {/* SELECTOR DE PESTAÑAS (TABS) */}
          <div className="tabs-container mt-16">
            <button 
              className={`tab-btn ${activeTab === 'docentes' ? 'active' : ''}`}
              onClick={() => setActiveTab('docentes')}
            >
              👥 Docentes
            </button>
            <button 
              className={`tab-btn ${activeTab === 'seguimiento' ? 'active' : ''}`}
              onClick={() => setActiveTab('seguimiento')}
            >
              📋 Seguimiento
            </button>
          </div>

          {/* CONTENIDO DE PESTAÑA: DOCENTES */}
          {activeTab === 'docentes' && (
            <div className="tab-content fade-in">
              <div className="flex justify-between items-center mb-8 mt-12">
                <h4 className="title-rajdhani">PERSONAL ACDM ({escuela.docentes?.length || 0})</h4>
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
                        <strong>{doc.nombreApellido}</strong>
                        <span className={`badge ${doc.estado === "Activo" ? 'badge-active' : 'badge-licencia'}`}>{doc.estado}</span>
                      </div>
                      {doc.estado === "Licencia" && (
                        <div className="licencia-detalle mt-4">
                          <DaysRemaining fechaFin={doc.fechaFinLicencia} />
                          {doc.motivo && <span className="licencia-motivo">📝 {doc.motivo}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted p-16 text-center">Sin docentes asignados.</p>}
            </div>
          )}

          {/* CONTENIDO DE PESTAÑA: SEGUIMIENTO */}
          {activeTab === 'seguimiento' && (
            <div className="tab-content fade-in mt-12">
              <SeguimientoPanel 
                escuela={escuela} 
                isAdmin={isAdmin} 
                onUpdate={onUpdate} 
              />
            </div>
          )}

          {/* ACCIONES GENERALES (Solo Admin) */}
          {isAdmin && (
            <div className="school-actions mt-16 pt-16 border-top flex gap-8">
              <button className="btn btn-secondary btn-sm flex-1" onClick={(e) => { e.stopPropagation(); onEdit(escuela); }}>✏️ Editar Escuela</button>
              <button className="btn btn-danger btn-sm flex-1" onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`¿Eliminar la escuela "${escuela.escuela}"?`)) onDelete(escuela.id);
              }}>🗑️ Eliminar</button>
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA AGREGAR DOCENTE */}
      {showAddDocente && (
        <AddDocenteModal
          escuelaId={escuela.id}
          onClose={() => setShowAddDocente(false)}
          onSave={(nuevoDocente) => {
            onDocenteAdded(escuela.id, nuevoDocente);
            setShowAddDocente(false);
          }}
        />
      )}
    </div>
  );
}
