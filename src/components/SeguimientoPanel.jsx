// src/components/SeguimientoPanel.jsx - InformeForm CORREGIDO
function InformeForm({ docentes, onSave, onClose }) {
  const [form, setForm] = useState({
    titulo: "",
    acdmId: "",
    acdmNombre: "",
    fechaEntrega: new Date().toISOString().split('T')[0],
    contenido: "",
    tipo: "informe",
    estado: "entregado",
    id: `i${Date.now()}`
  });

  const [errors, setErrors] = useState({});
  const [buscador, setBuscador] = useState("");

  // Filtrar docentes para búsqueda
  const docentesFiltrados = useMemo(() => {
    if (!buscador.trim()) return docentes;
    return docentes.filter(d => 
      d.nombreApellido?.toLowerCase().includes(buscador.toLowerCase())
    );
  }, [docentes, buscador]);

  const validate = () => {
    const newErrors = {};
    if (!form.titulo.trim()) newErrors.titulo = "El título es obligatorio";
    if (!form.acdmId) newErrors.acdmId = "Debe seleccionar un autor";
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card shadow-glow" onClick={e => e.stopPropagation()}>
        <h3 className="title-rajdhani mb-16">📄 SUBIR INFORME</h3>
        
        {/* Título del informe */}
        <div className="form-group mb-12">
          <label className="form-label">Título del informe *</label>
          <input 
            className="form-input" 
            placeholder="Ej: Informe de seguimiento mensual"
            value={form.titulo}
            onChange={e => {
              setForm({...form, titulo: e.target.value});
              setErrors({...errors, titulo: null});
            }}
          />
          {errors.titulo && <span className="error-text">{errors.titulo}</span>}
        </div>

        {/* BUSCADOR DE AUTOR - ESTO ES LO QUE FALTA */}
        <div className="form-group mb-12">
          <label className="form-label">Buscar autor *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Escribí para buscar..."
            value={buscador}
            onChange={(e) => setBuscador(e.target.value)}
          />
        </div>

        {/* Selector de autor con búsqueda */}
        <div className="form-group mb-16">
          <label className="form-label">Seleccionar autor *</label>
          <select 
            className="form-select"
            value={form.acdmId}
            onChange={(e) => {
              const d = docentes.find(doc => doc.id === e.target.value);
              setForm({
                ...form, 
                acdmId: d?.id || '', 
                acdmNombre: d?.nombreApellido || ''
              });
              setErrors({...errors, acdmId: null});
              setBuscador(""); // Limpiar búsqueda
            }}
          >
            <option value="">Seleccionar autor...</option>
            {docentesFiltrados.map(d => (
              <option key={d.id} value={d.id}>
                {d.nombreApellido} - {d.estado || 'Activo'}
              </option>
            ))}
          </select>
          {errors.acdmId && <span className="error-text">{errors.acdmId}</span>}
          
          {/* Mostrar cantidad de resultados */}
          {buscador && (
            <small className="result-count">
              {docentesFiltrados.length} resultados encontrados
            </small>
          )}
        </div>

        {/* Autor seleccionado (feedback visual) */}
        {form.acdmNombre && (
          <div className="autor-seleccionado mb-12 p-8 border-left-accent">
            <span className="badge badge-success">✓ Autor seleccionado:</span>
            <strong className="ml-8">{form.acdmNombre}</strong>
          </div>
        )}

        {/* Fecha de entrega */}
        <div className="form-group mb-16">
          <label className="form-label">Fecha de entrega</label>
          <input 
            type="date"
            className="form-input"
            value={form.fechaEntrega}
            onChange={e => setForm({...form, fechaEntrega: e.target.value})}
          />
        </div>

        {/* Botones de acción */}
        <div className="flex gap-8">
          <button 
            className="btn btn-primary w-full" 
            onClick={handleSubmit}
          >
            📤 Subir Informe
          </button>
          <button 
            className="btn btn-secondary w-full" 
            onClick={onClose}
          >
            ✖️ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}