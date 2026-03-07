// src/components/Presentation.jsx
import React, { useEffect } from 'react';

export default function Presentation({ onFinish }) {
  useEffect(() => {
    // Auto-ocultar después de 30 segundos
    const timer = setTimeout(onFinish, 30000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #1a2540, #0a0e1a)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <video 
        src="/Papiweb.mp4" 
        controls 
        autoPlay
        style={{
          maxWidth: '90%',
          maxHeight: '80vh',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(0,212,255,0.3)'
        }}
      >
        Tu navegador no soporta videos.
      </video>
      <button 
        onClick={onFinish}
        style={{
          marginTop: '20px',
          padding: '10px 30px',
          background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
          border: 'none',
          borderRadius: '8px',
          color: '#0a0e1a',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Ingresar al Sistema
      </button>
    </div>
  );
}