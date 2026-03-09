// src/components/SeguimientoPanel.jsx
import { useState } from "react";

// --- SUB-COMPONENTES DE FORMULARIO ---

function VisitaForm({ docentes = [], onSave, onClose }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    acdmId: "",
    acdmNombre: "",
    tipo: "seguimiento",
    observacion: "",
    id: `v${Date.now()}`
  });

  const handleConfirm = () => {
    if (!form.acdmId || !form.observacion) return alert("Completar profesional y observación");
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card shadow-glow" onClick={e => e.stopPropagation()}>
        <h3 className="title-rajdhani mb-16">📍 REGISTRAR VISITA</h3>
        <div className="form-group mb-12">
          <label className="form-label">Profesional Interviniente</label>
          <select className="form-select" value={form.acdmId} onChange={e => {
            const d = docentes.find(doc => doc.id === e.target.value);
            setForm({...form, acdmId: d.id, acdmNombre: d.nombreApellido});
          }}>
            <option value="">Seleccionar ACDM...</option>
            {docentes.map(d => <option key={d.id} value={d.id}>{d.nombreApellido}</option>)}
          </select>
        </div>
        <div className="form-group mb-12">
          <label className="form-label">Observaciones</label>
          <textarea className="form-textarea" rows="4" placeholder="Detalle de la intervención..." onChange={e => setForm({...form, observacion: e.target.value})} />
        </div>
        <div className="flex gap-8">
          <button className="btn btn-primary w-full" onClick={handleConfirm}>Confirmar</button>
          <button className="btn btn-secondary w-full" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function ProyectoForm({ docentes = [], onSave, onClose }) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    acdmResponsable: "",
    fechaInicio: new Date().toISOString().split('T')[0],
    estado: "en_progreso",
    avance: 0,
    id: `p${Date.now()}`
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card shadow-glow" onClick={e => e.stopPropagation()}>
        <h3 className="title-rajdhani mb-16">🚀 NUEVO PROYECTO</h3>
        <input className="form-input mb-12" placeholder="Nombre del proyecto" onChange={e => setForm({...form, nombre: e.target.value})} />
        <textarea className="form-textarea mb-12" placeholder="Descripción..." onChange={e => setForm({...form, descripcion: e.target.value})} />
        <select className="form-select mb-12" onChange={e => setForm({...form, acdmResponsable: e.target.value})}>
          <option value="">Responsable...</option>
          {docentes.map(d => <option key={d.id} value={d.id}>{d.nombreApellido}</option>)}
        </select>
        <div className="flex gap-8">
          <button className="btn btn-primary w-full" onClick={() => onSave(form)}>Crear</button>
          <button className="btn btn-secondary w-full" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function InformeForm({ docentes = [], onSave, onClose }) {
  const [form, setForm] = useState({
    titulo: "",
    acdmId: "",
    fechaEntrega: new Date().toISOString().split('T')[0],
    contenido: "",
    estado: "entregado",
    id: `i${Date.now()}`
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card shadow-glow" onClick={e => e.stopPropagation()}>
        <h3 className="title-rajdhani mb-16">📄 SUBIR INFORME</h3>
        <input className="form-input mb-12" placeholder="Título del informe" onChange={e => setForm({...form, titulo: e.target.value})} />
        <select className="form-select mb-12" onChange={e => setForm({...form, acdmId: e.target.value})}>
          <option value="">Autor...</option>
          {docentes.map(d => <option key={d.id} value={d.id}>{d.nombreApellido}</option>)}
        </select>
        <div className="flex gap-8">
          <button className="btn btn-primary w-full" onClick={() => onSave(form)}>Subir</button>
          <button className="btn btn-secondary w-full" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function SeguimientoPanel({ escuela, isAdmin, onUpdate }) {
  const [activeTab, setActiveTab] = useState("visitas");
  const [showForm, setShowForm] = useState(null); // null | 'visitas' | 'proyectos' | 'informes'

  const handleAddData = async (key, newData) => {
    const updatedEscuela = {
      ...escuela,
      [key]: [...(escuela[key] || []), newData]
    };
    await onUpdate(updatedEscuela);
    setShowForm(null);
  };

  return (
    <div className="seguimiento-panel fade-in">
      <div className="tab-nav mb-16 shadow-sm">
        {["visitas", "proyectos", "informes"].map(tab => (
          <button 
            key={tab} 
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <div className="flex justify-between items-center mb-12">
          <h4 className="title-rajdhani uppercase text-accent">{activeTab} Registrados</h4>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(activeTab)}>
              ➕ Nuevo
            </button>
          )}
        </div>

        {/* LISTADO DE VISITAS */}
        {activeTab === "visitas" && (
          <div className="timeline">
            {(escuela.visitas || []).length === 0 ? <p className="text-muted text-center p-16">Sin visitas registradas.</p> : (
              escuela.visitas.map(v => (
                <div key={v.id} className="timeline-item shadow-sm border-left-accent">
                  <div className="text-accent small font-bold">{v.fecha}</div>
                  <div className="font-bold">{v.acdmNombre || "ACDM No especificado"}</div>
                  <p className="text-small italic text-muted mt-4">{v.observacion}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* LISTADO DE PROYECTOS */}
        {activeTab === "proyectos" && (
          <div className="proyectos-grid">
            {(escuela.proyectos || []).length === 0 ? <p className="text-muted text-center p-16">Sin proyectos activos.</p> : (
              escuela.proyectos.map(p => (
                <div key={p.id} className="proyecto-card border p-12 mb-8 rounded shadow-sm">
                  <div className="flex justify-between">
                    <strong>{p.nombre}</strong>
                    <span className="badge badge-active">{p.estado}</span>
                  </div>
                  <div className="avance-bar mt-8 bg-gray-200 rounded-full h-2">
                    <div className="avance-fill bg-primary h-2 rounded-full" style={{width: `${p.avance}%`}}></div>
                  </div>
                  <div className="text-right"><small className="text-muted">{p.avance}% completado</small></div>
                </div>
              ))
            )}
          </div>
        )}

        {/* LISTADO DE INFORMES */}
        {activeTab === "informes" && (
          <div className="informes-lista">
            {(escuela.informes || []).length === 0 ? <p className="text-muted text-center p-16">No hay informes cargados.</p> : (
              escuela.informes.map(i => (
                <div key={i.id} className="informe-item border-bottom p-8 flex justify-between items-center">
                  <div>
                    📄 <strong className="ml-4">{i.titulo}</strong>
                    <div className="text-muted small">{i.fechaEntrega}</div>
                  </div>
                  <button className="btn-icon">👁️</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODALES DINÁMICOS (Corregidos nombres de keys) */}
      {showForm === 'visitas' && <VisitaForm docentes={escuela.docentes} onSave={d => handleAddData('visitas', d)} onClose={() => setShowForm(null)} />}
      {showForm === 'proyectos' && <ProyectoForm docentes={escuela.docentes} onSave={d => handleAddData('proyectos', d)} onClose={() => setShowForm(null)} />}
      {showForm === 'informes' && <InformeForm docentes={escuela.docentes} onSave={d => handleAddData('informes', d)} onClose={() => setShowForm(null)} />}
    </div>
  );
}
