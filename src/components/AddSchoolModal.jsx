// src/components/AddSchoolModal.jsx
import { useState } from "react";

export default function AddSchoolModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    de: "", escuela: "", nivel: "Primario", direccion: "", 
    mail: "", acdmMail: "", jornada: "Simple", turno: "SIMPLE MAÑANA", 
    lat: "", lng: "", telefonos: [""]
  });

  const handlePhoneChange = (index, value) => {
    const newPhones = [...formData.telefonos];
    newPhones[index] = value;
    setFormData({...formData, telefonos: newPhones});
  };

  const addPhone = () => {
    setFormData({...formData, telefonos: [...formData.telefonos, ""]});
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">➕ NUEVA ESCUELA</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Distrito Escolar (DE)</label>
            <input 
              className="form-input" 
              placeholder="Ej: DE 01" 
              onChange={e => setFormData({...formData, de: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nivel</label>
            <select 
              className="form-select" 
              onChange={e => setFormData({...formData, nivel: e.target.value})}
            >
              <option>Inicial</option>
              <option>Primario</option>
              <option>Secundario</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nombre de la Institución</label>
          <input 
            className="form-input" 
            placeholder="Nombre completo" 
            onChange={e => setFormData({...formData, escuela: e.target.value})} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Dirección</label>
          <input 
            className="form-input" 
            placeholder="Calle, número, localidad" 
            onChange={e => setFormData({...formData, direccion: e.target.value})} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mail Institucional</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="escuela@bue.edu.ar" 
            onChange={e => setFormData({...formData, mail: e.target.value})} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mail del ACDM</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="acdm@escuela.edu.ar" 
            onChange={e => setFormData({...formData, acdmMail: e.target.value})} 
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Jornada</label>
            <select 
              className="form-select" 
              onChange={e => setFormData({...formData, jornada: e.target.value})}
            >
              <option>Simple</option>
              <option>Completa</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Turno</label>
            <select 
              className="form-select" 
              onChange={e => setFormData({...formData, turno: e.target.value})}
            >
              <option>SIMPLE MAÑANA</option>
              <option>SIMPLE TARDE</option>
              <option>SIMPLE MAÑANA Y TARDE</option>
              <option>JORNADA COMPLETA</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Teléfonos</label>
          {formData.telefonos.map((tel, i) => (
            <div key={i} className="flex gap-8 mb-8">
              <input 
                className="form-input" 
                value={tel} 
                placeholder="011-XXXX-XXXX"
                onChange={e => handlePhoneChange(i, e.target.value)} 
              />
              {formData.telefonos.length > 1 && (
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={() => {
                    const newPhones = formData.telefonos.filter((_, idx) => idx !== i);
                    setFormData({...formData, telefonos: newPhones});
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={addPhone}>
            + Agregar teléfono
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>CANCELAR</button>
          <button className="btn btn-primary" onClick={() => onSave(formData)}>GUARDAR</button>
        </div>
      </div>
    </div>
  );
}