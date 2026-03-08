// src/components/SeguimientoPanel.jsx
import { useState } from "react";

export default function SeguimientoPanel({ escuela, isAdmin, onUpdate }) {
  const [activeTab, setActiveTab] = useState("visitas");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});

  const tabs = [
    { id: "visitas", label: "📋 Visitas", icon: "👁️" },
    { id: "proyectos", label: "📊 Proyectos", icon: "📊" },
    { id: "informes", label: "📄 Informes", icon: "📄" }
  ];

  const handleAddVisita = async (nuevaVisita) => {
    const updatedEscuela = {
      ...escuela,
      visitas: [...(escuela.visitas || []), nuevaVisita]
    };
    await onUpdate(updatedEscuela);
    setShowForm(false);
  };

  return (
    <div className="seguimiento-panel">
      <div className="seguimiento-header">
        <h3 className="panel-title">Seguimiento Institucional</h3>
        <div className="tab-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {/* VISITAS */}
        {activeTab === "visitas" && (
          <div className="visitas-section">
            <div className="section-header">
              <h4>Historial de Visitas</h4>
              {isAdmin && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowForm('visita')}
                >
                  ➕ Registrar Visita
                </button>
              )}
            </div>

            <div className="timeline">
              {(escuela.visitas || []).length === 0 ? (
                <p className="text-muted">No hay visitas registradas</p>
              ) : (
                (escuela.visitas || [])
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .map(visita => (
                    <div key={visita.id} className="timeline-item">
                      <div className="timeline-date">
                        {new Date(visita.fecha).toLocaleDateString('es-AR')}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <strong>{visita.acdmNombre}</strong>
                          <span className={`badge badge-${visita.tipo}`}>
                            {visita.tipo}
                          </span>
                        </div>
                        <p>{visita.observacion}</p>
                        {visita.adjuntos?.length > 0 && (
                          <div className="adjuntos">
                            📎 {visita.adjuntos.length} adjunto(s)
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* PROYECTOS */}
        {activeTab === "proyectos" && (
          <div className="proyectos-section">
            <div className="section-header">
              <h4>Proyectos</h4>
              {isAdmin && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowForm('proyecto')}
                >
                  ➕ Nuevo Proyecto
                </button>
              )}
            </div>

            <div className="proyectos-grid">
              {(escuela.proyectos || []).length === 0 ? (
                <p className="text-muted">No hay proyectos registrados</p>
              ) : (
                (escuela.proyectos || []).map(proyecto => (
                  <div key={proyecto.id} className="proyecto-card">
                    <div className="proyecto-header">
                      <h5>{proyecto.nombre}</h5>
                      <span className={`badge badge-${proyecto.estado}`}>
                        {proyecto.estado.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="proyecto-desc">{proyecto.descripcion}</p>
                    
                    <div className="proyecto-meta">
                      <span>📅 Inicio: {new Date(proyecto.fechaInicio).toLocaleDateString('es-AR')}</span>
                      <span>📅 Entrega: {new Date(proyecto.fechaEntrega).toLocaleDateString('es-AR')}</span>
                    </div>

                    <div className="proyecto-avance">
                      <div className="avance-label">
                        Avance: {proyecto.avance || 0}%
                      </div>
                      <div className="avance-bar">
                        <div 
                          className="avance-fill" 
                          style={{ width: `${proyecto.avance || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="proyecto-responsable">
                      👤 Responsable: {escuela.docentes?.find(d => d.id === proyecto.acdmResponsable)?.nombreApellido || 'No asignado'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* INFORMES */}
        {activeTab === "informes" && (
          <div className="informes-section">
            <div className="section-header">
              <h4>Informes Entregados</h4>
              {isAdmin && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowForm('informe')}
                >
                  ➕ Subir Informe
                </button>
              )}
            </div>

            <div className="informes-lista">
              {(escuela.informes || []).length === 0 ? (
                <p className="text-muted">No hay informes registrados</p>
              ) : (
                (escuela.informes || [])
                  .sort((a, b) => new Date(b.fechaEntrega) - new Date(a.fechaEntrega))
                  .map(informe => (
                    <div key={informe.id} className="informe-item">
                      <div className="informe-icon">📄</div>
                      <div className="informe-info">
                        <div className="informe-titulo">
                          <strong>{informe.titulo}</strong>
                          <span className={`badge badge-${informe.estado}`}>
                            {informe.estado}
                          </span>
                        </div>
                        <div className="informe-meta">
                          <span>📅 {new Date(informe.fechaEntrega).toLocaleDateString('es-AR')}</span>
                          <span>👤 {escuela.docentes?.find(d => d.id === informe.acdmId)?.nombreApellido}</span>
                        </div>
                        {informe.contenido && (
                          <p className="informe-preview">{informe.contenido}</p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALES PARA AGREGAR */}
      {showForm === 'visita' && (
        <VisitaForm 
          escuela={escuela}
          docentes={escuela.docentes || []}
          onSave={handleAddVisita}
          onClose={() => setShowForm(false)}
        />
      )}
      
      {showForm === 'proyecto' && (
        <ProyectoForm 
          escuela={escuela}
          docentes={escuela.docentes || []}
          onSave={handleAddProyecto}
          onClose={() => setShowForm(false)}
        />
      )}
      
      {showForm === 'informe' && (
        <InformeForm 
          escuela={escuela}
          docentes={escuela.docentes || []}
          onSave={handleAddInforme}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}