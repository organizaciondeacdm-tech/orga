// src/services/kvStorage.client.js
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
    alumnos: Array.isArray(escuela.alumnos) ? escuela.alumnos : [],
    docentes: Array.isArray(escuela.docentes) ? escuela.docentes : [],
    telefonos: Array.isArray(escuela.telefonos) ? escuela.telefonos : ['']
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
// OPERACIONES PARA ALUMNOS
// ============================================================

export async function addAlumnoToEscuela(escuelaId, alumno) {
  try {
    // Primero obtener escuelas actuales
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) {
      return { success: false, error: 'Escuela no encontrada' };
    }
    
    // Agregar nuevo alumno
    const newAlumno = {
      ...alumno,
      id: alumno.id || `a${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    escuelas[escuelaIndex].alumnos.push(newAlumno);
    
    // Guardar cambios
    const saved = await saveEscuelas(escuelas);
    
    return saved 
      ? { success: true, data: newAlumno }
      : { success: false, error: 'Error al guardar' };
      
  } catch (error) {
    console.error('Error adding alumno:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAlumnoInEscuela(escuelaId, alumno) {
  try {
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) {
      return { success: false, error: 'Escuela no encontrada' };
    }
    
    const alumnoIndex = escuelas[escuelaIndex].alumnos.findIndex(a => a.id === alumno.id);
    
    if (alumnoIndex === -1) {
      return { success: false, error: 'Alumno no encontrado' };
    }
    
    escuelas[escuelaIndex].alumnos[alumnoIndex] = {
      ...alumno,
      updatedAt: new Date().toISOString()
    };
    
    const saved = await saveEscuelas(escuelas);
    
    return saved 
      ? { success: true, data: escuelas[escuelaIndex].alumnos[alumnoIndex] }
      : { success: false, error: 'Error al guardar' };
      
  } catch (error) {
    console.error('Error updating alumno:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAlumnoFromEscuela(escuelaId, alumnoId) {
  try {
    const escuelas = await getEscuelas();
    const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
    
    if (escuelaIndex === -1) {
      return { success: false, error: 'Escuela no encontrada' };
    }
    
    escuelas[escuelaIndex].alumnos = escuelas[escuelaIndex].alumnos.filter(a => a.id !== alumnoId);
    
    const saved = await saveEscuelas(escuelas);
    
    return saved 
      ? { success: true }
      : { success: false, error: 'Error al guardar' };
      
  } catch (error) {
    console.error('Error deleting alumno:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

export async function initializeKV() {
  console.log('📦 KV Client inicializado - Listo para usar APIs');
  
  // Opcional: Verificar conexión con las APIs
  try {
    const escuelas = await getEscuelas();
    console.log(`✅ Conexión exitosa - ${escuelas.length} escuelas cargadas`);
    return true;
  } catch (error) {
    console.warn('⚠️ No se pudo verificar conexión con APIs');
    return true; // Igual devolvemos true para no bloquear la app
  }
}