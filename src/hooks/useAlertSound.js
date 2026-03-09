// src/hooks/useAlertSound.js
import { useRef, useCallback } from 'react';

export function useAlertSound() {
  const audioContextRef = useRef(null);

  const playAlertSound = useCallback((tipo = 'critical') => {
    try {
      // Inicializar AudioContext (necesita interacción del usuario)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const context = audioContextRef.current;
      
      // Reanudar si está suspendido
      if (context.state === 'suspended') {
        context.resume();
      }

      // Crear oscilador para generar tono
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Configurar según tipo de alerta
      switch(tipo) {
        case 'critical':
          oscillator.frequency.setValueAtTime(880, context.currentTime); // La5
          oscillator.frequency.setValueAtTime(440, context.currentTime + 0.2); // La4
          gainNode.gain.setValueAtTime(0.3, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8);
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.8);
          break;
          
        case 'warning':
          oscillator.frequency.setValueAtTime(660, context.currentTime); // Mi5
          oscillator.frequency.setValueAtTime(330, context.currentTime + 0.3); // Mi4
          gainNode.gain.setValueAtTime(0.2, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.6);
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.6);
          break;
          
        case 'info':
          oscillator.frequency.setValueAtTime(523.25, context.currentTime); // Do5
          gainNode.gain.setValueAtTime(0.15, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.3);
          break;
      }
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  }, []);

  return { playAlertSound };
}