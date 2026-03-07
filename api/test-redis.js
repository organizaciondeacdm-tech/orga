import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    // Probar escritura
    await redis.set('test:connection', 'ok', { ex: 60 });
    
    // Probar lectura
    const value = await redis.get('test:connection');
    
    // Probar operación con escuelas
    const escuelas = await redis.get('acdm:escuelas');
    
    res.status(200).json({ 
      success: true,
      redis: {
        writeRead: value === 'ok',
        hasEscuelas: !!escuelas
      },
      message: 'Redis funcionando correctamente'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}