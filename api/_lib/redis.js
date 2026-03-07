// api/_lib/redis.js
import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  console.error('❌ Variables de entorno de Redis faltantes');
}

export const redis = new Redis({ 
  url: url?.startsWith('https://') ? url : `https://${url}`,
  token 
});