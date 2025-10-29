const ProveedorModel = require('../models/proveedorModel');

const getAll = async (req, res) => {
  try {
    const { estado, nombre, nit } = req.query;
    
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (nombre) filtros.nombre = nombre;
    if (nit) filtros.nit = nit;

    const proveedores = await ProveedorModel.getAll(filtros);

    res.json({
      success: true,
      count: proveedores.length,
      data: proveedores
    });
  } catch (error) {
    console.error('Error en getAll proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores',
      error: error.message
    });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await ProveedorModel.getById(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      data: proveedor
    });
  } catch (error) {
    console.error('Error en getById proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, contacto, telefono, email, direccion, nit } = req.body;

    // Validaciones
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    if (!nit || nit.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El NIT es requerido'
      });
    }

    // Verificar si ya existe el NIT
    const existeNit = await ProveedorModel.getByNit(nit);
    if (existeNit) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proveedor con ese NIT'
      });
    }

    // Verificar si ya existe el email
    if (email) {
      const existeEmail = await ProveedorModel.getByEmail(email);
      if (existeEmail) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un proveedor con ese email'
        });
      }
    }

    const proveedorData = {
      nombre: nombre.trim(),
      contacto: contacto?.trim(),
      telefono: telefono?.trim(),
      email: email?.trim(),
      direccion: direccion?.trim(),
      nit: nit.trim()
    };

    const nuevoProveedor = await ProveedorModel.create(proveedorData);

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: nuevoProveedor
    });
  } catch (error) {
    console.error('Error en create proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, email, direccion, nit, estado } = req.body;

    // Verificar que el proveedor existe
    const proveedorExiste = await ProveedorModel.getById(id);
    if (!proveedorExiste) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Si se está actualizando el NIT, verificar que no esté en uso
    if (nit && nit !== proveedorExiste.nit) {
      const existeNit = await ProveedorModel.getByNit(nit);
      if (existeNit) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un proveedor con ese NIT'
        });
      }
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (email && email !== proveedorExiste.email) {
      const existeEmail = await ProveedorModel.getByEmail(email);
      if (existeEmail) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un proveedor con ese email'
        });
      }
    }

    const proveedorData = {
      nombre: nombre?.trim(),
      contacto: contacto?.trim(),
      telefono: telefono?.trim(),
      email: email?.trim(),
      direccion: direccion?.trim(),
      nit: nit?.trim(),
      estado
    };

    const proveedorActualizado = await ProveedorModel.update(id, proveedorData);

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: proveedorActualizado
    });
  } catch (error) {
    console.error('Error en update proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (estado === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const proveedorActualizado = await ProveedorModel.cambiarEstado(id, estado);

    if (!proveedorActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Proveedor ${estado ? 'activado' : 'desactivado'} exitosamente`,
      data: proveedorActualizado
    });
  } catch (error) {
    console.error('Error en cambiarEstado proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del proveedor',
      error: error.message
    });
  }
};

const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedorEliminado = await ProveedorModel.delete(id);

    if (!proveedorEliminado) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente',
      data: proveedorEliminado
    });
  } catch (error) {
    console.error('Error en delete proveedor:', error);
    
    if (error.message.includes('tiene compras registradas')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar proveedor',
      error: error.message
    });
  }
};

const getHistorialCompras = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const historial = await ProveedorModel.getHistorialCompras(id, limit || 10);

    res.json({
      success: true,
      count: historial.length,
      data: historial
    });
  } catch (error) {
    console.error('Error en getHistorialCompras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de compras',
      error: error.message
    });
  }
};

const getEstadisticas = async (req, res) => {
  try {
    const { id } = req.params;

    const estadisticas = await ProveedorModel.getEstadisticas(id);

    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error en getEstadisticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  cambiarEstado,
  deleteProveedor,
  getHistorialCompras,
  getEstadisticas
};