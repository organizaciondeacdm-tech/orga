// src/services/kvStorage.js
// Este archivo SOLO contiene las funciones de ayuda para el frontend
// Las operaciones reales se hacen vía API

const API_BASE = '';

// Función auxiliar para asegurar la estructura de las escuelas
function ensureEscuelaStructure(escuela) {
  return {
    ...escuela,
    acdmMail: escuela.acdmMail || '',
    jornada: escuela.jornada || 'Simple',
    turno: escuela.turno || 'SIMPLE MAÑANA',
    // Asegurar que existan estos arrays
    alumnos: escuela.alumnos || [],
    docentes: escuela.docentes || [],
    telefonos: escuela.telefonos || ['']
  };
}

// ============================================================
// OPERACIONES PARA ESCUELAS
// ============================================================

export async function getEscuelas() {
  try {
    const res = await fetch(`${API_BASE}/api/kv/escuelas`);
    if (!res.ok) {
      console.error('Error fetching escuelas:', res.status);
      return [];
    }
    const escuelas = await res.json();
    // Asegurar estructura de cada escuela
    return Array.isArray(escuelas) ? escuelas.map(ensureEscuelaStructure) : [];
  } catch (error) {
    console.error('Error getting escuelas:', error);
    return [];
  }
}

export async function saveEscuelas(escuelas) {
  try {
    // Asegurar que todas las escuelas tengan la estructura completa
    const escuelasCompletas = Array.isArray(escuelas) 
      ? escuelas.map(ensureEscuelaStructure)
      : [];

    const res = await fetch(`${API_BASE}/api/kv/escuelas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escuelas: escuelasCompletas })
    });
    
    if (!res.ok) {
      console.error('Error saving escuelas:', res.status);
      return false;
    }
    
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
    const res = await fetch(`${API_BASE}/api/kv/usuarios`);
    if (!res.ok) {
      console.error('Error fetching usuarios:', res.status);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error getting usuarios:', error);
    return [];
  }
}

// ============================================================
// OPERACIONES PARA DOCENTES
// ============================================================

export async function addDocenteToEscuela(escuelaId, docente, titularId) {
  try {
    const res = await fetch(`${API_BASE}/api/kv/docentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escuelaId, docente, titularId })
    });
    
    if (!res.ok) {
      console.error('Error adding docente:', res.status);
      return { success: false, error: 'Error en la petición' };
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error adding docente:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDocenteInEscuela(escuelaId, docente, titularId) {
  try {
    const res = await fetch(`${API_BASE}/api/kv/docentes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escuelaId, docente, titularId })
    });
    
    if (!res.ok) {
      console.error('Error updating docente:', res.status);
      return { success: false, error: 'Error en la petición' };
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error updating docente:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDocenteFromEscuela(escuelaId, docenteId, titularId) {
  try {
    const res = await fetch(`${API_BASE}/api/kv/docentes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escuelaId, docenteId, titularId })
    });
    
    if (!res.ok) {
      console.error('Error deleting docente:', res.status);
      return { success: false, error: 'Error en la petición' };
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error deleting docente:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// OPERACIONES PARA ALUMNOS (similares a docentes)
// ============================================================

export async function addAlumnoToEscuela(escuelaId, alumno) {
  // Esta función debería implementarse si existe el endpoint correspondiente
  console.warn('addAlumnoToEscuela no implementado en API');
  return { success: false, error: 'No implementado' };
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

export async function initializeKV() {
  console.log('📦 KV inicializado - Cliente listo para usar APIs');
  return true;
}