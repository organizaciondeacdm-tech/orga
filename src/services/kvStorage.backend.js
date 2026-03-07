// src/services/kvStorage.backend.js
import { Redis } from '@upstash/redis';

// Configurar Redis (con fallback a STORAGE_)
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

// Función auxiliar para base64
function safeBtoa(str) {
  if (typeof btoa === 'function') {
    return btoa(str);
  }
  return Buffer.from(str).toString('base64');
}

// Datos iniciales
const INITIAL_DATA = {
  escuelas: [
    {
      id: "e1", de: "DE 01", escuela: "Escuela N°1 Julio Argentino Roca",
      nivel: "Primario", direccion: "Av. Corrientes 1234, CABA",
      lat: -34.6037, lng: -58.3816,
      telefonos: ["011-4321-1234"], mail: "escuela1@bue.edu.ar",
      acdmMail: "acdm.escuela1@bue.edu.ar",
      jornada: "Completa", turno: "SIMPLE MAÑANA Y TARDE",
      alumnos: [],
      docentes: []
    },
    {
      id: "e2", de: "DE 02", escuela: "Jardín de Infantes N°5 María Montessori",
      nivel: "Inicial", direccion: "Av. Santa Fe 567, CABA",
      lat: -34.5958, lng: -58.3975,
      telefonos: ["011-4765-5678", "011-4765-5679"], mail: "jardin5@bue.edu.ar",
      acdmMail: "acdm.jardin5@bue.edu.ar",
      jornada: "Simple", turno: "SIMPLE MAÑANA",
      alumnos: [],
      docentes: []
    },
    {
      id: "e3", de: "DE 03", escuela: "Escuela Secundaria N°12 Domingo F. Sarmiento",
      nivel: "Secundario", direccion: "Calle Rivadavia 890, CABA",
      lat: -34.6158, lng: -58.4053,
      telefonos: ["011-4987-9012"], mail: "secundaria12@bue.edu.ar",
      acdmMail: "",
      jornada: "Completa", turno: "SIMPLE TARDE",
      alumnos: [],
      docentes: []
    }
  ],
  usuarios: [
    { id: "u1", username: "admin", passwordHash: safeBtoa("admin2025"), rol: "admin" },
    { id: "u2", username: "viewer", passwordHash: safeBtoa("viewer123"), rol: "viewer" }
  ],
  alertasLeidas: []
};

// Función para asegurar estructura de escuelas
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
    acdmMail: escuela.acdmMail || '',
    jornada: escuela.jornada || 'Simple',
    turno: escuela.turno || 'SIMPLE MAÑANA',
    alumnos: Array.isArray(escuela.alumnos) ? escuela.alumnos : [],
    docentes: Array.isArray(escuela.docentes) ? escuela.docentes : []
  };
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

export async function initializeKV() {
  try {
    const exists = await redis.exists(KEYS.ESCUELAS);
    if (!exists) {
      console.log('📦 Cargando datos iniciales...');
      const escuelasIniciales = INITIAL_DATA.escuelas.map(ensureEscuelaStructure);

      await redis.pipeline()
        .set(KEYS.ESCUELAS, JSON.stringify(escuelasIniciales))
        .set(KEYS.USUARIOS, JSON.stringify(INITIAL_DATA.usuarios))
        .set(KEYS.ALERTAS_LEIDAS, JSON.stringify(INITIAL_DATA.alertasLeidas))
        .set(KEYS.METADATA, JSON.stringify({ 
          initializedAt: new Date().toISOString(),
          version: '1.0.0'
        }))
        .exec();

      console.log('✅ Datos iniciales cargados');
      return { success: true, count: escuelasIniciales.length };
    }
    return { success: true, status: 'already_exists' };
  } catch (error) {
    console.error('❌ Error en initializeKV:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// OPERACIONES PARA ESCUELAS
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
// OPERACIONES PARA USUARIOS (COMPLETAS)
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

export async function saveUsuarios(usuarios) {
  try {
    await redis.set(KEYS.USUARIOS, JSON.stringify(usuarios));
    return true;
  } catch (error) {
    console.error('Error saving usuarios:', error);
    return false;
  }
}

export async function addUsuario(usuarioData) {
  try {
    const usuarios = await getUsuarios();
    
    // Verificar si ya existe
    if (usuarios.some(u => u.username === usuarioData.username)) {
      throw new Error('El nombre de usuario ya existe');
    }

    const nuevoUsuario = {
      id: `u${Date.now()}`,
      username: usuarioData.username,
      passwordHash: safeBtoa(usuarioData.password),
      rol: usuarioData.rol || 'viewer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    usuarios.push(nuevoUsuario);
    await saveUsuarios(usuarios);
    
    const { passwordHash, ...usuarioPublic } = nuevoUsuario;
    return usuarioPublic;
  } catch (error) {
    console.error('Error adding usuario:', error);
    throw error;
  }
}

export async function updateUsuario(id, updates) {
  try {
    const usuarios = await getUsuarios();
    const index = usuarios.findIndex(u => u.id === id);
    
    if (index === -1) {
      throw new Error('Usuario no encontrado');
    }

    // No permitir cambiar el username del admin principal
    if (usuarios[index].username === 'admin' && updates.username && updates.username !== 'admin') {
      throw new Error('No se puede cambiar el nombre del usuario admin');
    }

    usuarios[index] = {
      ...usuarios[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Si se actualiza la contraseña
    if (updates.password) {
      usuarios[index].passwordHash = safeBtoa(updates.password);
    }

    await saveUsuarios(usuarios);
    
    const { passwordHash, ...usuarioPublic } = usuarios[index];
    return usuarioPublic;
  } catch (error) {
    console.error('Error updating usuario:', error);
    throw error;
  }
}

export async function deleteUsuario(id) {
  try {
    const usuarios = await getUsuarios();
    
    // No permitir eliminar al admin principal
    const adminUser = usuarios.find(u => u.id === id);
    if (adminUser?.username === 'admin') {
      throw new Error('No se puede eliminar el usuario admin principal');
    }

    const nuevosUsuarios = usuarios.filter(u => u.id !== id);
    await saveUsuarios(nuevosUsuarios);
    return true;
  } catch (error) {
    console.error('Error deleting usuario:', error);
    throw error;
  }
}

// ============================================================
// OPERACIONES PARA DOCENTES (básicas)
// ============================================================

export async function getDocentes() {
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
    console.error('Error getting docentes:', error);
    return [];
  }
}

// ============================================================
// OPERACIONES PARA ALUMNOS (básicas)
// ============================================================

export async function getAlumnos() {
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
    console.error('Error getting alumnos:', error);
    return [];
  }
}

// Exportaciones por defecto
export default {
  initializeKV,
  getEscuelas,
  saveEscuelas,
  getUsuarios,
  saveUsuarios,
  addUsuario,
  updateUsuario,
  deleteUsuario,
  getDocentes,
  getAlumnos
};