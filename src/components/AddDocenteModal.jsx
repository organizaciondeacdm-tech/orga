// src/components/AddDocenteModal.jsx
import { useState } from "react";

export default function AddDocenteModal({ escuelaId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombreApellido: "",
    cargo: "Titular",
    estado: "Activo",
    motivo: "-",
    fechaInicioLicencia: "",
    fechaFinLicencia: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const cargos = ["Titular", "Suplente", "Interino"];
  const motivos = [
    "-",
    "Art. 101 - Enfermedad",
    "Art. 102 - Familiar enfermo",
    "Art. 103 - Maternidad",
    "Art. 104 - Accidente de trabajo",
    "Art. 108 - Gremial",
    "Art. 115 - Estudio",
    "Art. 140 - Concurso",
    "Otro"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombreApellido.trim()) {
      alert("El nombre del docente es requerido");
      return;
    }

    setIsSubmitting(true);

    try {
      const docenteData = {
        ...formData,
        // Si es suplente, necesitarías un titularId - por ahora simple
      };

      const res = await fetch('/api/kv/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escuelaId,
          docente: docenteData
        })
      });

      const data = await res.json();

      if (data.success) {
        onSave(data.data);
        onClose();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar docente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">➕ NUEVO DOCENTE</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre y Apellido *</label>
            <input
              className="form-input"
              value={formData.nombreApellido}
              onChange={e => setFormData({...formData, nombreApellido: e.target.value})}
              placeholder="Apellido, Nombre"
              autoFocus
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cargo</label>
              <select
                className="form-select"
                value={formData.cargo}
                onChange={e => setFormData({...formData, cargo: e.target.value})}
              >
                {cargos.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
              >
                <option>Activo</option>
                <option>Licencia</option>
              </select>
            </div>
          </div>

          {formData.estado === "Licencia" && (
            <>
              <div className="form-group">
                <label className="form-label">Motivo de Licencia</label>
                <select
                  className="form-select"
                  value={formData.motivo}
                  onChange={e => setFormData({...formData, motivo: e.target.value})}
                >
                  {motivos.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha Inicio</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.fechaInicioLicencia}
                    onChange={e => setFormData({...formData, fechaInicioLicencia: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha Fin</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.fechaFinLicencia}
                    onChange={e => setFormData({...formData, fechaFinLicencia: e.target.value})}
                  />
                </div>
              </div>
            </>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Docente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}