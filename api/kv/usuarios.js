import { getUsuarios, initializeKV } from '../../src/services/kvStorage.backend.js';
export default async function handler(req, res) {
  await initializeKV(); // <--- LLAMADA OBLIGATORIA

  if (req.method === 'GET') {
    const usuarios = await getUsuarios();
    // No enviar passwords en el JSON por seguridad
    const safeUsers = usuarios.map(({passwordHash, ...user}) => user);
    return res.status(200).json(safeUsers);
  }


  try {
    if (req.method === 'GET') {
      const usuarios = await getUsuarios();
      return res.status(200).json(usuarios);
    }
    // ...
  } catch (error) { ... }
}

  // LLAMADA OBLIGATORIA AL INICIO
  await initializeKV(); 

  try {
    if (req.method === 'GET') {
      const usuarios = await getUsuarios();
      return res.status(200).json(usuarios);
    }
    // ...
  } catch (error) { ... }
}

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Obtener usuarios desde Redis (sin contraseñas)
      const usuarios = await getUsuarios();
      
      // No enviar passwordHash por seguridad
      const usuariosPublic = usuarios.map(({ passwordHash, ...rest }) => rest);
      
      return res.status(200).json(usuariosPublic);
    }
    
    // Si no es GET, devolver error
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
    
  } catch (error) {
    console.error('❌ Error en API usuarios:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}