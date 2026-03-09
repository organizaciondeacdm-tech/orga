// src/components/Dashboard.jsx (reorganizado)
import { useMemo } from 'react';
import DashboardStats from './DashboardStats.jsx';
import MiniCalendar from './MiniCalendar.jsx';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';

export default function Dashboard({ escuelas }) {
  
  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalEscuelas = escuelas.length;
    const acdmActivos = escuelas.flatMap(e => e.docentes || [])
      .filter(d => d.estado === "Activo").length;
    const enLicencia = escuelas.flatMap(e => e.docentes || [])
      .filter(d => d.estado === "Licencia").length;
    const sinACDM = escuelas.filter(e => !e.docentes || e.docentes.length === 0).length;
    
    return {
      totalEscuelas,
      acdmActivos,
      enLicencia,
      intervenciones: 2, // Esto debería venir de tus datos reales
      sinACDM
    };
  }, [escuelas]);

  // Datos para gráfico de torta - Distribución ACDM
  const distribucionACDM = [
    { name: 'Activos', value: stats.acdmActivos, color: '#10b981' },
    { name: 'Licencia', value: stats.enLicencia, color: '#f59e0b' },
    { name: 'Sin ACDM', value: stats.sinACDM, color: '#ef4444' }
  ];

  // Datos para gráfico de torta - Estado General
  const estadoGeneral = [
    { name: 'Escuelas', value: stats.totalEscuelas, color: '#2563eb' },
    { name: 'Intervenciones', value: stats.intervenciones, color: '#7c3aed' }
  ];

  // Alertas críticas (simuladas - deberían venir de datos reales)
  const alertasCriticas = escuelas
    .filter(e => !e.acdmMail || !e.docentes || e.docentes.length === 0)
    .slice(0, 10)
    .map(e => ({
      escuela: e.escuela,
      problema: !e.acdmMail ? 'Sin mail ACDM' : 'Sin docentes'
    }));

  return (
    <div className="dashboard-container">
      {/* HEADER: Título y versión */}
      <div className="dashboard-header mb-20">
        <h1 className="title-rajdhani">PANEL ESTRATÉGICO ACDM</h1>
        <span className="version-badge">Versión Pro Cloud — Estado del Sistema</span>
      </div>

      <div className="dashboard-layout">
        {/* COLUMNA IZQUIERDA: Agenda y Menú */}
        <div className="dashboard-left">
          {/* AGENDA DE GESTIÓN */}
          <div className="agenda-section card mb-20">
            <h2 className="section-title">AGENDA DE GESTIÓN</h2>
            <div className="mini-calendar-placeholder">
              {/* Aquí va tu calendario de la imagen */}
              <div className="calendar-header">DASHBOARD</div>
              <div className="calendar-weekdays">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                  <span key={d} className="weekday">{d}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {/* Generar días del mes actual */}
                {Array.from({ length: 35 }, (_, i) => (
                  <div key={i} className="calendar-day">
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MENÚ DE NAVEGACIÓN */}
          <div className="menu-section card">
            <h2 className="section-title">MENU</h2>
            <nav className="dashboard-nav">
              <button className="nav-btn">🏫 ESCUELAS</button>
              <button className="nav-btn">📋 LICENCIAS</button>
            </nav>
          </div>
        </div>

        {/* COLUMNA CENTRAL: Gráficos y Estadísticas */}
        <div className="dashboard-center">
          {/* BOTONES DE ESTADÍSTICAS RÁPIDAS */}
          <div className="stats-buttons-grid mb-20">
            <div className="stat-button primary">
              <span className="stat-number">{stats.totalEscuelas}</span>
              <span className="stat-label">ESCUELAS</span>
            </div>
            <div className="stat-button success">
              <span className="stat-number">{stats.acdmActivos}</span>
              <span className="stat-label">ACDM ACTIVOS</span>
            </div>
            <div className="stat-button warning">
              <span className="stat-number">{stats.enLicencia}</span>
              <span className="stat-label">EN LICENCIA</span>
            </div>
            <div className="stat-button accent">
              <span className="stat-number">{stats.intervenciones}</span>
              <span className="stat-label">INTERVENCIONES</span>
            </div>
            <div className="stat-button danger">
              <span className="stat-number">{stats.sinACDM}</span>
              <span className="stat-label">SIN ACDM</span>
            </div>
          </div>

          {/* GRÁFICOS DE TORTA - Aquí van los que mencionaste */}
          <div className="charts-row mb-20">
            <div className="chart-container card">
              <h3 className="chart-title">Distribución ACDM</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={distribucionACDM}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distribucionACDM.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container card">
              <h3 className="chart-title">Estado General</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={estadoGeneral}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#2563eb" />
                    <Cell fill="#7c3aed" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CONTROL DE LICENCIAS */}
          <div className="licencias-section card">
            <h2 className="section-title">CONTROL DE LICENCIAS</h2>
            {escuelas.slice(0, 3).map(escuela => (
              <div key={escuela.id} className="licencia-item">
                <span className="docente-nombre">
                  {escuela.docentes?.find(d => d.estado === "Licencia")?.nombreApellido || 'Sin licencias'}
                </span>
                <span className="escuela-nombre">{escuela.escuela}</span>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: Alertas */}
        <div className="dashboard-right">
          <div className="alertas-section card">
            <h2 className="section-title alert-title">
              ALERTAS CRÍTICAS
              <span className="alert-count">{alertasCriticas.length}</span>
            </h2>
            
            <div className="alertas-list">
              {alertasCriticas.map((alerta, idx) => (
                <div key={idx} className="alerta-item">
                  <span className="alerta-icon">⚠️</span>
                  <div className="alerta-content">
                    <span className="alerta-escuela">{alerta.escuela}</span>
                    <span className="alerta-problema">{alerta.problema}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Link de licencia vencida (como en tu imagen) */}
            <div className="licencia-vencida-link">
              <a href="#" className="link-danger">
                Licencia Vencida
              </a>
              <p className="vencida-detalle">
                López, María Elena — Escuela N°1 Julio Argentino Roca (Expiró)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}