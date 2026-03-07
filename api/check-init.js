// Papiweb checher:api/kv/init.js
import { initializeKV, getEscuelas } from '../_lib/kvStorage.backend.js';

export default async function handler(req, res) {
  try {
    // Intentamos inicializar (solo actuará si Redis está vacío)
    const initResult = await initializeKV();
    
    // Obtenemos el estado actual de las escuelas
    const escuelas = await getEscuelas();
    
    return res.status(200).json({
      success: true,
      message: initResult.status === 'already_exists' 
        ? 'La base de datos ya contenía datos.' 
        : 'Base de datos inicializada con éxito.',
      details: {
        initStatus: initResult.status,
        escuelasCount: escuelas.length,
        // Mostramos solo IDs para no saturar la respuesta si hay muchas
        escuelasIds: escuelas.map(e => e.id) 
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
