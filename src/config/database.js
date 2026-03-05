const mongoose = require('mongoose');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe (solo en desarrollo)
const logsDir = path.join(__dirname, '../../logs');
if (!process.env.VERCEL && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configurar logger según el entorno
const transports = [
  new winston.transports.Console({
    format: winston.format.simple()
  })
];

// Solo agregar archivo de logs fuera de Vercel
if (!process.env.VERCEL) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports
});

let isConnecting = false;
let isConnected = false;

const connectDB = async () => {
  // Evitar conexiones múltiples
  if (isConnecting) {
    logger.info('⏳ Conexión en progreso, esperando...');
    // Esperar a que la conexión actual termine
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return mongoose.connection;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    logger.info('✅ Usando conexión existente');
    return mongoose.connection;
  }

  isConnecting = true;
  logger.info('🔍 Iniciando nueva conexión a MongoDB...');

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      logger.error('❌ MONGODB_URI no definida');
      throw new Error('MONGODB_URI environment variable is required');
    }

    // Log la URI (sin credenciales)
    const uriLog = mongoUri.replace(/:[^:@]*@/, ':****@');
    logger.info(`🔗 URI: ${uriLog}`);

    // Configuración de conexión optimizada
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 2,
      family: 4,
      retryWrites: true,
      w: 'majority'
    };

    logger.info('⏳ Intentando conectar...');
    
    const conn = await mongoose.connect(mongoUri, options);
    
    logger.info(`✅ MongoDB Conectado: ${conn.connection.host}`);
    logger.info(`📊 Base de datos: ${conn.connection.name}`);
    
    isConnected = true;
    isConnecting = false;
    
    // Configurar eventos de conexión
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
      isConnected = true;
    });

    return conn;
    
  } catch (error) {
    logger.error('❌ Error de conexión:');
    logger.error(`   Nombre: ${error.name}`);
    logger.error(`   Mensaje: ${error.message}`);
    logger.error(`   Código: ${error.code || 'N/A'}`);
    
    isConnecting = false;
    isConnected = false;
    throw error;
  }
};

module.exports = connectDB;
