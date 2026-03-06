// src/services/kvStorage.backend.js
import { Redis } from '@upstash/redis';

// Conexión con variables estándar de Vercel
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KEYS = {
  ESCUELAS: 'acdm:escuelas',
  USUARIOS: 'acdm:usuarios',
  ALERTAS_LEIDAS: 'acdm:alertas:leidas',
  METADATA: 'acdm:metadata'
};

// Datos iniciales de respaldo
const INITIAL_DATA = {
  escuelas: [
    {
      id: "e1", de: "DE 01", escuela: "Escuela N°1 Julio Argentino Roca",
      nivel: "Primario", direccion: "Av. Corrientes 1234, CABA",
      lat: -34.6037, lng: -58.3816, telefonos: ["011-4321-1234"],
      mail: "escuela1@bue.edu.ar", acdmMail: "acdm.escuela1@bue.edu.ar",
      jornada: "Completa", turno: "SIMPLE MAÑANA Y TARDE",
      alumnos: [], docentes: []
    }
  ],
  usuarios: [
    { id: "u1", username: "admin", passwordHash: "YWRtaW4yMDI1", rol: "admin" }
  ],
  alertasLeidas: []
};

// Función auxiliar de estructura
function ensureEscuelaStructure(escuela) {
  return {
    id: escuela.id || `e${Date.now()}`,
    de: escuela.de || '',
    escuela: escuela.escuela || '',
    nivel: escuela.nivel || 'Primario',
    direccion: escuela.direccion || '',
    lat: escuela.lat || null,
    lng: escuela.lng || null,
    telefonos: Array.isArray(escuela.telefonos) ? escuela.telefonos : [''],
    mail: escuela.mail || '',
    acdmMail: escuela.acdmMail || '',
    jornada: escuela.jornada || 'Simple',
    turno: escuela.turno || 'SIMPLE MAÑANA',
    alumnos: Array.isArray(escuela.alumnos) ? escuela.alumnos : [],
    docentes: Array.isArray(escuela.docentes) ? escuela.docentes : []
  };
}

// --- EXPORTS ---

export async function initializeKV() {
  try {
    const exists = await redis.exists(KEYS.ESCUELAS);
    if (!exists) {
      const escuelasIniciales = INITIAL_DATA.escuelas.map(ensureEscuelaStructure);
      await redis.set(KEYS.ESCUELAS, JSON.stringify(escuelasIniciales));
      await redis.set(KEYS.USUARIOS, JSON.stringify(INITIAL_DATA.usuarios));
      await redis.set(KEYS.ALERTAS_LEIDAS, JSON.stringify(INITIAL_DATA.alertasLeidas));
      await redis.set(KEYS.METADATA, JSON.stringify({ 
        initializedAt: new Date().toISOString(),
        version: '1.0.0'
      }));
      console.log('✅ Redis inicializado');
    }
  } catch (error) {
    console.error('❌ Error en initializeKV:', error);
  }
}

export async function getEscuelas() {
  try {
    const data = await redis.get(KEYS.ESCUELAS);
    const escuelas = data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];
    return Array.isArray(escuelas) ? escuelas.map(ensureEscuelaStructure) : [];
  } catch (error) {
    return [];
  }
}

export async function saveEscuelas(escuelas) {
  try {
    const escuelasCompletas = Array.isArray(escuelas) ? escuelas.map(ensureEscuelaStructure) : [];
    await redis.set(KEYS.ESCUELAS, JSON.stringify(escuelasCompletas));
    return true;
  } catch (error) {
    return false;
  }
}

export async function getUsuarios() {
  try {
    const data = await redis.get(KEYS.USUARIOS);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];
  } catch (error) {
    return [];
  }
}
