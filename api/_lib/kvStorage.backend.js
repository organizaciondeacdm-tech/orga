// api/_lib/kvStorage.backend.js
import { ESCUELAS_INICIALES, USUARIOS_INICIALES } from './seedData.js';
import { Redis } from '@upstash/redis';

// Configurar Redis
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN,
});

const KEYS = {
  ESCUELAS: 'acdm:escuelas',
  USUARIOS: 'acdm:usuarios',
};

// --- FUNCIONES AUXILIARES DE PERSISTENCIA ---

export async function getEscuelas() {
  const data = await redis.get(KEYS.ESCUELAS);
  return data || ESCUELAS_INICIALES;
}

export async function saveEscuelas(escuelas) {
  await redis.set(KEYS.ESCUELAS, escuelas);
}

export async function getUsuarios() {
  const data = await redis.get(KEYS.USUARIOS);
  return data || USUARIOS_INICIALES;
}

export async function saveUsuarios(usuarios) {
  await redis.set(KEYS.USUARIOS, usuarios);
}

// Helper para simular hashing (Base64 seguro para entorno backend)
const encodePassword = (pw) => Buffer.from(pw).toString('base64');

// --- OPERACIONES DE USUARIOS ---

export async function addUsuario(nuevoUsuario) {
  const usuarios = await getUsuarios();
  const usuarioConHash = {
    ...nuevoUsuario,
    id: Date.now().toString(),
    passwordHash: encodePassword(nuevoUsuario.password || '123456')
  };
  delete usuarioConHash.password;
  usuarios.push(usuarioConHash);
  await saveUsuarios(usuarios);
  return usuarioConHash;
}

export async function updateUsuario(id, updates) {
  try {
    const usuarios = await getUsuarios();
    const index = usuarios.findIndex(u => u.id === id);
    
    if (index === -1) throw new Error('Usuario no encontrado');

    // Merge de updates
    usuarios[index] = { ...usuarios[index], ...updates };

    if (updates.password) {
      usuarios[index].passwordHash = encodePassword(updates.password);
      delete usuarios[index].password;
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
    const userToDelete = usuarios.find(u => u.id === id);
    
    if (userToDelete?.username === 'admin') {
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

// --- CONSULTAS AGREGADAS (DOCENTES Y ALUMNOS) ---

export async function getDocentes() {
  const escuelas = await getEscuelas();
  return escuelas.flatMap(escuela => 
    (escuela.docentes || []).map(d => ({
      ...d,
      escuelaId: escuela.id,
      escuelaNombre: escuela.escuela
    }))
  );
}

export async function getAlumnos() {
  const escuelas = await getEscuelas();
  return escuelas.flatMap(escuela => 
    (escuela.alumnos || []).map(a => ({
      ...a,
      escuelaId: escuela.id,
      escuelaNombre: escuela.escuela
    }))
  );
}

// Inicialización opcional
export async function initializeKV() {
  const exists = await redis.exists(KEYS.USUARIOS);
  if (!exists) {
    await saveEscuelas(ESCUELAS_INICIALES);
    await saveUsuarios(USUARIOS_INICIALES);
    return "KV Initialized";
  }
  return "KV already has data";
}

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
  getAlumnos,
};
