const API_URL = 'http://localhost:3000/api';

// ============================================
// VERIFICAR AUTENTICACIÓN
// ============================================
function checkAuth() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  
  const userMenu = document.getElementById('userMenu');
  
  if (token && userData) {
    const user = JSON.parse(userData);
    userMenu.innerHTML = `
      <div class="user-info">
        <strong>${user.nombre}</strong>
        <small>${user.email}</small>
      </div>
      <a href="#"><i class="fas fa-user-circle"></i> Mi Perfil</a>
      <a href="dashboard.html"><i class="fas fa-shopping-bag"></i> Mis Pedidos</a>
      <button onclick="logout()"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</button>
    `;
  } else {
    userMenu.innerHTML = `
      <a href="login.html"><i class="fas fa-sign-in-alt"></i> Iniciar Sesión</a>
      <button onclick="openModal()"><i class="fas fa-user-plus"></i> Crear Cuenta</button>
    `;
  }
}

// ============================================
// CERRAR SESIÓN
// ============================================
function logout() {
  if (confirm('¿Estás seguro de cerrar sesión?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userData');
    window.location.reload();
  }
}

// ============================================
// CAMBIAR TEMA
// ============================================
function changeTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  closeAllDropdowns();
}

// Cargar tema guardado
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// ============================================
// TOGGLE DROPDOWNS
// ============================================
function toggleDropdown(menuId) {
  const menu = document.getElementById(menuId);
  const isOpen = menu.classList.contains('show');
  
  closeAllDropdowns();
  
  if (!isOpen) {
    menu.classList.add('show');
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.remove('show');
  });
}

// Cerrar dropdowns al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    closeAllDropdowns();
  }
});

// ============================================
// TOGGLE CATEGORÍAS SIDEBAR
// ============================================
function toggleCategory(button) {
  const item = button.parentElement;
  const subcategories = item.querySelector('.subcategories');
  const isActive = item.classList.contains('active');
  
  // Cerrar todas las categorías
  document.querySelectorAll('.category-item').forEach(cat => {
    cat.classList.remove('active');
    cat.querySelector('.subcategories').classList.remove('show');
  });
  
  // Abrir la categoría clickeada si estaba cerrada
  if (!isActive) {
    item.classList.add('active');
    subcategories.classList.add('show');
  }
}

// ============================================
// MODAL
// ============================================
function openModal() {
  document.getElementById('modalCrearCuenta').classList.add('show');
  closeAllDropdowns();
}

function closeModal() {
  document.getElementById('modalCrearCuenta').classList.remove('show');
}

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
  const modal = document.getElementById('modalCrearCuenta');
  if (e.target === modal) {
    closeModal();
  }
});

// ============================================
// REGISTRO
// ============================================
async function handleRegistro(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  if (data.password !== data.confirmPassword) {
    alert('Las contraseñas no coinciden');
    return false;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: data.nombre,
        email: data.email,
        password: data.password
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('¡Registro exitoso! Por favor inicia sesión.');
      closeModal();
      window.location.href = 'login.html';
    } else {
      alert(result.message || 'Error al registrar');
    }
  } catch (error) {
    alert('Error de conexión con el servidor');
  }
  
  return false;
}

// ============================================
// AGREGAR AL CARRITO
// ============================================
function addToCart(e) {
  e.preventDefault();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    if (confirm('Debes iniciar sesión para agregar productos al carrito. ¿Deseas iniciar sesión?')) {
      window.location.href = 'login.html';
    }
    return false;
  }
  
  alert('¡Producto agregado al carrito!');
  return false;
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});