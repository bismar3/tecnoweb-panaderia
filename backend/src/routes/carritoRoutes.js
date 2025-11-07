const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/carrito - Obtener carrito del usuario
router.get('/', carritoController.getCarrito);

// GET /api/carrito/contador - Obtener cantidad de items
router.get('/contador', carritoController.getContador);

// POST /api/carrito - Agregar producto al carrito
router.post('/', carritoController.agregarProducto);

// PUT /api/carrito/:id_item - Actualizar cantidad
router.put('/:id_item', carritoController.actualizarCantidad);

// DELETE /api/carrito/:id_item - Eliminar producto
router.delete('/:id_item', carritoController.eliminarProducto);

// DELETE /api/carrito - Vaciar carrito
router.delete('/', carritoController.vaciarCarrito);

module.exports = router;