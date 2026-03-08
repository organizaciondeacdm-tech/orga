// src/components/CalendarView.jsx
import { useState } from "react";
import DaysRemaining from './DaysRemaining.jsx'; // Importamos el componente de conteo

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
        finRaw: doc.fechaFinLicencia, // Para DaysRemaining
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

  // Nombres de los meses para el detalle lateral
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // 3. Función para ver quién está de licencia un día específico
  const getLicenciasDelDia = (dia) => {
    if (!dia) return [];
    const fechaCorriente = new Date(year, month, dia);
    return licencias.filter(lic => fechaCorriente >= lic.inicio && fechaCorriente <= lic.fin);
  };

  const licenciasDelDia = selectedDay ? getLicenciasDelDia(selectedDay) : [];

  return (
    <div className="calendar-container card fade-in">
      <div className="calendar-header">
        <h2 className="title-rajdhani">
          {monthNames[month].toUpperCase()} {year}
        </h2>
        <div className="calendar-nav">
          <button className="btn-icon" onClick={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); }}>◀</button>
          <button className="btn-sm btn-secondary" onClick={() => { setViewDate(new Date()); setSelectedDay(new Date().getDate()); }}>Hoy</button>
          <button className="btn-icon" onClick={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); }}>▶</button>
        </div>
      </div>

      <div className="calendar-layout">
        {/* GRILLA DEL CALENDARIO */}
        <div className="calendar-grid shadow-sm">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => <div key={d} className="dow">{d}</div>)}
          
          {[...diasDummies, ...diasDelMes].map((dia, i) => {
            const licsDia = getLicenciasDelDia(dia);
            const tieneLicencia = licsDia.length > 0;
            const esHoy = dia === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <div 
                key={i} 
                className={`calendar-day ${!dia ? 'empty' : ''} ${tieneLicencia ? 'has-licencia' : ''} ${esHoy ? 'is-today' : ''} ${selectedDay === dia ? 'selected' : ''}`}
                onClick={() => dia && setSelectedDay(dia)}
              >
                {dia}
                {tieneLicencia && <div className="dot-marker shadow-glow"></div>}
              </div>
            );
          })}
        </div>

        {/* DETALLE LATERAL (Panel solicitado) */}
        <div className="calendar-details card shadow-lg">
          {selectedDay ? (
            <div className="day-licencias fade-in">
              <h3 className="mb-16 border-bottom pb-8">{selectedDay} de {monthNames[month]}</h3>
              {licenciasDelDia.length === 0 ? (
                <p className="text-muted italic">Sin licencias registradas este día.</p>
              ) : (
                <div className="licencias-scroll-list">
                  {licenciasDelDia.map((lic, i) => (
                    <div key={i} className="mini-card-licencia mb-12 shadow-sm">
                      <div className="flex justify-between items-start">
                        <strong>{lic.docente}</strong>
                        <DaysRemaining fechaFin={lic.finRaw} />
                      </div>
                      <div className="licencia-escuela text-accent">{lic.escuela}</div>
                      <div className="licencia-motivo text-small italic mt-4">"{lic.motivo || 'Sin motivo especificado'}"</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-selection">
              <span className="nav-icon big-icon">📅</span>
              <p className="text-muted">Seleccioná un día marcado para ver los detalles de los docentes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
