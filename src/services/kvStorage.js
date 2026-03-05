// Este archivo ahora SOLO contiene las funciones de ayuda
// Las operaciones reales se hacen vía API

// Función auxiliar para llamar a las APIs
const API_BASE = '';

export async function getEscuelas() {
  const res = await fetch(`${API_BASE}/api/kv/escuelas`);
  return res.json();
}

export async function saveEscuelas(escuelas) {
  await fetch(`${API_BASE}/api/kv/escuelas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ escuelas })
  });
}

export async function getUsuarios() {
  const res = await fetch(`${API_BASE}/api/kv/usuarios`);
  return res.json();
}

export async function initializeKV() {
  // Esta función ya no es necesaria en el frontend
  // La inicialización la hace el servidor automáticamente
  console.log('KV inicializado en el servidor');
}

// Las funciones de docentes ahora también usan fetch
export async function addDocenteToEscuela(escuelaId, docente, titularId) {
  const res = await fetch(`${API_BASE}/api/kv/docentes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ escuelaId, docente, titularId })
  });
  return res.json();
}

export async function updateDocenteInEscuela(escuelaId, docente, titularId) {
  const res = await fetch(`${API_BASE}/api/kv/docentes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ escuelaId, docente, titularId })
  });
  return res.json();
}

export async function deleteDocenteFromEscuela(escuelaId, docenteId, titularId) {
  const res = await fetch(`${API_BASE}/api/kv/docentes`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ escuelaId, docenteId, titularId })
  });
  return res.json();
}