// src/data/seedData.js

export function safeBtoa(str) {
  if (typeof btoa === 'function') return btoa(str);
  return Buffer.from(str).toString('base64');
}

export const ESCUELAS_INICIALES = [
  {
    id: "e1",
    de: "DE 01",
    escuela: "Escuela N°1 Julio Argentino Roca",
    nivel: "Primario",
    direccion: "Av. Corrientes 1234, CABA",
    lat: -34.6037,
    lng: -58.3816,
    telefonos: ["011-4321-1234"],
    mail: "escuela1@bue.edu.ar",
    acdmMail: "acdm.escuela1@bue.edu.ar",
    jornada: "Completa",
    turno: "SIMPLE MAÑANA Y TARDE",
    // --- GESTIÓN DE ALUMNOS ---
    alumnos: [
      {
        id: "a1",
        gradoSalaAnio: "3° Grado",
        nombre: "MARTÍNEZ, LUCÍA",
        diagnostico: "TEA Nivel 1",
        acdmId: "d1",
        observaciones: "Requiere acompañante en recreos"
      }
    ],
    // --- GESTIÓN DE PERSONAL ---
    docentes: [
      {
        id: "d1",
        cargo: "Titular",
        nombreApellido: "LÓPEZ, MARÍA ELENA",
        estado: "Activo",
        suplentes: []
      }
    ],
    // --- NUEVOS MÓDULOS DE SEGUIMIENTO ---
    visitas: [
      {
        id: "v1",
        fecha: "2026-03-08",
        acdmId: "d1",
        acdmNombre: "LÓPEZ, MARÍA ELENA",
        observacion: "Se trabajó en la adaptación de materiales. El alumno responde bien.",
        tipo: "seguimiento",
        adjuntos: []
      }
    ],
    proyectos: [
      {
        id: "p1",
        nombre: "Adaptación de materiales táctiles",
        descripcion: "Creación de materiales didácticos adaptados",
        acdmResponsable: "d1",
        fechaInicio: "2026-03-01",
        fechaEntrega: "2026-04-15",
        estado: "en_progreso",
        avance: 65
      }
    ],
    informes: [
      {
        id: "i1",
        titulo: "Informe mensual Marzo 2026",
        acdmId: "d1",
        fechaEntrega: "2026-03-31",
        contenido: "Resumen de actividades realizadas...",
        estado: "entregado"
      }
    ]
  }
];

export const USUARIOS_INICIALES = [
  { id: "u1", username: "admin", passwordHash: safeBtoa("admin2025"), rol: "admin" },
  { id: "u2", username: "viewer", passwordHash: safeBtoa("viewer123"), rol: "viewer" }
];

export const INITIAL_DB = {
  escuelas: ESCUELAS_INICIALES,
  usuarios: USUARIOS_INICIALES,
  alertasLeidas: []
};

// Función crítica para asegurar que las escuelas nuevas o editadas tengan los arrays listos
export function ensureEscuelaStructure(escuela) {
  return {
    ...escuela,
    id: escuela.id || `e${Date.now()}`,
    telefonos: Array.isArray(escuela.telefonos) ? escuela.telefonos : [],
    alumnos: Array.isArray(escuela.alumnos) ? escuela.alumnos : [],
    docentes: Array.isArray(escuela.docentes) ? escuela.docentes : [],
    visitas: Array.isArray(escuela.visitas) ? escuela.visitas : [],
    proyectos: Array.isArray(escuela.proyectos) ? escuela.proyectos : [],
    informes: Array.isArray(escuela.informes) ? escuela.informes : []
  };
}

export default INITIAL_DB;
