import { getUsuarios } from '../../src/services/kvStorage.backend.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const usuarios = await getUsuarios();
      // No enviar passwordHash por seguridad
      const usuariosPublic = usuarios.map(({ passwordHash, ...rest }) => rest);
      return res.status(200).json(usuariosPublic);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}