// Este archivo SOLO se usa en el backend (API routes) para acceso directo a Redis
import { Redis } from '@upstash/redis';
// src/services/kvStorage.backend.js
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KEYS = {
  ESCUELAS: 'acdm:escuelas',
  USUARIOS: 'acdm:usuarios',
  ALERTAS_LEIDAS: 'acdm:alertas:leidas',
  METADATA: 'acdm:metadata'
};

// Datos iniciales actualizados con acdmMail y nuevos turnos
const INITIAL_DATA = {
  escuelas: [
    {
      id: "e1", de: "DE 01", escuela: "Escuela N°1 Julio Argentino Roca",
      nivel: "Primario", direccion: "Av. Corrientes 1234, CABA",
      lat: -34.6037, lng: -58.3816,
      telefonos: ["011-4321-1234"], mail: "escuela1@bue.edu.ar",
      acdmMail: "acdm.escuela1@bue.edu.ar", // ← NUEVO
      jornada: "Completa", turno: "SIMPLE MAÑANA Y TARDE", // ← ACTUALIZADO
      alumnos: [
        { id: "a1", gradoSalaAnio: "3° Grado", nombre: "Martínez, Lucía", diagnostico: "TEA Nivel 1", observaciones: "Requiere acompañante en recreos" },
        { id: "a2", gradoSalaAnio: "3° Grado", nombre: "García, Tomás", diagnostico: "TDAH", observaciones: "Medicación en horario escolar" },
      ],
      docentes: [
        {
          id: "d1", cargo: "Titular", nombreApellido: "López, María Elena",
          estado: "Licencia", motivo: "Art. 102 - Enfermedad",
          diasAutorizados: 30, fechaInicioLicencia: "2025-01-15", fechaFinLicencia: "2025-02-14",
          suplentes: [
            { id: "s1", cargo: "Suplente", nombreApellido: "Fernández, Ana Clara", estado: "Activo", motivo: "-", fechaIngreso: "2025-01-15" }
          ]
        },
        {
          id: "d2", cargo: "Titular", nombreApellido: "Rodríguez, Carlos",
          estado: "Activo", motivo: "-", diasAutorizados: 0,
          fechaInicioLicencia: null, fechaFinLicencia: null, suplentes: []
        }
      ]
    },
    {
      id: "e2", de: "DE 02", escuela: "Jardín de Infantes N°5 María Montessori",
      nivel: "Inicial", direccion: "Av. Santa Fe 567, CABA",
      lat: -34.5958, lng: -58.3975,
      telefonos: ["011-4765-5678", "011-4765-5679"], mail: "jardin5@bue.edu.ar",
      acdmMail: "acdm.jardin5@bue.edu.ar", // ← NUEVO
      jornada: "Simple", turno: "SIMPLE MAÑANA", // ← ACTUALIZADO
      alumnos: [
        { id: "a3", gradoSalaAnio: "Sala Roja", nombre: "Pérez, Santiago", diagnostico: "Síndrome de Down", observaciones: "Integración escolar plena" }
      ],
      docentes: [
        {
          id: "d3", cargo: "Titular", nombreApellido: "Gómez, Patricia",
          estado: "Activo", motivo: "-", diasAutorizados: 0,
          fechaInicioLicencia: null, fechaFinLicencia: null, suplentes: []
        }
      ]
    },
    {
      id: "e3", de: "DE 03", escuela: "Escuela Secundaria N°12 Domingo F. Sarmiento",
      nivel: "Secundario", direccion: "Calle Rivadavia 890, CABA",
      lat: -34.6158, lng: -58.4053,
      telefonos: ["011-4987-9012"], mail: "secundaria12@bue.edu.ar",
      acdmMail: "", // ← NUEVO
      jornada: "Completa", turno: "SIMPLE TARDE", // ← ACTUALIZADO
      alumnos: [],
      docentes: []
    }
  ],
  usuarios: [
    { id: "u1", username: "admin", passwordHash: btoa("admin2025"), rol: "admin" },
    { id: "u2", username: "viewer", passwordHash: btoa("viewer123"), rol: "viewer" }
  ],
  alertasLeidas: []
};

// Función auxiliar para asegurar la estructura de las escuelas
function ensureEscuelaStructure(escuela) {
  return {
    id: escuela.id || `e${Date.now()}`,
    de: escuela.de || '',
    escuela: escuela.escuela || '',
    nivel: escuela.nivel || 'Primario',
    direccion: escuela.direccion || '',
    lat: escuela.lat || null,
    lng: escuela.lng || null,
    telefonos: Array.isArray(escuela.telefonos) ? escuela.telefonos : [''],
    mail: escuela.mail || '',
    acdmMail: escuela.acdmMail || '', // ← NUEVO
    jornada: escuela.jornada || 'Simple',
    turno: escuela.turno || 'SIMPLE MAÑANA',
    alumnos: Array.isArray(escuela.alumnos) ? escuela.alumnos : [],
    docentes: Array.isArray(escuela.docentes) ? escuela.docentes : []
  };
}

// ============================================================
// INICIALIZACIÓN DE REDIS
// ============================================================

export async function initializeKV() {
  try {
    const exists = await redis.exists(KEYS.ESCUELAS);
    if (!exists) {
      // Guardar escuelas con estructura asegurada
      const escuelasIniciales = INITIAL_DATA.escuelas.map(ensureEscuelaStructure);
      await redis.set(KEYS.ESCUELAS, JSON.stringify(escuelasIniciales));
      await redis.set(KEYS.USUARIOS, JSON.stringify(INITIAL_DATA.usuarios));
      await redis.set(KEYS.ALERTAS_LEIDAS, JSON.stringify(INITIAL_DATA.alertasLeidas));
      await redis.set(KEYS.METADATA, JSON.stringify({ 
        initializedAt: new Date().toISOString(),
        version: '1.0.0'
      }));
      console.log('✅ Redis inicializado con datos de ejemplo actualizados');
    }
  } catch (error) {
    console.error('❌ Error inicializando Redis:', error);
  }
}

// ============================================================
// OPERACIONES PARA ESCUELAS
// ============================================================

export async function getEscuelas() {
  try {
    const data = await redis.get(KEYS.ESCUELAS);
    const escuelas = data ? JSON.parse(data) : [];
    // Asegurar estructura de cada escuela
    return Array.isArray(escuelas) ? escuelas.map(ensureEscuelaStructure) : [];
  } catch (error) {
    console.error('Error getting escuelas from Redis:', error);
    return [];
  }
}

export async function saveEscuelas(escuelas) {
  try {
    // Asegurar estructura de todas las escuelas
    const escuelasCompletas = Array.isArray(escuelas) 
      ? escuelas.map(ensureEscuelaStructure)
      : [];
    
    await redis.set(KEYS.ESCUELAS, JSON.stringify(escuelasCompletas));
    return true;
  } catch (error) {
    console.error('Error saving escuelas to Redis:', error);
    return false;
  }
}

// ============================================================
// OPERACIONES PARA USUARIOS
// ============================================================

export async function getUsuarios() {
  try {
    const data = await redis.get(KEYS.USUARIOS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting usuarios from Redis:', error);
    return [];
  }
}

// ============================================================
// OPERACIONES PARA DOCENTES (acceden a través de escuelas)
// ============================================================

export async function addDocenteToEscuela(escuelaId, docente, titularId = null) {
  try {
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) return { success: false, error: 'Escuela no encontrada' };
    
    const newDocente = {
      ...docente,
      id: docente.id || `d${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      suplentes: docente.suplentes || []
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
      // Agregar como docente principal
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
      if (suplenteIndex === -1 || suplenteIndex === undefined) {
        return { success: false, error: 'Suplente no encontrado' };
      }
      
      escuelas[escuelaIndex].docentes[titularIndex].suplentes[suplenteIndex] = updatedDocente;
    } else {
      // Actualizar docente principal
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
      // Eliminar docente principal
      escuelas[escuelaIndex].docentes = 
        escuelas[escuelaIndex].docentes.filter(d => d.id !== docenteId);
    }
    
    await saveEscuelas(escuelas);
    return { success: true };
  } catch (error) {
    console.error('Error deleting docente:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// FUNCIÓN PARA MIGRAR DATOS ANTIGUOS (ejecutar una vez)
// ============================================================

export async function migrateOldData() {
  try {
    const escuelas = await getEscuelas();
    let modified = false;
    
    const escuelasMigradas = escuelas.map(escuela => {
      const nuevaEscuela = { ...escuela };
      
      // Agregar acdmMail si no existe
      if (!nuevaEscuela.acdmMail) {
        nuevaEscuela.acdmMail = '';
        modified = true;
      }
      
      // Actualizar turno al nuevo formato si es necesario
      if (nuevaEscuela.turno === 'Mañana') {
        nuevaEscuela.turno = 'SIMPLE MAÑANA';
        modified = true;
      } else if (nuevaEscuela.turno === 'Tarde') {
        nuevaEscuela.turno = 'SIMPLE TARDE';
        modified = true;
      } else if (nuevaEscuela.turno === 'Mañana y Tarde' || nuevaEscuela.turno === 'Mañana/Tarde') {
        nuevaEscuela.turno = 'SIMPLE MAÑANA Y TARDE';
        modified = true;
      }
      
      return nuevaEscuela;
    });
    
    if (modified) {
      await saveEscuelas(escuelasMigradas);
      console.log('✅ Datos migrados al nuevo formato');
    }
    
    return { success: true, migrated: modified };
  } catch (error) {
    console.error('Error migrating data:', error);
    return { success: false, error: error.message };
  }
}