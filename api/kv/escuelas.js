import { Redis } from '@upstash/redis';
import { getEscuelas, saveEscuelas } from '../../src/services/kvStorage.backend.js';

// Usar las variables con prefijo STORAGE_ (las que Vercel creó)
const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const KEYS = { ESCUELAS: 'acdm:escuelas' };

// Función auxiliar para asegurar la estructura de las escuelas
function ensureEscuelaStructure(escuela) {
  return {
    id: escuela.id || `e${Date.now()}`,
    de: escuela.de || '',
    escuela: escuela.escuela || '',
    nivel: escuela.nivel || 'Primario',
    direccion: escuela.direccion || '',
    lat: escuela.lat || null,
    lng: escuela.lng || null,
    telefonos: Array.isArray(escuela.telefonos) ? escuela.telefonos : [''],
    mail: escuela.mail || '',
    acdmMail: escuela.acdmMail || '', // ← NUEVO campo
    jornada: escuela.jornada || 'Simple',
    turno: escuela.turno || 'SIMPLE MAÑANA', // ← Actualizado con nuevos valores
    alumnos: Array.isArray(escuela.alumnos) ? escuela.alumnos : [],
    docentes: Array.isArray(escuela.docentes) ? escuela.docentes : []
  };
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        // Obtener todas las escuelas (ya normalizadas por getEscuelas)
        const escuelas = await getEscuelas();
        return res.status(200).json(escuelas);

      case 'POST':
        // Guardar el array completo de escuelas
        const { escuelas: nuevasEscuelas } = req.body;
        
        if (!Array.isArray(nuevasEscuelas)) {
          return res.status(400).json({ 
            success: false, 
            error: 'El body debe contener un array de escuelas' 
          });
        }

        // Normalizar cada escuela antes de guardar
        const escuelasNormalizadas = nuevasEscuelas.map(ensureEscuelaStructure);

        await saveEscuelas(escuelasNormalizadas);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Escuelas guardadas correctamente',
          count: escuelasNormalizadas.length
        });

      case 'DELETE':
        // Eliminar una escuela por ID
        const { id } = req.body;
        
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            error: 'Se requiere el ID de la escuela' 
          });
        }

        const escuelasActuales = await getEscuelas();
        const escuelasFiltradas = escuelasActuales.filter(e => e.id !== id);
        await saveEscuelas(escuelasFiltradas);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Escuela eliminada correctamente' 
        });

      default:
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('❌ Error en API escuelas:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}