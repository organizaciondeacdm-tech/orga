// src/data/seedData.js
// Datos iniciales para la aplicación ACDM
// Función auxiliar para asegurar que los datos no tengan nulos críticos
export function ensureEscuelaStructure(escuela) {
  return {
    ...escuela,
    acdmMail: escuela.acdmMail || '',
    jornada: escuela.jornada || 'Simple',
    turno: escuela.turno || 'SIMPLE MAÑANA',
    alumnos: Array.isArray(escuela.alumnos) ? escuela.alumnos : [],
    docentes: Array.isArray(escuela.docentes) ? escuela.docentes : [],
    telefonos: Array.isArray(escuela.telefonos) ? escuela.telefonos : ['']
  };
}
// Función auxiliar para base64 (compatible con navegador y Node.js)
export function safeBtoa(str) {
  if (typeof btoa === 'function') {
    return btoa(str); // Navegador o Node.js moderno
  }
  return Buffer.from(str).toString('base64'); // Node.js antiguo
}

// Datos iniciales de escuelas
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
        nombre: "Martínez, Lucía",
        diagnostico: "TEA Nivel 1",
        observaciones: "Requiere acompañante en recreos"
      },
      {
        id: "a2",
        gradoSalaAnio: "3° Grado",
        nombre: "García, Tomás",
        diagnostico: "TDAH",
        observaciones: "Medicación en horario escolar"
      }
    ],
    docentes: [
      {
        id: "d1",
        cargo: "Titular",
        nombreApellido: "López, María Elena",
        estado: "Licencia",
        motivo: "Art. 102 - Enfermedad",
        diasAutorizados: 30,
        fechaInicioLicencia: "2025-01-15",
        fechaFinLicencia: "2025-02-14",
        suplentes: [
          {
            id: "s1",
            cargo: "Suplente",
            nombreApellido: "Fernández, Ana Clara",
            estado: "Activo",
            motivo: "-",
            fechaIngreso: "2025-01-15"
          }
        ]
      },
      {
        id: "d2",
        cargo: "Titular",
        nombreApellido: "Rodríguez, Carlos",
        estado: "Activo",
        motivo: "-",
        diasAutorizados: 0,
        fechaInicioLicencia: null,
        fechaFinLicencia: null,
        suplentes: []
      }
    ]
  },
  {
    id: "e2",
    de: "DE 02",
    escuela: "Jardín de Infantes N°5 María Montessori",
    nivel: "Inicial",
    direccion: "Av. Santa Fe 567, CABA",
    lat: -34.5958,
    lng: -58.3975,
    telefonos: ["011-4765-5678", "011-4765-5679"],
    mail: "jardin5@bue.edu.ar",
    acdmMail: "acdm.jardin5@bue.edu.ar",
    jornada: "Simple",
    turno: "SIMPLE MAÑANA",
    alumnos: [
      {
        id: "a3",
        gradoSalaAnio: "Sala Roja",
        nombre: "Pérez, Santiago",
        diagnostico: "Síndrome de Down",
        observaciones: "Integración escolar plena"
      }
    ],
    docentes: [
      {
        id: "d3",
        cargo: "Titular",
        nombreApellido: "Gómez, Patricia",
        estado: "Activo",
        motivo: "-",
        diasAutorizados: 0,
        fechaInicioLicencia: null,
        fechaFinLicencia: null,
        suplentes: []
      }
    ]
  },
  {
    id: "e3",
    de: "DE 03",
    escuela: "Escuela Secundaria N°12 Domingo F. Sarmiento",
    nivel: "Secundario",
    direccion: "Calle Rivadavia 890, CABA",
    lat: -34.6158,
    lng: -58.4053,
    telefonos: ["011-4987-9012"],
    mail: "secundaria12@bue.edu.ar",
    acdmMail: "",
    jornada: "Completa",
    turno: "SIMPLE TARDE",
    alumnos: [],
    docentes: []
  }
];

// Datos iniciales de usuarios
export const USUARIOS_INICIALES = [
  {
    id: "u1",
    username: "admin",
    passwordHash: safeBtoa("admin2025"),
    rol: "admin"
  },
  {
    id: "u2",
    username: "viewer",
    passwordHash: safeBtoa("viewer123"),
    rol: "viewer"
  }
];

// Alertas leídas iniciales
export const ALERTAS_LEIDAS_INICIALES = [];

// Objeto completo para compatibilidad Papiweb
export const INITIAL_DB = {
  escuelas: ESCUELAS_INICIALES,
  usuarios: USUARIOS_INICIALES,
  alertasLeidas: ALERTAS_LEIDAS_INICIALES
};

// Función para normalizar estructura (útil para ambos archivos)
export function ensureEscuelaStructure(escuela) {
  return {
    id: escuela.id || `e${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

export default INITIAL_DB;
