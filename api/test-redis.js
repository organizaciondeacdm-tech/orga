import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;

// Si no hay URL, ni siquiera intentamos instanciar para evitar el error de parseo
const redis = (url && token) 
  ? new Redis({ url, token }) 
  : null;

export default async function handler(req, res) {
  if (!redis) {
    return res.status(500).json({ 
      success: false, 
      error: "Variables de entorno faltantes",
      debug: { hasUrl: !!url, hasToken: !!token }
    });
  }

  try {
    await redis.set('test_connection', 'ok', { ex: 10 });
    const val = await redis.get('test_connection');
    res.status(200).json({ success: true, data: val });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
