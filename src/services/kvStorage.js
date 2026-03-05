import { kv } from '@vercel/kv';
// Papiweb desarrollos informaticos
// Claves para almacenar diferentes tipos de datos
const KEYS = {
  ESCUELAS: 'acdm:escuelas',
  USUARIOS: 'acdm:usuarios',
  ALERTAS_LEIDAS: 'acdm:alertas:leidas',
  METADATA: 'acdm:metadata'
};

// Inicializar con datos por defecto si no existen
export async function initializeKV() {
  try {
    const exists = await kv.exists(KEYS.ESCUELAS);
    if (!exists) {
      // Tus datos iniciales de ejemplo
      const initialData = {
        escuelas: [
          {
            id: "e1", de: "DE 01", escuela: "Escuela N°1 Julio Argentino Roca",
            nivel: "Primario", direccion: "Av. Corrientes 1234, CABA",
            lat: -34.6037, lng: -58.3816,
            telefonos: ["011-4321-1234"], mail: "escuela1@bue.edu.ar",
            jornada: "Completa", turno: "Mañana",
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
                  { id: "s1", cargo: "Suplente", nombreApellido: "Fernández, Ana Clara", estado: "Activo", fechaIngreso: "2025-01-15" }
                ]
              }
            ]
          }
        ],
        usuarios: [
          { id: "u1", username: "admin", passwordHash: btoa("admin2025"), rol: "admin" },
          { id: "u2", username: "viewer", passwordHash: btoa("viewer123"), rol: "viewer" }
        ],
        alertasLeidas: []
      };
      
      await kv.set(KEYS.ESCUELAS, initialData.escuelas);
      await kv.set(KEYS.USUARIOS, initialData.usuarios);
      await kv.set(KEYS.ALERTAS_LEIDAS, initialData.alertasLeidas);
      await kv.set(KEYS.METADATA, { 
        initializedAt: new Date().toISOString(),
        version: '1.0.0'
      });
      
      console.log('✅ KV inicializado con datos de ejemplo');
    }
  } catch (error) {
    console.error('❌ Error inicializando KV:', error);
  }
}

// Operaciones CRUD para Escuelas
export async function getEscuelas() {
  try {
    return await kv.get(KEYS.ESCUELAS) || [];
  } catch (error) {
    console.error('Error getting escuelas:', error);
    return [];
  }
}

export async function getEscuela(id) {
  const escuelas = await getEscuelas();
  return escuelas.find(e => e.id === id);
}

export async function saveEscuela(escuela) {
  const escuelas = await getEscuelas();
  const index = escuelas.findIndex(e => e.id === escuela.id);
  
  if (index >= 0) {
    // Actualizar existente
    escuelas[index] = { ...escuelas[index], ...escuela, updatedAt: new Date().toISOString() };
  } else {
    // Crear nuevo
    const newEscuela = {
      ...escuela,
      id: escuela.id || `e${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      alumnos: escuela.alumnos || [],
      docentes: escuela.docentes || []
    };
    escuelas.push(newEscuela);
  }
  
  await kv.set(KEYS.ESCUELAS, escuelas);
  return escuela;
}

export async function deleteEscuela(id) {
  const escuelas = await getEscuelas();
  const filtered = escuelas.filter(e => e.id !== id);
  await kv.set(KEYS.ESCUELAS, filtered);
  return true;
}

// Operaciones para Docentes
export async function addDocente(escuelaId, docente, titularId = null) {
  const escuelas = await getEscuelas();
  const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
  
  if (escuelaIndex === -1) return null;
  
  const newDocente = {
    ...docente,
    id: docente.id || `d${Date.now()}`,
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
    
    escuelas[escuelaIndex].docentes[titularIndex].suplentes.push(newDocente);
  } else {
    // Agregar como docente
    escuelas[escuelaIndex].docentes.push(newDocente);
  }
  
  await kv.set(KEYS.ESCUELAS, escuelas);
  return newDocente;
}

// Operaciones para Alumnos
export async function addAlumno(escuelaId, alumno) {
  const escuelas = await getEscuelas();
  const escuelaIndex = escuelas.findIndex(e => e.id === escuelaId);
  
  if (escuelaIndex === -1) return null;
  
  const newAlumno = {
    ...alumno,
    id: alumno.id || `a${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  if (!escuelas[escuelaIndex].alumnos) {
    escuelas[escuelaIndex].alumnos = [];
  }
  
  escuelas[escuelaIndex].alumnos.push(newAlumno);
  await kv.set(KEYS.ESCUELAS, escuelas);
  return newAlumno;
}

// Operaciones para Usuarios
export async function getUsuarios() {
  return await kv.get(KEYS.USUARIOS) || [];
}

export async function validateUser(username, password) {
  const usuarios = await getUsuarios();
  return usuarios.find(u => u.username === username && u.passwordHash === btoa(password));
}

// Estadísticas
export async function getEstadisticas() {
  const escuelas = await getEscuelas();
  
  return {
    totalEscuelas: escuelas.length,
    totalAlumnos: escuelas.reduce((acc, e) => acc + (e.alumnos?.length || 0), 0),
    totalDocentes: escuelas.reduce((acc, e) => acc + (e.docentes?.length || 0), 0),
    docentesLicencia: escuelas.reduce((acc, e) => 
      acc + (e.docentes?.filter(d => d.estado === "Licencia").length || 0), 0),
    sinAcdm: escuelas.filter(e => !e.docentes?.length).length,
  };
}