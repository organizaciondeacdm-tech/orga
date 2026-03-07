// api/check-env.js
export default function handler(req, res) {
  // Solo permitimos GET para este diagnóstico
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const envStatus = {
    // Variables de Vercel KV / Upstash
    kv: {
      hasUrl: !!(process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL),
      hasToken: !!(process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN),
    },
    // Información del entorno
    runtime: {
      nodeEnv: process.env.NODE_ENV || 'development',
      vercelEnv: process.env.VERCEL_ENV || 'local',
      region: process.env.VERCEL_REGION || 'unknown'
    },
    // Estado general
    status: 'API online'
  };

  // Determinamos el código de estado: 200 si todo está ok, 500 si faltan variables críticas
  const isConfigured = envStatus.kv.hasUrl && envStatus.kv.hasToken;
  
  res.status(isConfigured ? 200 : 500).json({
    success: isConfigured,
    ...envStatus
  });
}
