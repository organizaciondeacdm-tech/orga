// api/_lib/kvStorage.backend.js
import { Redis } from '@upstash/redis';
import { 
  ESCUELAS_INICIALES, 
  USUARIOS_INICIALES,
  ensureEscuelaStructure 
} from './seedData.js';

// Configurar Redis
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN,
});

const KEYS = {
  ESCUELAS: 'acdm:escuelas',
  USUARIOS: 'acdm:usuarios',
};

// ============================================================
// OPERACIONES PARA ESCUELAS
// ============================================================

export async function getEscuelas() {
  try {
    const data = await redis.get(KEYS.ESCUELAS);
    if (!data) return ESCUELAS_INICIALES;
    
    // Si data es string, parsearlo
    const escuelas = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(escuelas) ? escuelas.map(ensureEscuelaStructure) : [];
  } catch (error) {
    console.error('Error getting escuelas:', error);
    return ESCUELAS_INICIALES;
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
// OPERACIONES PARA USUARIOS
// ============================================================

export async function getUsuarios() {
  try {
    const data = await redis.get(KEYS.USUARIOS);
    if (!data) return USUARIOS_INICIALES;
    
    // Si data es string, parsearlo
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error('Error getting usuarios:', error);
    return USUARIOS_INICIALES;
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
      passwordHash: Buffer.from(usuarioData.password).toString('base64'),
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
      usuarios[index].passwordHash = Buffer.from(updates.password).toString('base64');
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
// INICIALIZACIÓN
// ============================================================

export async function initializeKV() {
  try {
    const exists = await redis.exists(KEYS.ESCUELAS);
    if (!exists) {
      const escuelasIniciales = ESCUELAS_INICIALES.map(ensureEscuelaStructure);
      await redis.set(KEYS.ESCUELAS, JSON.stringify(escuelasIniciales));
      await redis.set(KEYS.USUARIOS, JSON.stringify(USUARIOS_INICIALES));
      console.log('✅ Datos iniciales cargados');
    }
    return true;
  } catch (error) {
    console.error('Error initializing KV:', error);
    return false;
  }
}