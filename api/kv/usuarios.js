// api/kv/usuarios/[id].js
// import { getUsuarios } from '../../src/services/kvStorage.backend.js';
// Papiweb dinámicas dentro de /api, por eso se mueve a /api/usuarios/[id].js
// Por esto (ruta relativa dentro de /api):
import { getUsuarios } from '../_lib/kvStorage.backend.js';

export default async function handler(req, res) {
  try {
    const usuarios = await getUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

 export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID de usuario requerido' 
    });
  }

  try {
    // ============================================================
    // PUT - Actualizar usuario
    // ============================================================
    if (req.method === 'PUT') {
      const { username, password, rol } = req.body;
      const updates = {};
      
      if (username) updates.username = username;
      if (password) updates.password = password;
      if (rol) updates.rol = rol;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No se proporcionaron datos para actualizar' 
        });
      }

      const usuarioActualizado = await updateUsuario(id, updates);
      
      return res.status(200).json({ 
        success: true, 
        data: usuarioActualizado,
        message: 'Usuario actualizado correctamente'
      });
    }

    // ============================================================
    // DELETE - Eliminar usuario
    // ============================================================
    if (req.method === 'DELETE') {
      await deleteUsuario(id);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Usuario eliminado correctamente'
      });
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });

  } catch (error) {
    console.error('❌ Error en API usuario:', error);
    
    if (error.message.includes('No se puede eliminar')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    if (error.message.includes('Usuario no encontrado')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    if (error.message.includes('ya existe')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}