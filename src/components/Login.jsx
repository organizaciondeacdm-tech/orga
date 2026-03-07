// src/components/Login.jsx
import { useState } from "react";

export default function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === "admin" && pass === "admin2025") {
      onLogin({ username: "admin", rol: "admin" });
    } else {
      setErr("Credenciales incorrectas");
    }
  };

  return (
    <div className="login-container">
      <video autoPlay muted loop playsInline className="login-video">
        <source src="/papiweb.mp4" type="video/mp4" />
      </video>
      <div className="login-overlay">
        <div className="login-box">
          <div className="papiweb-logo" style={{ display: 'inline-block', marginBottom: 20 }}>
            <span className="papiweb-text">PAPIWEB</span>
          </div>
          <h2 className="login-title">Sistema ACDM</h2>
          <p className="login-sub">Gestión de Asistentes de Clase</p>

          <form onSubmit={handleSubmit}>
            <input 
              type="text" 
              placeholder="Usuario" 
              value={user} 
              onChange={e => setUser(e.target.value)} 
              autoFocus
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={pass} 
              onChange={e => setPass(e.target.value)} 
            />
            {err && <div className="alert alert-danger">⚠️ {err}</div>}
            <button type="submit" className="btn-login-cloud">
              INGRESAR
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}