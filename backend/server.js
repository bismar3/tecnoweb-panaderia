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

// Ruta temporal para ver estructura de tablas
app.get('/api/debug/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const pool = require('./src/config/database');
    
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    res.json({
      success: true,
      table: tableName,
      columns: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);
// Rutas de usuarios
const usuarioRoutes = require('./src/routes/usuarioRoutes');
app.use('/api/usuarios', usuarioRoutes);
// Rutas de roles
const rolRoutes = require('./src/routes/rolRoutes');
app.use('/api/roles', rolRoutes);
// Rutas de permisos
const permisoRoutes = require('./src/routes/permisoRoutes');
app.use('/api/permisos', permisoRoutes);
// Rutas de productos
app.use('/api/productos', productoRoutes);
// Rutas de clientes 
const clienteRoutes = require('./src/routes/clienteRoutes');
app.use('/api/clientes', clienteRoutes);
// Rutas de almacenes
const almacenRoutes = require('./src/routes/almacenRoutes');
app.use('/api/almacenes', almacenRoutes);
// Rutas de inventarios
const inventarioRoutes = require('./src/routes/inventarioRoutes');
app.use('/api/inventarios', inventarioRoutes);
// Rutas de pedidos 
const pedidoRoutes = require('./src/routes/pedidoRoutes');
app.use('/api/pedidos', pedidoRoutes);
// Rutas de deliveries (repartidores)
const deliveryRoutes = require('./src/routes/deliveryRoutes');
app.use('/api/deliveries', deliveryRoutes);
// Rutas de entregas
const entregaRoutes = require('./src/routes/entregaRoutes');
app.use('/api/entregas', entregaRoutes);
// Rutas de métodos de pago
const metodoPagoRoutes = require('./src/routes/metodoPagoRoutes');
app.use('/api/metodos-pago', metodoPagoRoutes);
// Rutas de pagos
const pagoRoutes = require('./src/routes/pagoRoutes');
app.use('/api/pagos', pagoRoutes);
// Rutas de compras
const compraRoutes = require('./src/routes/compraRoutes');
app.use('/api/compras', compraRoutes);
// Rutas de recetas 
const recetaRoutes = require('./src/routes/recetaRoutes');
app.use('/api/recetas', recetaRoutes)
// Rutas de producción
const produccionRoutes = require('./src/routes/produccionRoutes');
app.use('/api/producciones', produccionRoutes);

// Rutas de proveedores
const proveedorRoutes = require('./src/routes/proveedorRoutes');
app.use('/api/proveedores', proveedorRoutes);
// Rutas de promociones
const promocionRoutes = require('./src/routes/promocionRoutes');
app.use('/api/promociones', promocionRoutes);
// Rutas de categorias
const categoriaRoutes = require('./src/routes/categoriaRoutes'); // ← AGREGAR
app.use('/api/categorias', categoriaRoutes); // ← AGREGAR
// Rutas de carritos
const carritoRoutes = require('./routes/carritoRoutes');
app.use('/api/carrito', carritoRoutes);

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
  console.log('   GET  /api/clientes');
  console.log('   GET  /api/almacenes');
  console.log('   GET  /api/inventarios');
  console.log('   GET  /api/pedidos');
  console.log('   GET  /api/deliveries');
  console.log('   GET  /api/entregas');
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