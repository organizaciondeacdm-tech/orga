import { useState } from "react";

export default function MiniCalendar({ escuela, onDateSelect, eventos = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Días del mes anterior para completar la semana
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex; i > 0; i--) {
      days.push({
        dayNumber: prevMonthLastDay - i + 1,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i + 1)
      });
    }

    // Días del mes actual
    for (let i = 1; i <= lastDayOfMonth; i++) {
      const d = new Date(year, month, i);
      const evs = getEventosForDate(d);
      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        date: d,
        hasEvent: evs.length > 0,
        eventos: evs
      });
    }

    // Relleno mes siguiente hasta completar 42 celdas (6 semanas)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    return days;
  };

  const getEventosForDate = (date) => {
    const dStr = date.toISOString().split('T')[0];
    return eventos.filter(e => {
      const eDate = e.fecha ? new Date(e.fecha).toISOString().split('T')[0] : 
                    e.fechaEntrega ? new Date(e.fechaEntrega).toISOString().split('T')[0] : null;
      return eDate === dStr;
    });
  };

  const handleDayClick = (day) => {
    if (!day.isCurrentMonth) return;
    setSelectedDate(day.date);
    if (onDateSelect) onDateSelect(day);
  };

  const changeMonth = (inc) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + inc, 1));
    setSelectedDate(null);
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const eventosSeleccionados = selectedDate ? getEventosForDate(selectedDate) : [];

  return (
    <div className="mini-calendar card shadow-sm">
      <div className="calendar-header flex justify-between items-center p-8 bg-light">
        <button className="btn-icon-small" onClick={() => changeMonth(-1)}>◀</button>
        <div className="calendar-title title-rajdhani font-bold">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        <button className="btn-icon-small" onClick={() => changeMonth(1)}>▶</button>
      </div>

      <div className="calendar-grid">
        {daysOfWeek.map(d => <div key={d} className="weekday">{d}</div>)}
        {days.map((day, idx) => {
          const isToday = day.isCurrentMonth && day.date.toDateString() === today.toDateString();
          const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
          
          return (
            <div 
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`calendar-day ${!day.isCurrentMonth ? 'disabled' : ''} 
                ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} 
                ${day.hasEvent ? 'has-event' : ''}`}
            >
              {day.dayNumber}
              {day.hasEvent && <div className="event-dot" />}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="calendar-footer p-8 border-top fade-in">
          <div className="text-accent x-small uppercase font-bold mb-4">Eventos del día:</div>
          {eventosSeleccionados.length > 0 ? (
            eventosSeleccionados.map((ev, i) => (
              <div key={i} className="event-row x-small">
                • {ev.nombre || ev.titulo || ev.observacion || "Evento"}
              </div>
            ))
          ) : <div className="text-muted x-small">Sin registros.</div>}
        </div>
      )}
    </div>
  );
}
