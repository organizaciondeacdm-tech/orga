import { 
  getEscuelas, 
  saveEscuelas 
} from '../../src/services/kvStorage.backend.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Asegurar que escuelas es un array
    const escuelasData = await getEscuelas();
    const escuelas = Array.isArray(escuelasData) ? escuelasData : [];
    
    console.log(`📡 API docentes - ${req.method} - Escuelas: ${escuelas.length}`);

    switch (req.method) {
      case 'GET': {
        // Obtener todos los docentes (opcional, con filtros)
        const { escuelaId, docenteId } = req.query;
        
        if (escuelaId) {
          const escuela = escuelas.find(e => e && e.id === escuelaId);
          if (!escuela) {
            return res.status(404).json({ error: 'Escuela no encontrada' });
          }
          return res.status(200).json(escuela.docentes || []);
        }
        
        if (docenteId) {
          // Buscar docente en todas las escuelas
          for (const escuela of escuelas) {
            if (!escuela || !escuela.docentes) continue;
            
            const docente = escuela.docentes.find(d => d && d.id === docenteId);
            if (docente) {
              return res.status(200).json({ ...docente, escuelaId: escuela.id });
            }
            // Buscar en suplentes
            for (const d of escuela.docentes) {
              if (!d || !d.suplentes) continue;
              const suplente = d.suplentes.find(s => s && s.id === docenteId);
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
        
        // Si no hay filtros, devolver todos
        const todosDocentes = [];
        escuelas.forEach(escuela => {
          if (!escuela || !escuela.docentes) return;
          
          escuela.docentes.forEach(docente => {
            if (!docente) return;
            todosDocentes.push({ 
              ...docente, 
              escuelaId: escuela.id, 
              escuelaNombre: escuela.escuela || 'Sin nombre' 
            });
            
            if (docente.suplentes && Array.isArray(docente.suplentes)) {
              docente.suplentes.forEach(suplente => {
                if (!suplente) return;
                todosDocentes.push({ 
                  ...suplente, 
                  escuelaId: escuela.id, 
                  escuelaNombre: escuela.escuela || 'Sin nombre',
                  titularId: docente.id,
                  titularNombre: docente.nombreApellido || 'Sin nombre'
                });
              });
            }
          });
        });
        
        return res.status(200).json(todosDocentes);
      }

      case 'POST': {
        // Agregar nuevo docente
        const { escuelaId, docente, titularId } = req.body;
        
        if (!escuelaId || !docente) {
          return res.status(400).json({ 
            error: 'Se requiere escuelaId y datos del docente' 
          });
        }

        const escuelaIndex = escuelas.findIndex(e => e && e.id === escuelaId);
        if (escuelaIndex === -1) {
          return res.status(404).json({ error: 'Escuela no encontrada' });
        }

        // Asegurar que docentes existe
        if (!escuelas[escuelaIndex].docentes) {
          escuelas[escuelaIndex].docentes = [];
        }

        const newDocente = {
          ...docente,
          id: docente.id || `d${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (titularId) {
          // Agregar como suplente
          const titularIndex = escuelas[escuelaIndex].docentes.findIndex(d => d && d.id === titularId);
          if (titularIndex === -1) {
            return res.status(404).json({ error: 'Titular no encontrado' });
          }
          
          if (!escuelas[escuelaIndex].docentes[titularIndex].suplentes) {
            escuelas[escuelaIndex].docentes[titularIndex].suplentes = [];
          }
          
          escuelas[escuelaIndex].docentes[titularIndex].suplentes.push(newDocente);
        } else {
          // Agregar como docente principal
          escuelas[escuelaIndex].docentes.push(newDocente);
        }

        await saveEscuelas(escuelas);
        return res.status(200).json({ 
          success: true, 
          data: newDocente,
          message: 'Docente agregado correctamente' 
        });
      }

      case 'PUT': {
        // Actualizar docente existente
        const { escuelaId: editEscuelaId, docente: editDocente, titularId: editTitularId } = req.body;
        
        if (!editEscuelaId || !editDocente || !editDocente.id) {
          return res.status(400).json({ 
            error: 'Se requiere escuelaId y docente con id' 
          });
        }

        const editEscuelaIndex = escuelas.findIndex(e => e && e.id === editEscuelaId);
        if (editEscuelaIndex === -1) {
          return res.status(404).json({ error: 'Escuela no encontrada' });
        }

        const updatedDocente = {
          ...editDocente,
          updatedAt: new Date().toISOString()
        };

        if (editTitularId) {
          // Actualizar suplente
          const titularIndex = escuelas[editEscuelaIndex].docentes?.findIndex(d => d && d.id === editTitularId);
          if (titularIndex === -1 || titularIndex === undefined) {
            return res.status(404).json({ error: 'Titular no encontrado' });
          }
          
          const suplenteIndex = escuelas[editEscuelaIndex].docentes[titularIndex].suplentes?.findIndex(s => s && s.id === editDocente.id);
          if (suplenteIndex === -1 || suplenteIndex === undefined) {
            return res.status(404).json({ error: 'Suplente no encontrado' });
          }
          
          escuelas[editEscuelaIndex].docentes[titularIndex].suplentes[suplenteIndex] = updatedDocente;
        } else {
          // Actualizar docente principal
          const docenteIndex = escuelas[editEscuelaIndex].docentes?.findIndex(d => d && d.id === editDocente.id);
          if (docenteIndex === -1 || docenteIndex === undefined) {
            return res.status(404).json({ error: 'Docente no encontrado' });
          }
          
          escuelas[editEscuelaIndex].docentes[docenteIndex] = updatedDocente;
        }

        await saveEscuelas(escuelas);
        return res.status(200).json({ 
          success: true, 
          data: updatedDocente,
          message: 'Docente actualizado correctamente' 
        });
      }

      case 'DELETE': {
        // Eliminar docente
        const { escuelaId: delEscuelaId, docenteId, titularId: delTitularId } = req.body;
        
        if (!delEscuelaId || !docenteId) {
          return res.status(400).json({ 
            error: 'Se requiere escuelaId y docenteId' 
          });
        }

        const delEscuelaIndex = escuelas.findIndex(e => e && e.id === delEscuelaId);
        if (delEscuelaIndex === -1) {
          return res.status(404).json({ error: 'Escuela no encontrada' });
        }

        if (delTitularId) {
          // Eliminar suplente
          const titularIndex = escuelas[delEscuelaIndex].docentes?.findIndex(d => d && d.id === delTitularId);
          if (titularIndex === -1 || titularIndex === undefined) {
            return res.status(404).json({ error: 'Titular no encontrado' });
          }
          
          if (escuelas[delEscuelaIndex].docentes[titularIndex].suplentes) {
            escuelas[delEscuelaIndex].docentes[titularIndex].suplentes = 
              escuelas[delEscuelaIndex].docentes[titularIndex].suplentes.filter(s => s && s.id !== docenteId);
          }
        } else {
          // Eliminar docente principal
          if (escuelas[delEscuelaIndex].docentes) {
            escuelas[delEscuelaIndex].docentes = 
              escuelas[delEscuelaIndex].docentes.filter(d => d && d.id !== docenteId);
          }
        }

        await saveEscuelas(escuelas);
        return res.status(200).json({ 
          success: true, 
          message: 'Docente eliminado correctamente' 
        });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Error en API docentes:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}