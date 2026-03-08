// src/data/seedData.js

// Función auxiliar para base64
export function safeBtoa(str) {
  if (typeof btoa === 'function') return btoa(str);
  return Buffer.from(str).toString('base64');
}

// 1. Datos iniciales de ESCUELAS (Estructura Unificada)
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
    alumnos: [
      {
        id: "a1",
        gradoSalaAnio: "3° Grado",
        nombre: "MARTÍNEZ, LUCÍA",
        diagnostico: "TEA Nivel 1",
        acdmId: "d1", // Asignado a López, María Elena
        observaciones: "Requiere acompañante en recreos"
      },
      {
        id: "a2",
        gradoSalaAnio: "3° Grado",
        nombre: "GARCÍA, TOMÁS",
        diagnostico: "TDAH",
        acdmId: "d2", // Asignado a Rodríguez, Carlos
        observaciones: "Medicación en horario escolar"
      }
    ],
    docentes: [
      {
        id: "d1",
        cargo: "Titular",
        nombreApellido: "LÓPEZ, MARÍA ELENA",
        estado: "Licencia",
        motivo: "Art. 102 - Enfermedad",
        fechaFinLicencia: "2025-02-14",
        suplentes: [
          { id: "s1", nombreApellido: "FERNÁNDEZ, ANA CLARA", estado: "Activo" }
        ]
      },
      {
        id: "d2",
        cargo: "Titular",
        nombreApellido: "RODRÍGUEZ, CARLOS",
        estado: "Activo",
        suplentes: []
      }
    ]
  },
  {
    id: "e2",
    de: "DE 02",
    escuela: "Jardín N°5 María Montessori",
    nivel: "Inicial",
    direccion: "Av. Santa Fe 567, CABA",
    alumnos: [
      {
        id: "a3",
        gradoSalaAnio: "Sala Roja",
        nombre: "PÉREZ, SANTIAGO",
        diagnostico: "Síndrome de Down",
        acdmId: "", // Sin asignar todavía
        observaciones: "Integración escolar plena"
      }
    ],
    docentes: [
      { id: "d3", nombreApellido: "GÓMEZ, PATRICIA", estado: "Activo", suplentes: [] }
    ]
  }
];

// 2. Datos iniciales de USUARIOS
export const USUARIOS_INICIALES = [
  { id: "u1", username: "admin", passwordHash: safeBtoa("admin2025"), rol: "admin" },
  { id: "u2", username: "viewer", passwordHash: safeBtoa("viewer123"), rol: "viewer" }
];

// 3. Objeto de Base de Datos inicial completo
export const INITIAL_DB = {
  escuelas: ESCUELAS_INICIALES,
  usuarios: USUARIOS_INICIALES,
  alertasLeidas: []
};

// Función para normalizar estructura y evitar errores de "undefined"
export function ensureEscuelaStructure(escuela) {
  return {
    ...escuela,
    id: escuela.id || `e${Date.now()}`,
    telefonos: Array.isArray(escuela.telefonos) ? escuela.telefonos : [],
    alumnos: Array.isArray(escuela.alumnos) ? escuela.alumnos : [],
    docentes: Array.isArray(escuela.docentes) ? escuela.docentes : []
  };
}

export default INITIAL_DB;
