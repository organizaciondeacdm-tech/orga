// src/components/SeguimientoPanel.jsx - VERSIÓN COMPLETA Y FUNCIONAL
import { useState } from "react";

// --- FORMULARIO DE VISITA ---
function VisitaForm({ docentes, onSave, onClose }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    acdmId: "",
    acdmNombre: "",
    observacion: "",
    id: `v${Date.now()}`
  });

  const handleSubmit = () => {
    if (!form.acdmId || !form.observacion) {
      alert('Completá todos los campos');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>📍 REGISTRAR VISITA</h3>
        
        <select 
          className="form-input"
          onChange={(e) => {
            const d = docentes.find(doc => doc.id === e.target.value);
            setForm({...form, acdmId: d.id, acdmNombre: d.nombreApellido});
          }}
        >
          <option value="">Seleccionar ACDM...</option>
          {docentes.map(d => <option key={d.id} value={d.id}>{d.nombreApellido}</option>)}
        </select>

        <textarea 
          className="form-input mt-12"
          placeholder="Observaciones"
          onChange={(e) => setForm({...form, observacion: e.target.value})}
        />

        <div className="flex gap-8 mt-16">
          <button className="btn btn-primary" onClick={handleSubmit}>Guardar</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// --- FORMULARIO DE PROYECTO ---
function ProyectoForm({ docentes, onSave, onClose }) {
  const [form, setForm] = useState({
    nombre: "",
    acdmResponsable: "",
    acdmNombre: "",
    fechaInicio: new Date().toISOString().split('T')[0],
    id: `p${Date.now()}`
  });

  const handleSubmit = () => {
    if (!form.nombre || !form.acdmResponsable) {
      alert('Completá todos los campos');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>🚀 NUEVO PROYECTO</h3>
        
        <input 
          className="form-input"
          placeholder="Nombre del proyecto"
          onChange={(e) => setForm({...form, nombre: e.target.value})}
        />

        <select 
          className="form-input mt-12"
          onChange={(e) => {
            const d = docentes.find(doc => doc.id === e.target.value);
            setForm({...form, acdmResponsable: d.id, acdmNombre: d.nombreApellido});
          }}
        >
          <option value="">Responsable...</option>
          {docentes.map(d => <option key={d.id} value={d.id}>{d.nombreApellido}</option>)}
        </select>

        <div className="flex gap-8 mt-16">
          <button className="btn btn-primary" onClick={handleSubmit}>Crear</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// --- FORMULARIO DE INFORME ---
function InformeForm({ docentes, onSave, onClose }) {
  const [form, setForm] = useState({
    titulo: "",
    acdmId: "",
    acdmNombre: "",
    fechaEntrega: new Date().toISOString().split('T')[0],
    id: `i${Date.now()}`
  });

  const handleSubmit = () => {
    if (!form.titulo || !form.acdmId) {
      alert('Completá todos los campos');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>📄 SUBIR INFORME</h3>
        
        <input 
          className="form-input"
          placeholder="Título del informe"
          onChange={(e) => setForm({...form, titulo: e.target.value})}
        />

        <select 
          className="form-input mt-12"
          onChange={(e) => {
            const d = docentes.find(doc => doc.id === e.target.value);
            setForm({...form, acdmId: d.id, acdmNombre: d.nombreApellido});
          }}
        >
          <option value="">Autor...</option>
          {docentes.map(d => <option key={d.id} value={d.id}>{d.nombreApellido}</option>)}
        </select>

        <div className="flex gap-8 mt-16">
          <button className="btn btn-primary" onClick={handleSubmit}>Subir</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL SEGUIMIENTOPANEL ---
export default function SeguimientoPanel({ escuela, isAdmin, onUpdate }) {
  const [activeTab, setActiveTab] = useState("visitas");
  const [showForm, setShowForm] = useState(false);

  // Inicializar arrays si no existen
  const visitas = escuela.visitas || [];
  const proyectos = escuela.proyectos || [];
  const informes = escuela.informes || [];

  const handleAddData = async (tipo, newData) => {
    const key = tipo + 's'; // visita -> visitas, proyecto -> proyectos
    const updatedEscuela = {
      ...escuela,
      [key]: [...(escuela[key] || []), newData]
    };
    await onUpdate(updatedEscuela);
    setShowForm(false);
  };

  const getFormType = () => {
    if (activeTab === 'visitas') return 'visita';
    if (activeTab === 'proyectos') return 'proyecto';
    return 'informe';
  };

  return (
    <div className="seguimiento-panel">
      {/* Tabs de navegación */}
      <div className="tabs-container small">
        {["visitas", "proyectos", "informes"].map(tab => (
          <button
            key={tab}
            className={`tab-btn small ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'visitas' && '📍'}
            {tab === 'proyectos' && '🚀'}
            {tab === 'informes' && '📄'}
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Header con botón Nuevo */}
      <div className="flex justify-between items-center mt-12 mb-12">
        <h4 className="title-rajdhani small">{activeTab.toUpperCase()}</h4>
        {isAdmin && (
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(getFormType())}
          >
            ➕ NUEVO
          </button>
        )}
      </div>

      {/* Listados según tab activo */}
      {activeTab === 'visitas' && (
        <div className="visitas-list">
          {visitas.length === 0 ? (
            <p className="text-muted text-center p-20">No hay visitas registradas</p>
          ) : (
            visitas.map(v => (
              <div key={v.id} className="item-card">
                <div className="item-header">
                  <span className="item-date">{v.fecha}</span>
                  <span className="item-author">{v.acdmNombre}</span>
                </div>
                <p className="item-text">{v.observacion}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'proyectos' && (
        <div className="proyectos-list">
          {proyectos.length === 0 ? (
            <p className="text-muted text-center p-20">No hay proyectos registrados</p>
          ) : (
            proyectos.map(p => (
              <div key={p.id} className="item-card">
                <strong>{p.nombre}</strong>
                <p className="item-meta">Responsable: {p.acdmNombre}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'informes' && (
        <div className="informes-list">
          {informes.length === 0 ? (
            <p className="text-muted text-center p-20">No hay informes registrados</p>
          ) : (
            informes.map(i => (
              <div key={i.id} className="item-card">
                <strong>{i.titulo}</strong>
                <p className="item-meta">Autor: {i.acdmNombre} - {i.fechaEntrega}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modales */}
      {showForm === 'visita' && (
        <VisitaForm
          docentes={escuela.docentes || []}
          onSave={(data) => handleAddData('visita', data)}
          onClose={() => setShowForm(false)}
        />
      )}

      {showForm === 'proyecto' && (
        <ProyectoForm
          docentes={escuela.docentes || []}
          onSave={(data) => handleAddData('proyecto', data)}
          onClose={() => setShowForm(false)}
        />
      )}

      {showForm === 'informe' && (
        <InformeForm
          docentes={escuela.docentes || []}
          onSave={(data) => handleAddData('informe', data)}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
