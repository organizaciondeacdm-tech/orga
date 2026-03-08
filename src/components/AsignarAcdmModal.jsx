// src/components/AsignarAcdmModal.jsx
import { useState, useMemo } from "react";

export default function AsignarAcdmModal({ alumno, escuela, docentes, onAssign, onClose }) {
  const [selectedAcdm, setSelectedAcdm] = useState(alumno.acdmId || "");
  const [filtro, setFiltro] = useState("");

  // 1. Filtrar solo docentes (ACDM) y aplicar buscador opcional
  const acdmsFiltrados = useMemo(() => {
    const lista = docentes?.filter(d => d.cargo === "Titular" || d.cargo === "Suplente" || d.cargo === "Interino") || [];
    return lista.filter(d => d.nombreApellido.toLowerCase().includes(filtro.toLowerCase()));
  }, [docentes, filtro]);

  // Encontrar el objeto del ACDM seleccionado para mostrar advertencias
  const acdmSeleccionado = acdmsFiltrados.find(d => d.id === selectedAcdm);

  return (
    <div className="modal-overlay fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal shadow-glow card">
        <div className="modal-header border-bottom">
          <h3 className="title-rajdhani text-accent">👤 ASIGNAR ACDM</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body mt-16">
          <div className="info-box mb-16 bg-dark p-12 rounded border">
            <label className="text-muted text-small uppercase">Alumno/a</label>
            <div className="font-bold text-large">{alumno.nombreApellido || alumno.nombre}</div>
            <div className="text-accent">{alumno.gradoSalaAnio} — {escuela?.escuela}</div>
            <div className="text-small italic mt-4">📋 {alumno.diagnostico || "Sin diagnóstico especificado"}</div>
          </div>

          <div className="form-group mb-12">
            <label className="form-label">Buscar Profesional</label>
            <input 
              className="form-input mb-8" 
              placeholder="Filtrar por nombre..." 
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
            
            <label className="form-label">Seleccionar ACDM disponible</label>
            <select 
              className={`form-select ${acdmSeleccionado?.estado === 'Licencia' ? 'border-danger' : ''}`}
              value={selectedAcdm}
              onChange={e => setSelectedAcdm(e.target.value)}
            >
              <option value="">-- Sin asignar --</option>
              {acdmsFiltrados.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.nombreApellido} ({doc.estado === "Licencia" ? "🔴 EN LICENCIA" : "✅ ACTIVO"})
                </option>
              ))}
            </select>
          </div>

          {/* Advertencia si el ACDM está de licencia */}
          {acdmSeleccionado?.estado === "Licencia" && (
            <div className="alert alert-warning text-small py-8 px-12 mb-16 fade-in">
              ⚠️ El profesional seleccionado se encuentra actualmente bajo licencia.
            </div>
          )}
        </div>

        <div className="modal-footer flex gap-8 border-top pt-16">
          <button className="btn btn-secondary w-full" onClick={onClose}>Cancelar</button>
          <button 
            className="btn btn-primary w-full shadow-glow" 
            onClick={() => {
              onAssign(alumno.id, selectedAcdm);
              onClose();
            }}
          >
            Confirmar Asignación
          </button>
        </div>
      </div>
    </div>
  );
}
