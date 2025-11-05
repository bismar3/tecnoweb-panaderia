const express = require('express');
const router = express.Router();
const {
  getAllCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria
} = require('../controllers/categoriaController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// ✅ Rutas públicas (sin autenticación para lectura)
router.get('/', getAllCategorias);
router.get('/:id', getCategoriaById);

// ✅ Rutas protegidas (requieren autenticación y permisos)
router.post('/', verifyToken, checkPermission('Categoria'), createCategoria);
router.put('/:id', verifyToken, checkPermission('Categoria'), updateCategoria);
router.delete('/:id', verifyToken, checkPermission('Categoria'), deleteCategoria);

module.exports = router;