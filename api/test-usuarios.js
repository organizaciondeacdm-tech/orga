// api/test-usuarios.js
import { getUsuarios } from './_lib/kvStorage.backend.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Solo aceptamos GET
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Obtener usuarios
    const usuarios = await getUsuarios();
    
    // Devolver información básica (sin contraseñas)
    const usuariosPublic = usuarios.map(({ passwordHash, ...rest }) => rest);
    
    res.status(200).json({ 
      success: true, 
      count: usuariosPublic.length,
      data: usuariosPublic
    });

  } catch (error) {
    console.error('❌ Error en test-usuarios:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}