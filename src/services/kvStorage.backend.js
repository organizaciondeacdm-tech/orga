import { Redis } from '@upstash/redis';

// Usar variables con prefijo STORAGE_
const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const KEYS = {
  ESCUELAS: 'acdm:escuelas',
  USUARIOS: 'acdm:usuarios',
  ALERTAS_LEIDAS: 'acdm:alertas:leidas',
  METADATA: 'acdm:metadata'
};

export async function getEscuelas() {
  const data = await redis.get(KEYS.ESCUELAS);
  return data ? JSON.parse(data) : [];
}

export async function saveEscuelas(escuelas) {
  await redis.set(KEYS.ESCUELAS, JSON.stringify(escuelas));
}

export async function getUsuarios() {
  const data = await redis.get(KEYS.USUARIOS);
  return data ? JSON.parse(data) : [];
}

// ... otras funciones si son necesarias