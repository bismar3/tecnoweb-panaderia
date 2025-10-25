const ProductoModel = require('../models/productoModel');

// Obtener todos los productos
const getAllProductos = async (req, res) => {
  try {
    const { estado, categoria, buscar } = req.query;
    
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (categoria) filtros.categoria = parseInt(categoria);
    if (buscar) filtros.buscar = buscar;

    const productos = await ProductoModel.getAll(filtros);

    res.json({
      success: true,
      count: productos.length,
      data: productos
    });
  } catch (error) {
    console.error('Error en getAllProductos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// Obtener producto por ID
const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await ProductoModel.getById(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: producto
    });
  } catch (error) {
    console.error('Error en getProductoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

// Crear producto
const createProducto = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, id_categoria, unidad_medida, precio_venta } = req.body;

    // Validaciones básicas
    if (!codigo || !nombre || !unidad_medida || !precio_venta) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: codigo, nombre, unidad_medida, precio_venta'
      });
    }

    if (precio_venta <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio de venta debe ser mayor a 0'
      });
    }

    // Verificar si el código ya existe
    const codigoExiste = await ProductoModel.getByCodigo(codigo);
    if (codigoExiste) {
      return res.status(400).json({
        success: false,
        message: 'El código ya está registrado'
      });
    }

    const productoData = {
      codigo,
      nombre,
      descripcion,
      id_categoria,
      unidad_medida,
      precio_venta: parseFloat(precio_venta)
    };

    const nuevoProducto = await ProductoModel.create(productoData);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: nuevoProducto
    });
  } catch (error) {
    console.error('Error en createProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// Actualizar producto
const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const productoData = req.body;

    // Verificar que el producto existe
    const productoExistente = await ProductoModel.getById(id);
    if (!productoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Validar precio si viene en la actualización
    if (productoData.precio_venta && productoData.precio_venta <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio de venta debe ser mayor a 0'
      });
    }

    // Verificar código duplicado si se está actualizando
    if (productoData.codigo && productoData.codigo !== productoExistente.codigo) {
      const codigoExiste = await ProductoModel.getByCodigo(productoData.codigo);
      if (codigoExiste) {
        return res.status(400).json({
          success: false,
          message: 'El código ya está registrado'
        });
      }
    }

    const productoActualizado = await ProductoModel.update(id, productoData);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: productoActualizado
    });
  } catch (error) {
    console.error('Error en updateProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// Eliminar producto (soft delete)
const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const productoExistente = await ProductoModel.getById(id);
    if (!productoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await ProductoModel.delete(id);

    res.json({
      success: true,
      message: 'Producto desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// Actualizar stock
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, operacion } = req.body;

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    if (!['suma', 'resta'].includes(operacion)) {
      return res.status(400).json({
        success: false,
        message: 'Operación inválida. Debe ser "suma" o "resta"'
      });
    }

    const producto = await ProductoModel.getById(id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que no quede stock negativo
    if (operacion === 'resta' && producto.stock_actual < cantidad) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente'
      });
    }

    const productoActualizado = await ProductoModel.updateStock(id, cantidad, operacion);

    res.json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: productoActualizado
    });
  } catch (error) {
    console.error('Error en updateStock:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar stock',
      error: error.message
    });
  }
};

/* Obtener productos con stock bajo
const getLowStockProducts = async (req, res) => {
  try {
    const productos = await ProductoModel.checkLowStock();

    res.json({
      success: true,
      count: productos.length,
      data: productos
    });
  } catch (error) {
    console.error('Error en getLowStockProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos con stock bajo',
      error: error.message
    });
  }
};*/
module.exports = {
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  updateStock,

};