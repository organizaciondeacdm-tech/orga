import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      // Simulación de login - Ajustar a tu lógica real
      onLogin({ username, rol: username === 'admin' ? 'admin' : 'user' });
    } else {
      setError('Credenciales requeridas');
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-decoration"></div>
      <div className="login-card fade-in">
        <div className="login-header">
          <div className="login-icon">⚡</div>
          <h1 className="title-rajdhani">PAPIWEB <span className="text-accent">ACDM</span></h1>
          <p className="subtitle">GESTIÓN PROFESIONAL CLOUD</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>USUARIO</label>
            <input
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: admin_papiweb"
              autoFocus
            />
          </div>
          
          <div className="input-group">
            <label>CONTRASEÑA</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          {error && <div className="login-error-msg">⚠️ {error}</div>}
          
          <button type="submit" className="login-submit-btn title-rajdhani">
            ESTABLECER CONEXIÓN
          </button>
        </form>

        <div className="login-footer">
          <span>v2.4 PRO EDITION</span>
          <span className="dot">•</span>
          <span>SISTEMA EN LÍNEA</span>
        </div>
      </div>
    </div>
  );
}
