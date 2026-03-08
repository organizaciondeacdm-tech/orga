// src/components/VisitaForm.jsx
import { useState } from "react";

export default function VisitaForm({ escuela, docentes, onSave, onClose }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    acdmId: "",
    acdmNombre: "",
    observacion: "",
    tipo: "seguimiento"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const docente = docentes.find(d => d.id === form.acdmId);
    onSave({
      ...form,
      id: `v${Date.now()}`,
      acdmNombre: docente?.nombreApellido || ''
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">➕ Registrar Visita</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-input"
                value={form.fecha}
                onChange={e => setForm({...form, fecha: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">ACDM</label>
              <select
                className="form-select"
                value={form.acdmId}
                onChange={e => setForm({...form, acdmId: e.target.value})}
                required
              >
                <option value="">Seleccionar ACDM</option>
                {docentes.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nombreApellido}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Visita</label>
            <select
              className="form-select"
              value={form.tipo}
              onChange={e => setForm({...form, tipo: e.target.value})}
            >
              <option value="seguimiento">Seguimiento</option>
              <option value="evaluación">Evaluación</option>
              <option value="emergencia">Emergencia</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observación</label>
            <textarea
              className="form-textarea"
              value={form.observacion}
              onChange={e => setForm({...form, observacion: e.target.value})}
              placeholder="Detalle de la visita..."
              rows="4"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Visita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}