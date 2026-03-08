// src/components/AddDocenteModal.jsx
import { useState } from "react";
// Opcional: import DayPicker from 'react-day-picker'; (si decidís usar la librería externa)

export default function AddDocenteModal({ escuelaId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombreApellido: "",
    cargo: "Titular",
    estado: "Activo",
    jornada: "SIMPLE MAÑANA",
    motivo: "",
    fechaInicioLicencia: "",
    fechaFinLicencia: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const cargos = ["Titular", "Suplente", "Interino"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombreApellido.trim()) return alert("El nombre es obligatorio");

    if (formData.estado === "Licencia") {
      if (!formData.fechaInicioLicencia || !formData.fechaFinLicencia) {
        return alert("Debes completar el período de la licencia");
      }
      if (new Date(formData.fechaFinLicencia) < new Date(formData.fechaInicioLicencia)) {
        return alert("La fecha de fin no puede ser anterior al inicio");
      }
    }

    setIsSubmitting(true);

    try {
      const finalDocente = { ...formData };
      if (finalDocente.estado === "Activo") {
        finalDocente.motivo = "-";
        finalDocente.fechaInicioLicencia = "";
        finalDocente.fechaFinLicencia = "";
      }

      const res = await fetch('/api/kv/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escuelaId, docente: finalDocente })
      });

      const data = await res.json();
      if (data.success) {
        onSave(data.data);
        onClose();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error al conectar con la nube');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal shadow-glow card">
        <div className="modal-header border-bottom">
          <h2 className="title-rajdhani text-accent">➕ NUEVO ACDM</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-16">
          <div className="form-group mb-12">
            <label className="form-label">Nombre y Apellido *</label>
            <input
              className="form-input"
              value={formData.nombreApellido}
              onChange={e => setFormData({...formData, nombreApellido: e.target.value.toUpperCase()})}
              placeholder="APELLIDO, NOMBRE"
              autoFocus
              required
            />
          </div>

          <div className="form-row flex gap-8 mb-12">
            <div className="form-group flex-1">
              <label className="form-label">Cargo</label>
              <select
                className="form-select"
                value={formData.cargo}
                onChange={e => setFormData({...formData, cargo: e.target.value})}
              >
                {cargos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Estado</label>
              <select
                className={`form-select ${formData.estado === 'Licencia' ? 'text-danger' : 'text-success'}`}
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
              >
                <option value="Activo">✅ Activo</option>
                <option value="Licencia">⛔ Licencia</option>
              </select>
            </div>
          </div>

          <div className="form-group mb-12">
            <label className="form-label">Jornada / Turno</label>
            <select
              className="form-select"
              value={formData.jornada}
              onChange={e => setFormData({...formData, jornada: e.target.value})}
            >
              <option>SIMPLE MAÑANA</option>
              <option>SIMPLE TARDE</option>
              <option>SIMPLE MAÑANA Y TARDE</option>
              <option>EXTENDIDA</option>
              <option>JORNADA COMPLETA</option>
            </select>
          </div>

          {formData.estado === "Licencia" && (
            <div className="licencia-section fade-in p-12 border rounded bg-dark mb-12">
              <div className="form-group mb-12">
                <label className="form-label">Motivo de Licencia</label>
                <textarea
                  className="form-textarea"
                  value={formData.motivo}
                  onChange={e => setFormData({...formData, motivo: e.target.value})}
                  placeholder="Ej: Art. 102 - Familiar enfermo, estudio, etc."
                  rows="2"
                />
              </div>

              <div className="form-row flex gap-8">
                <div className="form-group flex-1">
                  <label className="form-label">Inicio</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.fechaInicioLicencia}
                    onChange={e => setFormData({...formData, fechaInicioLicencia: e.target.value})}
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Fin</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.fechaFinLicencia}
                    onChange={e => setFormData({...formData, fechaFinLicencia: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer flex gap-8 mt-24">
            <button type="button" className="btn btn-secondary w-full" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary w-full shadow-glow" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Confirmar Carga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
