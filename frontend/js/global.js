const API_URL = 'http://localhost:3000/api';

// ============================================
// CARGAR TEMA AL INICIO
// ============================================
(function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

// ============================================
// VERIFICAR AUTENTICACIÓN
// ============================================
function checkAuth() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  
  const userMenu = document.getElementById('userMenu');
  
  if (!userMenu) return; // Si no existe el elemento, salir
  
  if (token && userData) {
    const user = JSON.parse(userData);
    userMenu.innerHTML = `
      <div class="user-info">
        <strong>${user.nombre}</strong>
        <small>${user.email}</small>
      </div>
      <a href="dashboard.html">
        <i class="fas fa-user-circle"></i> Mi Perfil
      </a>
      <a href="dashboard.html">
        <i class="fas fa-shopping-bag"></i> Mis Pedidos
      </a>
      <button onclick="logout()">
        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
      </button>
    `;
  } else {
    userMenu.innerHTML = `
      <a href="login.html">
        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
      </a>
      <button onclick="openModal()">
        <i class="fas fa-user-plus"></i> Crear Cuenta
      </button>
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
    window.location.href = 'login.html';
  }
}

// ============================================
// CAMBIAR TEMA
// ============================================
function changeTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  closeAllDropdowns();
  
  // Actualizar icono del tema si existe
  const themeIcon = document.querySelector('#themeDropdown i:first-child');
  if (themeIcon) {
    if (theme === 'light') {
      themeIcon.className = 'fas fa-sun';
    } else if (theme === 'dark') {
      themeIcon.className = 'fas fa-moon';
    } else {
      themeIcon.className = 'fas fa-bread-slice';
    }
  }
}

// ============================================
// TOGGLE DROPDOWNS
// ============================================
function toggleDropdown(menuId) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  
  const isOpen = menu.classList.contains('show');
  
  // Cerrar todos los dropdowns
  closeAllDropdowns();
  
  // Abrir el dropdown actual si estaba cerrado
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

// Prevenir que el clic dentro del dropdown lo cierre
document.addEventListener('click', (e) => {
  if (e.target.closest('.dropdown-menu')) {
    e.stopPropagation();
  }
});

// ============================================
// TOGGLE SIDEBAR EN MÓVIL
// ============================================
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('show');
  }
}

// ============================================
// INICIALIZAR AL CARGAR LA PÁGINA
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  
  // Marcar el enlace activo en el sidebar
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href === currentPage) {
      link.classList.add('active');
    }
  });
  
  // Aplicar tema guardado
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
});