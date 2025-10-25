const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const productoRoutes = require('./src/routes/productoRoutes');

// Ruta de prueba principal
app.get('/', (req, res) => {
  res.json({
    message: 'API de Gestión de Producción',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      productos: '/api/productos',
      testDB: '/api/test-db'
    }
  });
});

// Ruta de prueba de conexión a BD
app.get('/api/test-db', async (req, res) => {
  try {
    const pool = require('./src/config/database');
    const result = await pool.query('SELECT NOW() as timestamp, version()');
    res.json({
      success: true,
      message: 'Conexión a BD exitosa',
      data: {
        timestamp: result.rows[0].timestamp,
        database: 'PostgreSQL',
        version: result.rows[0].version.split(' ')[1]
      }
    });
  } catch (error) {
    console.error('Error en test-db:', error);
    res.status(500).json({
      success: false,
      message: 'Error de conexión a BD',
      error: error.message
    });
  }
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de productos
app.use('/api/productos', productoRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error interno:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Base de datos: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 Endpoints disponibles:');
  console.log('   GET  /');
  console.log('   GET  /api/test-db');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/productos');
  console.log('   POST /api/productos');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido, cerrando servidor...');
  process.exit(0);
});