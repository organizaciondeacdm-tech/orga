import { Redis } from '@upstash/redis';
import { 
  ESCUELAS_INICIALES, 
  USUARIOS_INICIALES, 
  ALERTAS_LEIDAS_INICIALES, 
  ensureEscuelaStructure 
} from '../src/data/seedData.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  const { secret } = req.query;
  
  if (secret !== process.env.ADMIN_SECRET_TOKEN) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    const escuelas = ESCUELAS_INICIALES.map(ensureEscuelaStructure);

    await redis.pipeline()
      .set('acdm:escuelas', JSON.stringify(escuelas))
      .set('acdm:usuarios', JSON.stringify(USUARIOS_INICIALES))
      .set('acdm:alertas:leidas', JSON.stringify(ALERTAS_LEIDAS_INICIALES))
      .exec();

    res.status(200).json({ 
      success: true, 
      message: 'Base de datos restaurada',
      stats: {
        escuelas: escuelas.length,
        usuarios: USUARIOS_INICIALES.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
