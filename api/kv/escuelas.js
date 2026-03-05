import { kv } from '@vercel/kv';
import { getEscuelas, saveEscuela, deleteEscuela } from '../../src/services/kvStorage';

const KEYS = {
  ESCUELAS: 'acdm:escuelas'
};

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        const escuelas = await getEscuelas();
        return res.status(200).json(escuelas);
        
      case 'POST':
        const { escuela, action } = req.body;
        
        if (action === 'delete') {
          await deleteEscuela(escuela.id);
          return res.status(200).json({ success: true, message: 'Escuela eliminada' });
        } else {
          const saved = await saveEscuela(escuela);
          return res.status(200).json({ success: true, data: saved });
        }
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('KV API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}