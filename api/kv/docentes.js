// api/docentes.js
import { getEscuelas, saveEscuelas, initializeKV } from '../_lib/kvStorage.backend.js';

export default async function handler(req, res) {
  // 1. Configurar CORS (Esencial para que el frontend pueda consultar)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Inicialización obligatoria de la base de datos (Upstash/Redis)
    await initializeKV(); 

    // 3. Obtener y normalizar datos
    const escuelasData = await getEscuelas();
    const escuelas = Array.isArray(escuelasData) ? escuelasData : [];
    
    console.log(`📡 API docentes - Acceso: ${req.method}`);

    switch (req.method) {
      case 'GET': {
        const { escuelaId, docenteId } = req.query;
        
        // Caso A: Filtrar por una Escuela específica
        if (escuelaId) {
          const escuela = escuelas.find(e => e?.id === escuelaId);
          if (!escuela) return res.status(404).json({ error: 'Escuela no encontrada' });
          return res.status(200).json(escuela.docentes || []);
        }
        
        // Caso B: Buscar un Docente por ID (Titular o Suplente)
        if (docenteId) {
          for (const escuela of escuelas) {
            if (!escuela?.docentes) continue;
            
            const docente = escuela.docentes.find(d => d?.id === docenteId);
            if (docente) return res.status(200).json({ ...docente, escuelaId: escuela.id });

            for (const d of escuela.docentes) {
              const suplente = d.suplentes?.find(s => s?.id === docenteId);
              if (suplente) {
                return res.status(200).json({ 
                  ...suplente, 
                  escuelaId: escuela.id,
                  titularId: d.id,
                  esSuplente: true 
                });
              }
            }
          }
          return res.status(404).json({ error: 'Docente no encontrado' });
        }
        
        // Caso C: Devolver TODOS los docentes (Flat list)
        const todosDocentes = [];
        escuelas.forEach(escuela => {
          escuela.docentes?.forEach(docente => {
            todosDocentes.push({ 
              ...docente, 
              escuelaId: escuela.id, 
              escuelaNombre: escuela.escuela || 'Sin nombre' 
            });
            
            docente.suplentes?.forEach(suplente => {
              todosDocentes.push({ 
                ...suplente, 
                escuelaId: escuela.id, 
                escuelaNombre: escuela.escuela || 'Sin nombre',
                titularId: docente.id,
                titularNombre: docente.nombreApellido
              });
            });
          });
        });
        return res.status(200).json(todosDocentes);
      }

      case 'POST': {
        const { escuelaId, docente, titularId } = req.body;
        if (!escuelaId || !docente) return res.status(400).json({ error: 'Datos insuficientes' });

        const idx = escuelas.findIndex(e => e.id === escuelaId);
        if (idx === -1) return res.status(404).json({ error: 'Escuela no encontrada' });

        if (!escuelas[idx].docentes) escuelas[idx].docentes = [];

        const nuevo = { ...docente, id: docente.id || `d${Date.now()}`, createdAt: new Date().toISOString() };

        if (titularId) {
          const tIdx = escuelas[idx].docentes.findIndex(d => d.id === titularId);
          if (tIdx === -1) return res.status(404).json({ error: 'Titular no encontrado' });
          if (!escuelas[idx].docentes[tIdx].suplentes) escuelas[idx].docentes[tIdx].suplentes = [];
          escuelas[idx].docentes[tIdx].suplentes.push(nuevo);
        } else {
          escuelas[idx].docentes.push(nuevo);
        }

        await saveEscuelas(escuelas);
        return res.status(201).json({ success: true, data: nuevo });
      }

      case 'PUT': {
        const { escuelaId, docente, titularId } = req.body;
        const escIdx = escuelas.findIndex(e => e.id === escuelaId);
        if (escIdx === -1) return res.status(404).json({ error: 'Escuela no encontrada' });

        const editado = { ...docente, updatedAt: new Date().toISOString() };

        if (titularId) {
          const tIdx = escuelas[escIdx].docentes?.findIndex(d => d.id === titularId);
          const sIdx = escuelas[escIdx].docentes[tIdx]?.suplentes?.findIndex(s => s.id === docente.id);
          if (sIdx === -1 || sIdx === undefined) return res.status(404).json({ error: 'Suplente no encontrado' });
          escuelas[escIdx].docentes[tIdx].suplentes[sIdx] = editado;
        } else {
          const dIdx = escuelas[escIdx].docentes?.findIndex(d => d.id === docente.id);
          if (dIdx === -1 || dIdx === undefined) return res.status(404).json({ error: 'Docente no encontrado' });
          escuelas[escIdx].docentes[dIdx] = editado;
        }

        await saveEscuelas(escuelas);
        return res.status(200).json({ success: true, data: editado });
      }

      case 'DELETE': {
        const { escuelaId, docenteId, titularId } = req.body;
        const escIdx = escuelas.findIndex(e => e.id === escuelaId);
        if (escIdx === -1) return res.status(404).json({ error: 'Escuela no encontrada' });

        if (titularId) {
          const tIdx = escuelas[escIdx].docentes?.findIndex(d => d.id === titularId);
          if (tIdx !== -1) {
            escuelas[escIdx].docentes[tIdx].suplentes = escuelas[escIdx].docentes[tIdx].suplentes?.filter(s => s.id !== docenteId);
          }
        } else {
          escuelas[escIdx].docentes = escuelas[escIdx].docentes?.filter(d => d.id !== docenteId);
        }

        await saveEscuelas(escuelas);
        return res.status(200).json({ success: true, message: 'Docente eliminado' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('❌ API Docentes Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
