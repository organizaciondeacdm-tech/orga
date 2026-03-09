// src/components/CalendarWidget.jsx
import { useState } from 'react';
import MiniCalendar from './MiniCalendar.jsx';

export default function CalendarWidget({ escuelas }) {
  const [eventosDelDia, setEventosDelDia] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  // 1. Normalizar todos los eventos de todas las escuelas para el calendario
  const todosLosEventos = escuelas.flatMap(esc => {
    // Visitas
    const visitas = (esc.visitas || []).map(v => ({ 
      ...v, 
      tipo: 'visita', 
      escuelaNombre: esc.escuela,
      titulo: `Visita: ${v.acdmNombre || 'ACDM'}` 
    }));
    
    // Proyectos (usamos fechaInicio como referencia)
    const proyectos = (esc.proyectos || []).map(p => ({ 
      ...p, 
      tipo: 'proyecto', 
      fecha: p.fechaInicio, 
      escuelaNombre: esc.escuela,
      titulo: `Proyecto: ${p.nombre}` 
    }));
    
    // Informes (usamos fechaEntrega como referencia)
    const informes = (esc.informes || []).map(i => ({ 
      ...i, 
      tipo: 'informe', 
      fecha: i.fechaEntrega, 
      escuelaNombre: esc.escuela,
      titulo: `Informe: ${i.titulo}` 
    }));

    return [...visitas, ...proyectos, ...informes];
  }).filter(e => e.fecha); // Solo incluimos los que tienen una fecha válida

  return (
    <div className="calendar-widget card shadow-sm p-16 bg-white rounded-lg">
      <h3 className="title-rajdhani mb-16 text-accent flex items-center gap-8">
        📅 AGENDA DE GESTIÓN
      </h3>
      
      <div className="flex gap-16 flex-col md-flex-row">
        {/* Lado Izquierdo: El Calendario Interactivo */}
        <div className="calendar-container" style={{ flex: "1.2" }}>
          <MiniCalendar 
            eventos={todosLosEventos}
            onDateSelect={(dayInfo) => {
              setFechaSeleccionada(dayInfo.date);
              setEventosDelDia(dayInfo.eventos || []);
            }}
          />
        </div>

        {/* Lado Derecho: Detalle de eventos del día seleccionado */}
        <div className="events-detail-panel flex-1 bg-light rounded-md p-12 border">
          <h4 className="text-accent small font-bold mb-12 uppercase border-bottom pb-4">
            {fechaSeleccionada 
              ? fechaSeleccionada.toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })
              : 'Seleccioná una fecha'}
          </h4>
          
          <div className="event-feed custom-scrollbar" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {eventosDelDia.length > 0 ? (
              eventosDelDia.map((ev, index) => (
                <div key={ev.id || index} className="event-card-mini mb-8 p-8 border-left-accent bg-white shadow-sm rounded">
                  <div className="text-muted xx-small font-bold truncate uppercase tracking-wider">
                    {ev.escuelaNombre}
                  </div>
                  <div className="font-bold small text-dark mt-2">
                    {ev.tipo === 'visita' && '📍 '}
                    {ev.tipo === 'proyecto' && '🚀 '}
                    {ev.tipo === 'informe' && '📄 '}
                    {ev.titulo}
                  </div>
                  {ev.observacion && (
                    <div className="text-muted mt-4 italic text-xs leading-tight">
                      "{ev.observacion.substring(0, 60)}{ev.observacion.length > 60 ? '...' : ''}"
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-20 opacity-50">
                <div className="text-2xl mb-4">🌙</div>
                <p className="small">No hay actividades para este día.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
