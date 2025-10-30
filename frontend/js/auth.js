document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const alertDiv = document.getElementById('alert');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertDiv.style.display = 'none';
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) return showAlert('Por favor ingresa tu email', 'error');
    if (!password) return showAlert('Por favor ingresa tu contraseña', 'error');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
      });

      const data = await response.json();
      if (!response.ok) {
        showAlert(data.message || 'Error de autenticación', 'error');
        return;
      }

      localStorage.setItem('token', data.token);
      showAlert('Inicio de sesión exitoso', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);

    } catch (error) {
      showAlert('Error al conectar con el servidor', 'error');
      console.error(error);
    }
  });

  function showAlert(message, type) {
    alertDiv.textContent = message;
    alertDiv.className = 'alert ' + (type === 'error' ? 'error' : 'success');
    alertDiv.style.display = 'block';
  }
});
