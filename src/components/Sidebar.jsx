// src/components/Sidebar.jsx (opcional, para separar lógica)
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ view, setView, licenciasActivas, collapsed, setCollapsed }) {
  const { deviceType } = useTheme();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="nav-group">
        {!collapsed && 'MENU'}
        {deviceType === 'mobile' && (
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>
      
      <button className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
        <span className="nav-icon">📊</span>
        {!collapsed && <span className="nav-text">Dashboard</span>}
      </button>
      
      <button className={`nav-link ${view === 'escuelas' ? 'active' : ''}`} onClick={() => setView('escuelas')}>
        <span className="nav-icon">🏫</span>
        {!collapsed && <span className="nav-text">Escuelas</span>}
      </button>
      
      <button className={`nav-link ${view === 'calendario' ? 'active' : ''}`} onClick={() => setView('calendario')}>
        <span className="nav-icon">📅</span>
        {!collapsed && (
          <>
            <span className="nav-text">Licencias</span>
            {licenciasActivas > 0 && <span className="nav-badge">{licenciasActivas}</span>}
          </>
        )}
      </button>
      
      {!collapsed && <div className="sidebar-footer">v2.4 Pro</div>}
    </aside>
  );
}