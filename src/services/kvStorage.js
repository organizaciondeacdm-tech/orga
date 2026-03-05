import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const KEYS = {
  ESCUELAS: 'acdm:escuelas',
  USUARIOS: 'acdm:usuarios',
  ALERTAS_LEIDAS: 'acdm:alertas:leidas',
  METADATA: 'acdm:metadata'
};

// Datos iniciales (mismos que antes)
const INITIAL_DATA = {
  escuelas: [/* tus escuelas */],
  usuarios: [
    { id: "u1", username: "admin", passwordHash: btoa("admin2025"), rol: "admin" },
    { id: "u2", username: "viewer", passwordHash: btoa("viewer123"), rol: "viewer" }
  ],
  alertasLeidas: []
};

export async function initializeKV() {
  try {
    const exists = await redis.exists(KEYS.ESCUELAS);
    if (!exists) {
      await redis.set(KEYS.ESCUELAS, JSON.stringify(INITIAL_DATA.escuelas));
      await redis.set(KEYS.USUARIOS, JSON.stringify(INITIAL_DATA.usuarios));
      await redis.set(KEYS.ALERTAS_LEIDAS, JSON.stringify(INITIAL_DATA.alertasLeidas));
      await redis.set(KEYS.METADATA, JSON.stringify({ 
        initializedAt: new Date().toISOString(),
        version: '1.0.0'
      }));
      console.log('✅ Redis inicializado con datos de ejemplo');
    }
  } catch (error) {
    console.error('❌ Error inicializando Redis:', error);
  }
}

export async function getEscuelas() {
  try {
    const data = await redis.get(KEYS.ESCUELAS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting escuelas:', error);
    return [];
  }
}

export async function saveEscuelas(escuelas) {
  try {
    await redis.set(KEYS.ESCUELAS, JSON.stringify(escuelas));
    return true;
  } catch (error) {
    console.error('Error saving escuelas:', error);
    return false;
  }
}

export async function getUsuarios() {
  try {
    const data = await redis.get(KEYS.USUARIOS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting usuarios:', error);
    return [];
  }
}