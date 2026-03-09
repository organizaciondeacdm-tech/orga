// src/components/Login.jsx (versión mejorada)
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [contrast, setContrast] = useState('normal'); // 'normal' | 'high'
  
  const { theme } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación simple (ajustá según tu lógica)
    if (username && password) {
      onLogin({ username, rol: 'user' });
    } else {
      setError('Ingresá usuario y contraseña');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo o ícono opcional */}
        <div className="login-logo mb-20">
          <span className="logo-icon">🏫</span>
        </div>

        {/* Títulos con buen contraste */}
        <h1>PAPIWEB</h1>
        <h2 className={contrast === 'high' ? 'high-contrast' : ''}>
          SISTEMA ACDM
        </h2>
        
        {/* Control de contraste (opcional) */}
        <button 
          className="contrast-toggle"
          onClick={() => setContrast(prev => prev === 'normal' ? 'high' : 'normal')}
          title="Alternar contraste"
        >
          {contrast === 'normal' ? '🔆' : '⚡'}
        </button>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="login-input"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          
          <input
            type="password"
            className="login-input"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {error && <div className="login-error">{error}</div>}
          
          <button type="submit" className="login-button">
            Ingresar al Sistema
          </button>
        </form>

        {/* Versión y créditos */}
        <div className="login-footer mt-20">
          <small className="text-muted">
            PAPIWEB ACDM v2.4 Pro
          </small>
        </div>
      </div>
    </div>
  );
}