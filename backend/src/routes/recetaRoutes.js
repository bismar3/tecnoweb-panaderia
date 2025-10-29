const express = require('express');
const router = express.Router();
const recetaController = require('../controllers/recetaController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', checkPermission('Receta'), recetaController.getAll);
router.get('/:id', checkPermission('Receta'), recetaController.getById);
router.post('/', checkPermission('Receta'), recetaController.create);
router.put('/:id', checkPermission('Receta'), recetaController.update);
router.delete('/:id', checkPermission('Receta'), recetaController.deleteReceta);

module.exports = router;