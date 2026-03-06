import { getEscuelas, saveEscuelas, initializeKV } from '../../src/services/kvStorage.backend.js';

export default async function handler(req, res) {
  await initializeKV(); // <--- LLAMADA OBLIGATORIA
  
  // ... resto del código que ya tienes ...
export default async function handler(req, res) {
  // 1. FORZAR INICIALIZACIÓN: Carga datos de ejemplo si la base está vacía
  try {
    await initializeKV();
  } catch (initError) {
    console.error('⚠️ Error inicializando KV:', initError);
    // Continuamos aunque falle la inicialización por si ya hay datos
  }

  // 2. CONFIGURAR CORS (Para que el frontend pueda consultar la API)
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
        // Obtener todas las escuelas desde Redis
        const escuelas = await getEscuelas();
        return res.status(200).json(escuelas);

      case 'POST':
        // Se espera un objeto con la propiedad "escuelas" que sea un Array
        const { escuelas: nuevasEscuelas } = req.body;
        
        if (!Array.isArray(nuevasEscuelas)) {
          return res.status(400).json({ 
            success: false, 
            error: 'El body debe contener un objeto con un array de "escuelas"' 
          });
        }

        // Guardar en Redis (saveEscuelas ya normaliza la estructura)
        const guardadoOk = await saveEscuelas(nuevasEscuelas);
        
        if (!guardadoOk) throw new Error('Error al persistir en Redis');

        return res.status(200).json({ 
          success: true, 
          message: 'Escuelas guardadas correctamente',
          count: nuevasEscuelas.length
        });

      case 'DELETE':
        // Eliminar una escuela específica por ID
        const { id } = req.body;
        
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            error: 'Se requiere el ID de la escuela para eliminar' 
          });
        }

        const escuelasActuales = await getEscuelas();
        const escuelasFiltradas = escuelasActuales.filter(e => e.id !== id);
        
        await saveEscuelas(escuelasFiltradas);
        
        return res.status(200).json({ 
          success: true, 
          message: `Escuela ${id} eliminada correctamente` 
        });

      default:
        // Método no permitido
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ 
          success: false, 
          error: `Método ${req.method} no permitido` 
        });
    }
  } catch (error) {
    console.error('❌ Error en API escuelas:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
