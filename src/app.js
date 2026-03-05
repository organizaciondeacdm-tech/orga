const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { logger } = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const escuelaRoutes = require('./routes/escuelaRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const alumnoRoutes = require('./routes/alumnoRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();

// [IMPORTANTE] Conexión a MongoDB - UNA SOLA VEZ al inicio
let isConnected = false;

const connectToDatabase = async () => {
  console.log('🔍 [app.js] Verificando estado de conexión...');
  
  if (isConnected) {
    console.log('✅ [app.js] Usando conexión existente a MongoDB');
    return;
  }

  try {
    console.log('⏳ [app.js] Llamando a connectDB()...');
    const db = await connectDB();
    
    // Verificar estado de la conexión
    isConnected = db.connections[0].readyState === 1;
    
    if (isConnected) {
      console.log('✅ [app.js] Conectado a MongoDB exitosamente');
      console.log('📊 [app.js] Host:', db.connections[0].host);
      console.log('📊 [app.js] Base de datos:', db.connections[0].name);
    } else {
      console.warn('⚠️ [app.js] MongoDB conectado pero con estado:', db.connections[0].readyState);
    }
  } catch (error) {
    console.error('❌ [app.js] Error conectando a MongoDB:');
    console.error('   Nombre:', error.name);
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    
    // No hacer throw - permitir que la app funcione sin BD para health checks
    console.log('⚠️ [app.js] Continuando sin conexión a BD (modo degradado)');
  }
};

// Iniciar conexión (no-blocking)
console.log('🚀 [app.js] Iniciando aplicación...');
connectToDatabase();

// Middleware para verificar BD en rutas que la necesitan
const requireDatabase = (req, res, next) => {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  if (readyState !== 1) {
    console.log(`⚠️ [app.js] Ruta ${req.path} requiere BD pero estado: ${states[readyState] || readyState}`);
    return res.status(503).json({
      success: false,
      error: 'Base de datos no disponible',
      message: `El servicio está ${states[readyState] || 'iniciando'}, intente nuevamente`,
      state: readyState
    });
  }
  next();
};

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Rate limiting (simplificado para Vercel)
if (!process.env.VERCEL) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  });
  app.use('/api', limiter);
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitización
app.use(mongoSanitize());
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
});

// Compresión
app.use(compression());

// Logging (usando nuestro logger)
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Health check (NO requiere BD)
app.get('/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  
  console.log(`📊 [app.js] Health check - MongoDB estado: ${states[readyState] || readyState}`);
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: {
      state: readyState,
      status: states[readyState] || 'unknown',
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null
    },
    vercel: !!process.env.VERCEL,
    env: {
      hasMongoURI: !!process.env.MONGODB_URI,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// ENDPOINT DE STATUS - Información detallada
app.get('/api/status', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  console.log(`📊 [app.js] Status - MongoDB estado: ${dbStatus[dbState] || dbState}`);

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: dbState === 1 ? {
      status: dbStatus[dbState],
      readyState: dbState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.models).length
    } : {
      status: dbStatus[dbState] || 'disconnected',
      readyState: dbState
    },
    environment: process.env.VERCEL ? 'vercel' : process.env.NODE_ENV,
    node: {
      version: process.version,
      platform: process.platform,
      memory: process.memoryUsage()
    }
  });
});

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/escuelas', requireDatabase, escuelaRoutes);
app.use('/api/docentes', requireDatabase, docenteRoutes);
app.use('/api/alumnos', requireDatabase, alumnoRoutes);
app.use('/api/reportes', requireDatabase, reporteRoutes);

// Endpoint de prueba (NO requiere BD)
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ACDM Backend API',
    version: '1.0.0',
    environment: process.env.VERCEL ? 'vercel' : process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: '/health',
      status: '/api/status',
      test: '/api/test',
      auth: '/api/auth',
      escuelas: '/api/escuelas',
      docentes: '/api/docentes',
      alumnos: '/api/alumnos',
      reportes: '/api/reportes'
    }
  });
});

// Servir frontend si existe (en Vercel)
if (process.env.VERCEL) {
  const frontendPath = path.join(__dirname, '../dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Manejo de errores (SIEMPRE al final)
app.use(errorHandler);

console.log('✅ [app.js] Aplicación configurada correctamente');

module.exports = app;
