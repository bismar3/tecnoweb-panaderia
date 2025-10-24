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

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API de Gestión de Producción',
    version: '1.0.0',
    status: 'running'
  });
});

// Ruta de prueba de BD
app.get('/api/test-db', async (req, res) => {
  try {
    const pool = require('./src/config/database');
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Conexión a BD exitosa',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error de conexión a BD',
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
});