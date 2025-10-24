const validatePassword = (password) => {
  const errors = [];
  
  // Longitud mínima (8 caracteres)
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  // Al menos una mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  
  // Al menos una minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  
  // Al menos un número
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validatePassword };