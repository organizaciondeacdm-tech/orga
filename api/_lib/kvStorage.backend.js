// Papiweb desarrollos informaticos
// api/_lib/kvStorage.backend.js
import { Redis } from '@upstash/redis';
import { 
  ESCUELAS_INICIALES, 
  USUARIOS_INICIALES, 
  ALERTAS_LEIDAS_INICIALES,
  ensureEscuelaStructure 
} from '../../src/data/seedData.js'; // ← RUTA CORREGIDA

/**
 * CONFIGURACIÓN DE REDIS CON VALIDACIÓN
 * Evita que la app truene si las variables de entorno faltan.
 */
const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;

// Solo instanciamos si tenemos credenciales para evitar "Failed to parse URL"
const redis = (url && token) 
  ? new Redis({ url, token }) 
  : null;

const KEYS = {
  ESCUELAS: 'acdm:escuelas',
  USUARIOS: 'acdm:usuarios',
  ALERTAS_LEIDAS: 'acdm:alertas:leidas',
  METADATA: 'acdm:metadata'
};

/**
 * HELPER: Verifica si Redis está disponible
 */
function checkRedis() {
  if (!redis) {
    throw new Error('Redis no configurado. Verifica KV_REST_API_URL y TOKEN.');
  }
  return true;
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

export async function initializeKV() {
  try {
    checkRedis();
    
    // Verificamos si ya existen datos para no sobreescribir por accidente
    const exists = await redis.exists(KEYS.ESCUELAS);
    
    if (!exists) {
      console.log('📦 Base de datos vacía. Cargando datos iniciales...');
      
      const escuelasIniciales = ESCUELAS_INICIALES.map(ensureEscuelaStructure);

      // Usamos pipeline para que sea una sola operación atómica (más rápido y barato)
      await redis.pipeline()
        .set(KEYS.ESCUELAS, JSON.stringify(escuelasIniciales))
        .set(KEYS.USUARIOS, JSON.stringify(USUARIOS_INICIALES))
        .set(KEYS.ALERTAS_LEIDAS, JSON.stringify(ALERTAS_LEIDAS_INICIALES))
        .set(KEYS.METADATA, JSON.stringify({ 
          initializedAt: new Date().toISOString(),
          version: '1.0.0'
        }))
        .exec();

      console.log('✅ Datos iniciales cargados exitosamente');
      return { success: true, count: escuelasIniciales.length, status: 'initialized' };
    }
    
    return { success: true, status: 'already_exists' };
    
  } catch (error) {
    console.error('❌ Error en initializeKV:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================================
// OPERACIONES PARA ESCUELAS
// ============================================================

export async function getEscuelas() {
  try {
    checkRedis();
    const data = await redis.get(KEYS.ESCUELAS);
    
    // Si no hay nada en Redis, devolvemos un array vacío (para que el handler decida si inicializa)
    if (!data) return [];

    // Si data es un string (JSON), lo parseamos, si ya es objeto, lo usamos
    const escuelas = typeof data === 'string' ? JSON.parse(data) : data;
    
    return Array.isArray(escuelas) ? escuelas.map(ensureEscuelaStructure) : [];
  } catch (error) {
    console.error('Error en getEscuelas:', error.message);
    return [];
  }
}

export async function saveEscuelas(escuelas) {
  try {
    checkRedis();
    const escuelasCompletas = Array.isArray(escuelas) 
      ? escuelas.map(ensureEscuelaStructure)
      : [];

    await redis.set(KEYS.ESCUELAS, JSON.stringify(escuelasCompletas));
    return true;
  } catch (error) {
    console.error('Error en saveEscuelas:', error.message);
    return false;
  }
}

// ============================================================
// OPERACIONES PARA USUARIOS
// ============================================================

export async function getUsuarios() {
  try {
    checkRedis();
    const data = await redis.get(KEYS.USUARIOS);
    if (!data) return [];
    
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error('Error en getUsuarios:', error.message);
    return [];
  }
}

// Exportación por defecto para facilitar importaciones
export default {
  initializeKV,
  getEscuelas,
  saveEscuelas,
  getUsuarios,
  redisInstance: redis // Por si necesitas acceso directo en algún caso especial
};