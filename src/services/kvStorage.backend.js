// Papiweb desarrollos informaticos
// src/services/kvStorage.backend.js
import { Redis } from '@upstash/redis';
import { 
  ESCUELAS_INICIALES, 
  USUARIOS_INICIALES, 
  ALERTAS_LEIDAS_INICIALES,
  ensureEscuelaStructure 
} from '../data/seedData.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN,
});

const KEYS = {
  ESCUELAS: 'acdm:escuelas',
  USUARIOS: 'acdm:usuarios',
  ALERTAS_LEIDAS: 'acdm:alertas:leidas',
  METADATA: 'acdm:metadata'
};

// ============================================================
// FUNCIONES PARA ALUMNOS (con el mismo patrón)
// ============================================================

/**
 * Obtener todos los alumnos de todas las escuelas
 */
export async function getAllAlumnos() {
  try {
    const escuelas = await getEscuelas();
    const todosAlumnos = [];
    
    escuelas.forEach(escuela => {
      if (escuela.alumnos && Array.isArray(escuela.alumnos)) {
        escuela.alumnos.forEach(alumno => {
          todosAlumnos.push({
            ...alumno,
            escuelaId: escuela.id,
            escuelaNombre: escuela.escuela
          });
        });
      }
    });
    
    return todosAlumnos;
  } catch (error) {
    console.error('Error getting all alumnos:', error);
    return [];
  }
}

/**
 * Obtener alumnos de una escuela específica
 */
export async function getAlumnosByEscuela(escuelaId) {
  try {
    const escuelas = await getEscuelas();
    const escuela = escuelas.find(e => e.id === escuelaId);
    
    if (!escuela) return [];
    
    return escuela.alumnos || [];
  } catch (error) {
    console.error('Error getting alumnos by escuela:', error);
    return [];
  }
}

/**
 * Obtener un alumno específico por ID (búsqueda global)
 */
export async function getAlumnoById(alumnoId) {
  try {
    const escuelas = await getEscuelas();
    
    for (const escuela of escuelas) {
      if (escuela.alumnos && Array.isArray(escuela.alumnos)) {
        const alumno = escuela.alumnos.find(a => a.id === alumnoId);
        if (alumno) {
          return {
            ...alumno,
            escuelaId: escuela.id,
            escuelaNombre: escuela.escuela
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting alumno by id:', error);
    return null;
  }
}

/**
 * Agregar un nuevo alumno a una escuela
 */
export async function addAlumno(escuelaId, alumnoData) {
  try {
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) return null;

    // Asegurar que exista el array de alumnos
    if (!escuelas[escuelaIndex].alumnos) {
      escuelas[escuelaIndex].alumnos = [];
    }

    // Crear nuevo alumno con ID único y timestamps
    const nuevoAlumno = {
      id: alumnoData.id || `a${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      gradoSalaAnio: alumnoData.gradoSalaAnio || '',
      nombre: alumnoData.nombre || '',
      diagnostico: alumnoData.diagnostico || '',
      observaciones: alumnoData.observaciones || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    escuelas[escuelaIndex].alumnos.push(nuevoAlumno);

    const guardado = await saveEscuelas(escuelas);
    
    return guardado ? nuevoAlumno : null;
  } catch (error) {
    console.error('Error adding alumno:', error);
    return null;
  }
}

/**
 * Actualizar un alumno existente (el patrón que mostraste)
 */
export async function updateAlumno(escuelaId, alumnoActualizado) {
  try {
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) return false;

    // Actualizamos el alumno dentro de la escuela encontrada
    const alumnos = escuelas[escuelaIndex].alumnos;
    const alumnoIndex = alumnos.findIndex(a => a.id === alumnoActualizado.id);
    
    if (alumnoIndex !== -1) {
      // Actualizar existente
      alumnos[alumnoIndex] = {
        ...alumnoActualizado,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Opcional: añadir si no existe (con ID generado)
      alumnos.push({
        ...alumnoActualizado,
        id: alumnoActualizado.id || `a${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return await saveEscuelas(escuelas);
  } catch (error) {
    console.error('Error updating alumno:', error);
    return false;
  }
}

/**
 * Eliminar un alumno
 */
export async function deleteAlumno(escuelaId, alumnoId) {
  try {
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) return false;

    const alumnosOriginales = escuelas[escuelaIndex].alumnos || [];
    escuelas[escuelaIndex].alumnos = alumnosOriginales.filter(a => a.id !== alumnoId);

    // Verificar si realmente se eliminó uno
    const seElimino = alumnosOriginales.length !== escuelas[escuelaIndex].alumnos.length;
    
    if (!seElimino) return false;

    return await saveEscuelas(escuelas);
  } catch (error) {
    console.error('Error deleting alumno:', error);
    return false;
  }
}

// ============================================================
// FUNCIONES PARA ESCUELAS (ya existentes, pero mejoradas)
// ============================================================

export async function getEscuelas() {
  try {
    const data = await redis.get(KEYS.ESCUELAS);
    const escuelas = data ? JSON.parse(data) : [];
    return Array.isArray(escuelas) ? escuelas.map(ensureEscuelaStructure) : [];
  } catch (error) {
    console.error('Error getting escuelas:', error);
    return [];
  }
}

export async function saveEscuelas(escuelas) {
  try {
    const escuelasCompletas = Array.isArray(escuelas) 
      ? escuelas.map(ensureEscuelaStructure)
      : [];
    await redis.set(KEYS.ESCUELAS, JSON.stringify(escuelasCompletas));
    return true;
  } catch (error) {
    console.error('Error saving escuelas:', error);
    return false;
  }
}

// ============================================================
// FUNCIONES PARA DOCENTES (similar a alumnos)
// ============================================================

export async function getAllDocentes() {
  try {
    const escuelas = await getEscuelas();
    const todosDocentes = [];
    
    escuelas.forEach(escuela => {
      if (escuela.docentes && Array.isArray(escuela.docentes)) {
        escuela.docentes.forEach(docente => {
          todosDocentes.push({
            ...docente,
            escuelaId: escuela.id,
            escuelaNombre: escuela.escuela
          });
        });
      }
    });
    
    return todosDocentes;
  } catch (error) {
    console.error('Error getting all docentes:', error);
    return [];
  }
}

export async function addDocente(escuelaId, docenteData, titularId = null) {
  try {
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) return null;

    // Crear nuevo docente
    const nuevoDocente = {
      id: docenteData.id || `d${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      cargo: docenteData.cargo || 'Titular',
      nombreApellido: docenteData.nombreApellido || '',
      estado: docenteData.estado || 'Activo',
      motivo: docenteData.motivo || '-',
      diasAutorizados: docenteData.diasAutorizados || 0,
      fechaInicioLicencia: docenteData.fechaInicioLicencia || null,
      fechaFinLicencia: docenteData.fechaFinLicencia || null,
      suplentes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (titularId) {
      // Agregar como suplente
      const titularIndex = escuelas[escuelaIndex].docentes.findIndex(d => d.id === titularId);
      if (titularIndex === -1) return null;
      
      if (!escuelas[escuelaIndex].docentes[titularIndex].suplentes) {
        escuelas[escuelaIndex].docentes[titularIndex].suplentes = [];
      }
      
      escuelas[escuelaIndex].docentes[titularIndex].suplentes.push(nuevoDocente);
    } else {
      // Agregar como docente principal
      if (!escuelas[escuelaIndex].docentes) {
        escuelas[escuelaIndex].docentes = [];
      }
      escuelas[escuelaIndex].docentes.push(nuevoDocente);
    }

    const guardado = await saveEscuelas(escuelas);
    return guardado ? nuevoDocente : null;
  } catch (error) {
    console.error('Error adding docente:', error);
    return null;
  }
}

// ============================================================
// FUNCIONES PARA USUARIOS
// ============================================================

export async function getUsuarios() {
  try {
    const data = await redis.get(KEYS.USUARIOS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting usuarios:', error);
    return [];
  }
}

export async function validateUser(username, password) {
  try {
    const usuarios = await getUsuarios();
    const passwordHash = typeof btoa === 'function' 
      ? btoa(password) 
      : Buffer.from(password).toString('base64');
    
    return usuarios.find(u => u.username === username && u.passwordHash === passwordHash);
  } catch (error) {
    console.error('Error validating user:', error);
    return null;
  }
}

// ============================================================
// INICIALIZACIÓN (con datos de seedData.js)
// ============================================================

export async function initializeKV() {
  try {
    const exists = await redis.exists(KEYS.ESCUELAS);
    const escuelasActuales = exists ? await getEscuelas() : [];
    
    if (!exists || escuelasActuales.length === 0) {
      console.log('📦 Cargando datos iniciales desde seedData...');
      const escuelasIniciales = ESCUELAS_INICIALES.map(ensureEscuelaStructure);

      await redis.pipeline()
        .set(KEYS.ESCUELAS, JSON.stringify(escuelasIniciales))
        .set(KEYS.USUARIOS, JSON.stringify(USUARIOS_INICIALES))
        .set(KEYS.ALERTAS_LEIDAS, JSON.stringify(ALERTAS_LEIDAS_INICIALES))
        .set(KEYS.METADATA, JSON.stringify({ 
          initializedAt: new Date().toISOString(),
          version: '1.0.0'
        }))
        .exec();

      console.log('✅ Datos iniciales cargados correctamente');
      return { success: true, count: escuelasIniciales.length, initialized: true };
    }
    
    console.log('✅ Base de datos ya tiene datos');
    return { success: true, count: escuelasActuales.length, initialized: false };
    
  } catch (error) {
    console.error('❌ Error en initializeKV:', error);
    return { success: false, error: error.message };
  }
}