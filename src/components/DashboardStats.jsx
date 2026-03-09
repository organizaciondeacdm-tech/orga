// src/components/DashboardStats.jsx
import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

export default function DashboardStats({ escuelas }) {
  
  // 1. Estadísticas generales
  const stats = useMemo(() => {
    const totalEscuelas = escuelas.length;
    const totalDocentes = escuelas.reduce((acc, e) => acc + (e.docentes?.length || 0), 0);
    const licenciasActivas = escuelas.flatMap(e => e.docentes || []).filter(d => d.estado === "Licencia").length;
    const escuelasConMail = escuelas.filter(e => e.acdmMail).length;
    const escuelasConDireccion = escuelas.filter(e => e.direccion).length;
    const totalVisitas = escuelas.reduce((acc, e) => acc + (e.visitas?.length || 0), 0);
    const totalProyectos = escuelas.reduce((acc, e) => acc + (e.proyectos?.length || 0), 0);
    
    return {
      totalEscuelas,
      totalDocentes,
      licenciasActivas,
      escuelasConMail,
      escuelasConDireccion,
      totalVisitas,
      totalProyectos,
      porcentajeMail: Math.round((escuelasConMail / totalEscuelas) * 100) || 0,
      porcentajeDireccion: Math.round((escuelasConDireccion / totalEscuelas) * 100) || 0
    };
  }, [escuelas]);

  // 2. Datos para gráfico de distribución por nivel
  const nivelesData = useMemo(() => {
    const niveles = {};
    escuelas.forEach(e => {
      const nivel = e.nivel || 'Sin especificar';
      niveles[nivel] = (niveles[nivel] || 0) + 1;
    });
    return Object.entries(niveles).map(([name, value]) => ({ name, value }));
  }, [escuelas]);

  // 3. Datos para gráfico de visitas por escuela (top 5)
  const visitasData = useMemo(() => {
    return escuelas
      .map(e => ({
        name: e.escuela?.substring(0, 15) + '...',
        visitas: e.visitas?.length || 0,
        proyectos: e.proyectos?.length || 0
      }))
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 5);
  }, [escuelas]);

  // 4. Datos para gráfico de docentes por estado
  const docentesEstadoData = useMemo(() => {
    const docentes = escuelas.flatMap(e => e.docentes || []);
    const activos = docentes.filter(d => d.estado === "Activo").length;
    const licencia = docentes.filter(d => d.estado === "Licencia").length;
    const otros = docentes.length - activos - licencia;
    
    return [
      { name: 'Activos', value: activos },
      { name: 'Licencia', value: licencia },
      { name: 'Otros', value: otros }
    ];
  }, [escuelas]);

  // 5. Datos para evolución temporal (simulado con últimos 6 meses)
  const evolucionData = useMemo(() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return meses.map((mes, idx) => ({
      mes,
      visitas: Math.floor(Math.random() * 10) + 5, // Simulado - idealmente usar fechas reales
      proyectos: Math.floor(Math.random() * 5) + 2
    }));
  }, []);

  const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="dashboard-stats">
      {/* Tarjetas de resumen */}
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon">🏫</div>
          <div className="stat-content">
            <span className="stat-label">Escuelas</span>
            <span className="stat-value">{stats.totalEscuelas}</span>
          </div>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-label">Docentes</span>
            <span className="stat-value">{stats.totalDocentes}</span>
          </div>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <span className="stat-label">Licencias</span>
            <span className="stat-value">{stats.licenciasActivas}</span>
          </div>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">📧</div>
          <div className="stat-content">
            <span className="stat-label">Mail ACDM</span>
            <span className="stat-value">{stats.porcentajeMail}%</span>
          </div>
        </div>
      </div>

      {/* Segunda fila de tarjetas */}
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <span className="stat-label">Con dirección</span>
            <span className="stat-value">{stats.porcentajeDireccion}%</span>
          </div>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">👣</div>
          <div className="stat-content">
            <span className="stat-label">Visitas</span>
            <span className="stat-value">{stats.totalVisitas}</span>
          </div>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <span className="stat-label">Proyectos</span>
            <span className="stat-value">{stats.totalProyectos}</span>
          </div>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-label">Promedio</span>
            <span className="stat-value">
              {(stats.totalDocentes / stats.totalEscuelas).toFixed(1)} doc/esc
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="charts-grid">
        {/* Gráfico de torta - Distribución por nivel */}
        <div className="chart-card card">
          <h3 className="chart-title">📚 Distribución por Nivel</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={nivelesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {nivelesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de barras - Top 5 escuelas con más visitas */}
        <div className="chart-card card">
          <h3 className="chart-title">🏆 Top 5 - Visitas por Escuela</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={visitasData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visitas" fill="#2563eb" name="Visitas" />
              <Bar dataKey="proyectos" fill="#10b981" name="Proyectos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        {/* Gráfico de área - Evolución temporal */}
        <div className="chart-card card">
          <h3 className="chart-title">📈 Evolución de Actividad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={evolucionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="visitas" stackId="1" stroke="#2563eb" fill="#2563eb" />
              <Area type="monotone" dataKey="proyectos" stackId="1" stroke="#10b981" fill="#10b981" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de torta - Estado de docentes */}
        <div className="chart-card card">
          <h3 className="chart-title">👥 Estado de Docentes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={docentesEstadoData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {docentesEstadoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de últimas actividades */}
      <div className="recent-activity card">
        <h3 className="chart-title">🕒 Últimas Actividades</h3>
        <div className="activity-list">
          {escuelas.slice(0, 5).map(escuela => (
            <div key={escuela.id} className="activity-item">
              <div className="activity-school">{escuela.escuela}</div>
              <div className="activity-details">
                <span className="badge">{escuela.visitas?.length || 0} visitas</span>
                <span className="badge">{escuela.proyectos?.length || 0} proyectos</span>
                <span className="badge">{escuela.docentes?.length || 0} docentes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}