// api/kv/escuelas.js
import { getEscuelas, saveEscuelas, initializeKV } from '../_lib/kvStorage.backend.js';

export default async function handler(req, res) {
  // 1. Configurar CORS básico (opcional si están en el mismo dominio)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // --- MANEJO DE GET (Obtener escuelas) ---
    if (req.method === 'GET') {
      let escuelas = await getEscuelas();

      // Si no hay datos, intentamos inicializar automáticamente
      if (!escuelas || escuelas.length === 0) {
        console.log('API: Base de datos vacía, inicializando...');
        const initResult = await initializeKV();
        
        if (initResult.success) {
          escuelas = await getEscuelas();
        } else {
          throw new Error('Error al inicializar datos: ' + initResult.error);
        }
      }

      return res.status(200).json(escuelas);
    }

    // --- MANEJO DE POST (Guardar cambios masivos) ---
    if (req.method === 'POST') {
      const { escuelas } = req.body;

      if (!Array.isArray(escuelas)) {
        return res.status(400).json({ error: 'Se esperaba un array de escuelas' });
      }

      const success = await saveEscuelas(escuelas);
      
      if (success) {
        return res.status(200).json({ success: true, message: 'Escuelas guardadas' });
      } else {
        return res.status(500).json({ error: 'Error al guardar en Redis' });
      }
    }

    // Si el método no es GET ni POST
    return res.status(405).json({ error: `Método ${req.method} no permitido` });

  } catch (error) {
    console.error('Error en API Escuelas:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
}
