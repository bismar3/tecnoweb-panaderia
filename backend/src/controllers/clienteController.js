const ClienteModel = require('../models/clienteModel');

// Obtener todos los clientes
const getAll = async (req, res) => {
  try {
    const { estado, tipo, buscar } = req.query;
    
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (tipo) filtros.tipo = tipo;
    if (buscar) filtros.buscar = buscar;

    const clientes = await ClienteModel.getAll(filtros);

    res.json({
      success: true,
      count: clientes.length,
      data: clientes
    });
  } catch (error) {
    console.error('Error en getAll clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes',
      error: error.message
    });
  }
};

// Obtener cliente por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await ClienteModel.getById(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: cliente
    });
  } catch (error) {
    console.error('Error en getById cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente',
      error: error.message
    });
  }
};

// Crear cliente
const create = async (req, res) => {
  try {
    const { nombre, email, telefono, direccion, nit, tipo } = req.body;

    // Validar campo requerido
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    // Validar email único si se proporciona
    if (email) {
      const existeEmail = await ClienteModel.getByEmail(email);
      if (existeEmail) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    // Validar NIT único si se proporciona
    if (nit) {
      const existeNit = await ClienteModel.getByNit(nit);
      if (existeNit) {
        return res.status(400).json({
          success: false,
          message: 'El NIT ya está registrado'
        });
      }
    }

    const nuevoCliente = await ClienteModel.create({
      nombre,
      email,
      telefono,
      direccion,
      nit,
      tipo
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: nuevoCliente
    });
  } catch (error) {
    console.error('Error en create cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente',
      error: error.message
    });
  }
};

// Actualizar cliente
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion, nit, tipo, estado } = req.body;

    // Verificar que el cliente existe
    const clienteExiste = await ClienteModel.getById(id);
    if (!clienteExiste) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Validar email único si se cambia
    if (email && email !== clienteExiste.email) {
      const existeEmail = await ClienteModel.getByEmail(email);
      if (existeEmail) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    // Validar NIT único si se cambia
    if (nit && nit !== clienteExiste.nit) {
      const existeNit = await ClienteModel.getByNit(nit);
      if (existeNit) {
        return res.status(400).json({
          success: false,
          message: 'El NIT ya está registrado'
        });
      }
    }

    const clienteActualizado = await ClienteModel.update(id, {
      nombre,
      email,
      telefono,
      direccion,
      nit,
      tipo,
      estado
    });

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: clienteActualizado
    });
  } catch (error) {
    console.error('Error en update cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente',
      error: error.message
    });
  }
};

// Eliminar cliente (soft delete)
const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const clienteExiste = await ClienteModel.getById(id);
    if (!clienteExiste) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const clienteEliminado = await ClienteModel.delete(id);

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
      data: clienteEliminado
    });
  } catch (error) {
    console.error('Error en delete cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteCliente
};