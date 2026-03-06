import { Redis } from '@upstash/redis';
import { 
  ESCUELAS_INICIALES, 
  USUARIOS_INICIALES, 
  ALERTAS_LEIDAS_INICIALES,
  ensureEscuelaStructure 
} from '../src/data/seedData.js'; // ← IMPORTACIÓN CORRECTA

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  const { secret } = req.query;
  const ADMIN_SECRET = process.env.ADMIN_SECRET_TOKEN || 'default-insecure-token-cambiar';

  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    const escuelas = ESCUELAS_INICIALES.map(ensureEscuelaStructure);

    await redis.pipeline()
      .set('acdm:escuelas', JSON.stringify(escuelas))
      .set('acdm:usuarios', JSON.stringify(USUARIOS_INICIALES))
      .set('acdm:alertas:leidas', JSON.stringify(ALERTAS_LEIDAS_INICIALES))
      .exec();

    return res.status(200).json({ 
      success: true, 
      count: escuelas.length 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}