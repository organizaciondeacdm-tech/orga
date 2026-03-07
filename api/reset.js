// api/reset.js
import { Redis } from '@upstash/redis';
import { initializeKV } from './_lib/kvStorage.backend.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  // 1. Obtener el token de la URL (?secret=...)
  const { secret } = req.query;
  const MASTER_TOKEN = "un_token_muy_seguro_y_largo_aqui";

  // 2. Validación de seguridad
  if (!secret || secret !== MASTER_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de seguridad inválido o ausente' 
    });
  }

  try {
    // 3. Limpiar TODAS las claves del proyecto (con el prefijo acdm:)
    const keys = await redis.keys('acdm:*');
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // 4. Forzar la re-inicialización desde seedData
    const initResult = await initializeKV();

    return res.status(200).json({
      success: true,
      message: 'Reseteo completo exitoso',
      clearedKeys: keys.length,
      initialization: initResult
    });

  } catch (error) {
    console.error("Error en el proceso de reset:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
