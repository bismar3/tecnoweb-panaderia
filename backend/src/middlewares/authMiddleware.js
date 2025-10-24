const jwt = require('jsonwebtoken');

// Verificar token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

// Verificar permisos específicos
const checkPermission = (permiso) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permisos) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
    }

    if (!req.user.permisos.includes(permiso)) {
      return res.status(403).json({
        success: false,
        message: `No tiene permiso: ${permiso}`
      });
    }

    next();
  };
};

module.exports = { verifyToken, checkPermission };