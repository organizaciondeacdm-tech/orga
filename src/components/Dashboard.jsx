// src/components/Dashboard.jsx
import { useMemo, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import MiniCalendar from './MiniCalendar.jsx';
import DaysRemaining from './DaysRemaining.jsx';
// Importamos el hook de sonido (asegurate de tenerlo creado)
import { useAlertSound } from '../hooks/useAlertSound'; 

export default function Dashboard({ escuelas }) {
  const { playAlertSound } = useAlertSound();
  const [alertasMostradas, setAlertasMostradas] = useState({});

  // 1. Cálculos de Estadísticas y Alertas
  const { stats, alertasCriticas, licenciasVencidas } = useMemo(() => {
    const res = {
      stats: { total: escuelas.length, activos: 0, licencia: 0, sinACDM: 0, intervenciones: 0 },
      alertasCriticas: [],
      licenciasVencidas: []
    };

    escuelas.forEach(e => {
      const docentes = e.docentes || [];
      const tieneLicencia = docentes.some(d => d.estado === "Licencia");
      
      res.stats.activos += docentes.filter(d => d.estado === "Activo").length;
      res.stats.licencia += docentes.filter(d => d.estado === "Licencia").length;
      res.stats.intervenciones += (e.visitas?.length || 0) + (e.informes?.length || 0);
      
      if (docentes.length === 0) {
        res.stats.sinACDM++;
        res.alertasCriticas.push({ id: e.id, escuela: e.escuela, tipo: 'Sin docentes asignados' });
      }

      docentes.forEach(d => {
        if (d.estado === "Licencia" && d.fechaFinLicencia) {
          const hoy = new Date();
          const fin = new Date(d.fechaFinLicencia);
          if (fin < hoy) res.licenciasVencidas.push({ ...d, escuelaNombre: e.escuela });
        }
      });
    });

    return res;
  }, [escuelas]);

  // 2. Lógica de Alertas Sonoras y Notificaciones
  useEffect(() => {
    alertasCriticas.forEach(alerta => {
      if (!alertasMostradas[alerta.id]) {
        playAlertSound('critical');
        setAlertasMostradas(prev => ({ ...prev, [alerta.id]: true }));
      }
    });
  }, [alertasCriticas, alertasMostradas, playAlertSound]);

  // Datos para Gráfico de Torta
  const dataPie = [
    { name: 'Activos', value: stats.activos, color: '#10b981' },
    { name: 'Licencia', value: stats.licencia, color: '#f59e0b' },
    { name: 'Sin ACDM', value: stats.sinACDM, color: '#ef4444' }
  ];

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header mb-24">
        <h1 className="title-rajdhani text-accent">PANEL ESTRATÉGICO ACDM</h1>
        <span className="version-badge">PRO CLOUD v2.4 — ESTADO CRÍTICO</span>
      </div>

      <div className="dashboard-grid-main">
        
        {/* COLUMNA IZQUIERDA: Agenda y Alertas */}
        <div className="dashboard-col">
          <div className="card mb-20">
            <h3 className="section-title">📅 AGENDA DE GESTIÓN</h3>
            <MiniCalendar escuelas={escuelas} />
          </div>

          <div className="card border-danger">
            <h3 className="section-title text-danger">🚨 ALERTAS DEL SISTEMA ({alertasCriticas.length})</h3>
            <div className="alert-list-scroll">
              {alertasCriticas.map(a => (
                <div key={a.id} className="alert-item-mini border-bottom p-8">
                  <span className="text-danger font-bold">● {a.escuela}</span>
                  <div className="text-muted small">{a.tipo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA CENTRAL: Estadísticas y Gráficos */}
        <div className="dashboard-col">
          <div className="stats-buttons-grid mb-20">
            <div className="stat-btn bg-primary">
              <div className="num">{stats.total}</div>
              <div className="lab">ESCUELAS</div>
            </div>
            <div className="stat-btn bg-success">
              <div className="num">{stats.activos}</div>
              <div className="lab">ACTIVOS</div>
            </div>
            <div className="stat-btn bg-warning">
              <div className="num">{stats.licencia}</div>
              <div className="lab">LICENCIAS</div>
            </div>
            <div className="stat-btn bg-danger">
              <div className="num">{stats.sinACDM}</div>
              <div className="lab">SIN ACDM</div>
            </div>
          </div>

          <div className="chart-box card">
            <h3 className="section-title">DISTRIBUCIÓN DE PERSONAL</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={dataPie} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {dataPie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* COLUMNA DERECHA: Licencias Críticas */}
        <div className="dashboard-col">
          <div className="card border-accent h-full">
            <h3 className="section-title">🏥 SEGUIMIENTO CRÍTICO</h3>
            {licenciasVencidas.map((l, i) => (
              <div key={i} className="licencia-vencida-box mb-12 p-12 bg-light rounded shadow-sm">
                <strong className="text-danger">⚠️ LICENCIA VENCIDA</strong>
                <p className="mb-4"><strong>{l.nombreApellido}</strong></p>
                <div className="small text-muted">{l.escuelaNombre}</div>
                <DaysRemaining fechaFin={l.fechaFinLicencia} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
