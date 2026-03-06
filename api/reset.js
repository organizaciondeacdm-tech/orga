import { Redis } from '@upstash/redis';

// Función Papiweb segura para base64 (compatible con Node.js)
function safeBtoa(str) {
  if (typeof btoa === 'function') {
    return btoa(str); // Navegador o Node.js moderno
  }
  return Buffer.from(str).toString('base64'); // Node.js antiguo
}

// Configurar Redis
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN,
});

// Token de seguridad (debe estar en variables de entorno)
const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'default-insecure-token-cambiar';

// Función para asegurar estructura de escuelas
function ensureEscuelaStructure(escuela) {
  return {
    id: escuela.id || `e${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único
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
            { id: "s1", cargo: "Suplente", nombreApellido: "Fernández, Ana Clara", estado: "Activo", motivo: "-", fechaIngreso: "2025-01-15" }
          ]
        },
        {
          id: "d2", cargo: "Titular", nombreApellido: "Rodríguez, Carlos",
          estado: "Activo", motivo: "-", diasAutorizados: 0,
          fechaInicioLicencia: null, fechaFinLicencia: null, suplentes: []
        }
      ]
    },
    {
      id: "e2", de: "DE 02", escuela: "Jardín de Infantes N°5 María Montessori",
      nivel: "Inicial", direccion: "Av. Santa Fe 567, CABA",
      lat: -34.5958, lng: -58.3975,
      telefonos: ["011-4765-5678", "011-4765-5679"], mail: "jardin5@bue.edu.ar",
      acdmMail: "acdm.jardin5@bue.edu.ar",
      jornada: "Simple", turno: "SIMPLE MAÑANA",
      alumnos: [
        { id: "a3", gradoSalaAnio: "Sala Roja", nombre: "Pérez, Santiago", diagnostico: "Síndrome de Down", observaciones: "Integración escolar plena" }
      ],
      docentes: [
        {
          id: "d3", cargo: "Titular", nombreApellido: "Gómez, Patricia",
          estado: "Activo", motivo: "-", diasAutorizados: 0,
          fechaInicioLicencia: null, fechaFinLicencia: null, suplentes: []
        }
      ]
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

export default async function handler(req, res) {
  // Verificar token de seguridad
  const { secret } = req.query;
  
  if (secret !== ADMIN_SECRET_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      error: 'No autorizado. Se requiere token secreto.' 
    });
  }

  try {
    // Procesar escuelas con IDs únicos
    const escuelasIniciales = INITIAL_DATA.escuelas.map(escuela => 
      ensureEscuelaStructure(escuela)
    );
    
    // Usar pipeline para operación atómica
    await redis.pipeline()
      .set('acdm:escuelas', JSON.stringify(escuelasIniciales))
      .set('acdm:usuarios', JSON.stringify(INITIAL_DATA.usuarios))
      .set('acdm:alertas:leidas', JSON.stringify(INITIAL_DATA.alertasLeidas))
      .exec();

    // Verificar que se guardaron
    const verificacion = await redis.get('acdm:escuelas');
    const escuelasGuardadas = verificacion ? JSON.parse(verificacion) : [];

    res.status(200).json({ 
      success: true, 
      message: 'Datos reseteados correctamente',
      count: escuelasGuardadas.length,
      data: escuelasGuardadas,
      usuarios: INITIAL_DATA.usuarios.map(u => ({ ...u, passwordHash: '[PROTEGIDO]' }))
    });

  } catch (error) {
    console.error('❌ Error en reset:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}