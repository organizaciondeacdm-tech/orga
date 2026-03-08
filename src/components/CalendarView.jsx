// src/components/CalendarView.jsx
import { useState } from "react";

export default function CalendarView({ escuelas }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // 1. Extraer y normalizar licencias
  const licencias = escuelas.flatMap(esc => 
    (esc.docentes || [])
      .filter(doc => doc.estado === "Licencia" && doc.fechaInicioLicencia && doc.fechaFinLicencia)
      .map(doc => ({
        docente: doc.nombreApellido,
        escuela: esc.escuela,
        inicio: new Date(doc.fechaInicioLicencia + "T00:00:00"),
        fin: new Date(doc.fechaFinLicencia + "T00:00:00"),
        motivo: doc.motivo
      }))
  );

  // 2. Lógica del Calendario (Días del mes actual)
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const primerDiaMes = new Date(year, month, 1).getDay();
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  
  const diasDummies = Array(primerDiaMes).fill(null);
  const diasDelMes = Array.from({ length: diasEnMes }, (_, i) => i + 1);

  // 3. Función para ver quién está de licencia un día específico
  const getLicenciasDelDia = (dia) => {
    if (!dia) return [];
    const fechaCorriente = new Date(year, month, dia);
    return licencias.filter(lic => fechaCorriente >= lic.inicio && fechaCorriente <= lic.fin);
  };

  return (
    <div className="calendar-container card">
      <div className="calendar-header">
        <h2>{viewDate.toLocaleString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase()}</h2>
        <div className="calendar-nav">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))}>◀</button>
          <button onClick={() => setViewDate(new Date())}>Hoy</button>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))}>▶</button>
        </div>
      </div>

      <div className="calendar-layout">
        {/* MINIATURA DEL CALENDARIO */}
        <div className="calendar-grid">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => <div key={d} className="dow">{d}</div>)}
          
          {[...diasDummies, ...diasDelMes].map((dia, i) => {
            const licsDia = getLicenciasDelDia(dia);
            const tieneLicencia = licsDia.length > 0;
            const esHoy = dia === new Date().getDate() && month === new Date().getMonth();

            return (
              <div 
                key={i} 
                className={`calendar-day ${!dia ? 'empty' : ''} ${tieneLicencia ? 'has-licencia' : ''} ${esHoy ? 'is-today' : ''} ${selectedDay === dia ? 'selected' : ''}`}
                onClick={() => dia && setSelectedDay(dia)}
              >
                {dia}
                {tieneLicencia && <div className="dot-marker"></div>}
              </div>
            );
          })}
        </div>

        {/* DETALLE LATERAL (Miniatura de info) */}
        <div className="calendar-details">
          <h3>Detalles {selectedDay ? `del día ${selectedDay}` : 'del mes'}</h3>
          {selectedDay ? (
            getLicenciasDelDia(selectedDay).length > 0 ? (
              getLicenciasDelDia(selectedDay).map((l, i) => (
                <div key={i} className="mini-card-licencia">
                  <strong>{l.docente}</strong>
                  <span>{l.escuela}</span>
                  <em className="text-small">{l.motivo}</em>
                </div>
              ))
            ) : <p className="text-muted">No hay licencias este día.</p>
          ) : (
            <p className="text-muted">Seleccioná un día con marca para ver quién falta.</p>
          )}
        </div>
      </div>
    </div>
  );
}
