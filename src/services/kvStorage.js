import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const KEYS = {
  ESCUELAS: 'acdm:escuelas',
  USUARIOS: 'acdm:usuarios',
  ALERTAS_LEIDAS: 'acdm:alertas:leidas',
  METADATA: 'acdm:metadata'
};

// Datos iniciales (mismos que antes)
const INITIAL_DATA = {
  escuelas: [/* tus escuelas */],
  usuarios: [
    { id: "u1", username: "admin", passwordHash: btoa("admin2025"), rol: "admin" },
    { id: "u2", username: "viewer", passwordHash: btoa("viewer123"), rol: "viewer" }
  ],
  alertasLeidas: []
};

export async function initializeKV() {
  try {
    const exists = await redis.exists(KEYS.ESCUELAS);
    if (!exists) {
      await redis.set(KEYS.ESCUELAS, JSON.stringify(INITIAL_DATA.escuelas));
      await redis.set(KEYS.USUARIOS, JSON.stringify(INITIAL_DATA.usuarios));
      await redis.set(KEYS.ALERTAS_LEIDAS, JSON.stringify(INITIAL_DATA.alertasLeidas));
      await redis.set(KEYS.METADATA, JSON.stringify({ 
        initializedAt: new Date().toISOString(),
        version: '1.0.0'
      }));
      console.log('✅ Redis inicializado con datos de ejemplo');
    }
  } catch (error) {
    console.error('❌ Error inicializando Redis:', error);
  }
}

export async function getEscuelas() {
  try {
    const data = await redis.get(KEYS.ESCUELAS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting escuelas:', error);
    return [];
  }
}

export async function saveEscuelas(escuelas) {
  try {
    await redis.set(KEYS.ESCUELAS, JSON.stringify(escuelas));
    return true;
  } catch (error) {
    console.error('Error saving escuelas:', error);
    return false;
  }
}

export async function getUsuarios() {
  try {
    const data = await redis.get(KEYS.USUARIOS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting usuarios:', error);
    return [];
  }
}
// ============================================================
// OPERACIONES PARA DOCENTES
// ============================================================

// Obtener todos los docentes de todas las escuelas (opcional)
export async function getTodosLosDocentes() {
  try {
    const escuelas = await getEscuelas();
    const todosDocentes = [];
    
    escuelas.forEach(escuela => {
      escuela.docentes.forEach(docente => {
        todosDocentes.push({
          ...docente,
          escuelaId: escuela.id,
          escuelaNombre: escuela.escuela
        });
        
        // También agregar suplentes
        if (docente.suplentes && docente.suplentes.length > 0) {
          docente.suplentes.forEach(suplente => {
            todosDocentes.push({
              ...suplente,
              escuelaId: escuela.id,
              escuelaNombre: escuela.escuela,
              esSuplenteDe: docente.id,
              titularNombre: docente.nombreApellido
            });
          });
        }
      });
    });
    
    return todosDocentes;
  } catch (error) {
    console.error('Error getting all docentes:', error);
    return [];
  }
}

// Función específica para agregar docente a una escuela
export async function addDocenteToEscuela(escuelaId, docente, titularId = null) {
  try {
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) return { success: false, error: 'Escuela no encontrada' };
    
    const newDocente = {
      ...docente,
      id: docente.id || `d${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (titularId) {
      // Agregar como suplente
      const titularIndex = escuelas[escuelaIndex].docentes.findIndex(d => d.id === titularId);
      if (titularIndex === -1) return { success: false, error: 'Titular no encontrado' };
      
      if (!escuelas[escuelaIndex].docentes[titularIndex].suplentes) {
        escuelas[escuelaIndex].docentes[titularIndex].suplentes = [];
      }
      
      escuelas[escuelaIndex].docentes[titularIndex].suplentes.push(newDocente);
    } else {
      // Agregar como docente
      if (!escuelas[escuelaIndex].docentes) {
        escuelas[escuelaIndex].docentes = [];
      }
      escuelas[escuelaIndex].docentes.push(newDocente);
    }
    
    await saveEscuelas(escuelas);
    return { success: true, data: newDocente };
  } catch (error) {
    console.error('Error adding docente:', error);
    return { success: false, error: error.message };
  }
}

// Actualizar docente existente
export async function updateDocenteInEscuela(escuelaId, docente, titularId = null) {
  try {
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) return { success: false, error: 'Escuela no encontrada' };
    
    const updatedDocente = {
      ...docente,
      updatedAt: new Date().toISOString()
    };
    
    if (titularId) {
      // Actualizar suplente
      const titularIndex = escuelas[escuelaIndex].docentes.findIndex(d => d.id === titularId);
      if (titularIndex === -1) return { success: false, error: 'Titular no encontrado' };
      
      const suplenteIndex = escuelas[escuelaIndex].docentes[titularIndex].suplentes?.findIndex(s => s.id === docente.id);
      if (suplenteIndex === -1 || suplenteIndex === undefined) return { success: false, error: 'Suplente no encontrado' };
      
      escuelas[escuelaIndex].docentes[titularIndex].suplentes[suplenteIndex] = updatedDocente;
    } else {
      // Actualizar docente
      const docenteIndex = escuelas[escuelaIndex].docentes.findIndex(d => d.id === docente.id);
      if (docenteIndex === -1) return { success: false, error: 'Docente no encontrado' };
      
      escuelas[escuelaIndex].docentes[docenteIndex] = updatedDocente;
    }
    
    await saveEscuelas(escuelas);
    return { success: true, data: updatedDocente };
  } catch (error) {
    console.error('Error updating docente:', error);
    return { success: false, error: error.message };
  }
}

// Eliminar docente
export async function deleteDocenteFromEscuela(escuelaId, docenteId, titularId = null) {
  try {
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) return { success: false, error: 'Escuela no encontrada' };
    
    if (titularId) {
      // Eliminar suplente
      const titularIndex = escuelas[escuelaIndex].docentes.findIndex(d => d.id === titularId);
      if (titularIndex === -1) return { success: false, error: 'Titular no encontrado' };
      
      escuelas[escuelaIndex].docentes[titularIndex].suplentes = 
        escuelas[escuelaIndex].docentes[titularIndex].suplentes?.filter(s => s.id !== docenteId) || [];
    } else {
      // Eliminar docente
      escuelas[escuelaIndex].docentes = escuelas[escuelaIndex].docentes.filter(d => d.id !== docenteId);
    }
    
    await saveEscuelas(escuelas);
    return { success: true };
  } catch (error) {
    console.error('Error deleting docente:', error);
    return { success: false, error: error.message };
  }
}