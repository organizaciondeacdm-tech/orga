import { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      onLogin({ username, rol: username === 'admin' ? 'admin' : 'user' });
    } else {
      setError('Credenciales requeridas');
    }
  };

  return (
    <div className="login-page">
      {/* VIDEO LOCAL: Apunta a /papiweb.mp4 porque está en la carpeta public */}
      <video autoPlay muted loop playsInline className="login-video-bg">
        <source src="/papiweb.mp4" type="video/mp4" />
      </video>
      
      <div className="login-overlay"></div>

      <div className="login-card fade-in">
        <div className="login-header">
          <div className="login-badge">SISTEMA SEGURO</div>
          <h1 className="title-rajdhani">PAPIWEB <span className="text-accent">ACDM</span></h1>
          <p className="subtitle">GESTIÓN DE INSTITUCIONES 2.4</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="USUARIO"
            autoFocus
          />
          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="CONTRASEÑA"
          />
          
          {error && <div className="login-error-msg">❌ {error}</div>}
          
          <button type="submit" className="login-submit-btn title-rajdhani">
            INICIAR CONEXIÓN
          </button>
        </form>

        <div className="login-footer">
          <span className="pulse-dot"></span>
          <span>SERVIDOR: PDX1-USA (ONLINE)</span>
        </div>
      </div>
    </div>
  );
}
