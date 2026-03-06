// Papiweb api/init.js
import { initializeKV, getEscuelas } from '../src/services/kvStorage.backend.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log("Iniciando proceso de inicialización de KV...");
    
    // Forzamos la inicialización
    await initializeKV();
    
    // Verificamos si hay datos ahora
    const escuelas = await getEscuelas();
    
    return res.status(200).json({
      success: true,
      message: "Proceso de inicialización completado",
      count: escuelas.length,
      data: escuelas
    });
  } catch (error) {
    console.error("Error en /api/init:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
