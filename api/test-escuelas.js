import { Redis } from '@upstash/redis';
// Asegúrate de que estas rutas sean alcanzables por el entorno de ejecución de la API
import { getEscuelas, saveEscuelas } from './_lib/kvStorage.backend.js'; 

const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;

// Solo instanciamos si las variables existen
const redis = (url && token) ? new Redis({ url, token }) : null;

export default async function handler(req, res) {
  // 1. Verificación de conexión inmediata
  if (!redis) {
    return res.status(500).json({ 
      error: 'Configuración de Redis ausente. Verifica las variables de entorno en Vercel.' 
    });
  }

  try {
    // 2. Intentar obtener escuelas
    const escuelas = await getEscuelas();
    
    // 3. Inicialización si no hay datos
    if (!escuelas || (Array.isArray(escuelas) && escuelas.length === 0)) {
      // Nota: Si usas import() dinámico, asegúrate de que la ruta sea correcta desde /api
      const { ESCUELAS_INICIALES, ensureEscuelaStructure } = await import('./_lib/seedData.js');
      
      const iniciales = ESCUELAS_INICIALES.map(ensureEscuelaStructure);
      const success = await saveEscuelas(iniciales);
      
      if (!success) throw new Error("No se pudo guardar la inicialización");

      return res.status(201).json({ 
        message: 'Base de datos vacía. Datos inicializados correctamente.',
        count: iniciales.length
      });
    }
    
    // 4. Respuesta exitosa estándar
    return res.status(200).json({ 
      success: true,
      message: 'Escuelas obtenidas desde KV',
      count: escuelas.length,
      data: escuelas
    });
    
  } catch (error) {
    console.error("Error en API Handler:", error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      // Solo mostrar stack en local
      stack: process.env.VERCEL_ENV === 'development' ? error.stack : undefined
    });
  }
}
