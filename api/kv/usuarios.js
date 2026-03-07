// api/kv/usuarios.js
import { getUsuarios, addUsuario } from '../_lib/kvStorage.backend.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ============================================================
    // GET - Listar usuarios (sin contraseñas)
    // ============================================================
    if (req.method === 'GET') {
      const usuarios = await getUsuarios();
      const usuariosPublic = usuarios.map(({ passwordHash, ...rest }) => rest);
      return res.status(200).json(usuariosPublic);
    }

    // ============================================================
    // POST - Crear nuevo usuario
    // ============================================================
    if (req.method === 'POST') {
      const { username, password, rol } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username y password son requeridos' 
        });
      }

      const nuevoUsuario = await addUsuario({ username, password, rol });
      
      return res.status(201).json({ 
        success: true, 
        data: nuevoUsuario,
        message: 'Usuario creado correctamente'
      });
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });

  } catch (error) {
    console.error('❌ Error en API usuarios:', error);
    
    if (error.message === 'El nombre de usuario ya existe') {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}