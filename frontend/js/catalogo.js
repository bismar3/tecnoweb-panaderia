const API_URL = 'http://localhost:3000/api';

// ============================================
// VARIABLES GLOBALES
// ============================================
let map = null;
let marker = null;
let todosLosProductos = [];
let productosFiltrados = [];
let categorias = [];
let categoriaActual = null;
let busquedaActual = '';
let paginaActual = 1;
const PRODUCTOS_POR_PAGINA = 6;

// Ubicación de la panadería
const PANADERIA_LAT = -17.34317;
const PANADERIA_LNG = -63.23354;
const PANADERIA_NOMBRE = 'Panadería Belén';
const PANADERIA_DIRECCION = 'Montero, Santa Cruz - Bolivia';

// ============================================
// MAPEO DE ÍCONOS POR CATEGORÍA
// ============================================
const ICONOS_CATEGORIA = {
  'pan': 'fa-bread-slice',
  'frances': 'fa-bread-slice',
  'molde': 'fa-bread-slice',
  'integral': 'fa-wheat-awn',
  'horneado': 'fa-cookie',
  'empanada': 'fa-cookie-bite',
  'salteña': 'fa-cookie-bite',
  'cuñape': 'fa-cookie',
  'reposteria': 'fa-birthday-cake',
  'torta': 'fa-cake-candles',
  'pastel': 'fa-cake-candles',
  'galleta': 'fa-cookie',
  'postre': 'fa-ice-cream',
  'default': 'fa-bread-slice'
};

function getIconoCategoria(nombreCategoria) {
  if (!nombreCategoria) return ICONOS_CATEGORIA.default;
  
  const nombre = nombreCategoria.toLowerCase();
  
  for (const [key, icon] of Object.entries(ICONOS_CATEGORIA)) {
    if (nombre.includes(key)) {
      return icon;
    }
  }
  
  return ICONOS_CATEGORIA.default;
}

// ============================================
// CARGAR CATEGORÍAS
// ============================================
async function cargarCategorias() {
  try {
    console.log('📂 Cargando categorías...');
    
    const response = await fetch(`${API_URL}/categorias?estado=true`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al cargar categorías');
    }
    
    categorias = data.data || [];
    console.log('✅ Categorías cargadas:', categorias.length);
    
    renderizarCategorias();
    
  } catch (error) {
    console.error('❌ Error al cargar categorías:', error);
    document.getElementById('categoriasList').innerHTML = `
      <li style="padding: 1rem; color: var(--text-secondary);">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar categorías</p>
      </li>
    `;
  }
}

function renderizarCategorias() {
  const lista = document.getElementById('categoriasList');
  
  if (categorias.length === 0) {
    lista.innerHTML = `
      <li style="padding: 1rem; color: var(--text-secondary);">
        <i class="fas fa-inbox"></i>
        <p>No hay categorías disponibles</p>
      </li>
    `;
    return;
  }
  
  let html = `
    <li class="category-item ${!categoriaActual ? 'active' : ''}">
      <button class="category-header" onclick="filtrarPorCategoria(null)">
        <span><i class="fas fa-th-large"></i> Todos los productos</span>
      </button>
    </li>
  `;
  
  categorias.forEach(cat => {
    const icono = getIconoCategoria(cat.nombre);
    const isActive = categoriaActual === cat.id_categoria;
    
    html += `
      <li class="category-item ${isActive ? 'active' : ''}">
        <button class="category-header" onclick="filtrarPorCategoria(${cat.id_categoria}, '${cat.nombre}')">
          <span><i class="fas ${icono}"></i> ${cat.nombre}</span>
        </button>
      </li>
    `;
  });
  
  lista.innerHTML = html;
}

// ============================================
// CARGAR PRODUCTOS
// ============================================
async function cargarProductos(idCategoria = null) {
  try {
    console.log('🛒 Cargando productos...', idCategoria ? `Categoría: ${idCategoria}` : 'Todos');
    
    mostrarLoading();
    
    let url = `${API_URL}/productos?estado=true`;
    if (idCategoria) {
      url += `&categoria=${idCategoria}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al cargar productos');
    }
    
    todosLosProductos = data.data || [];
    productosFiltrados = [...todosLosProductos];
    
    console.log('✅ Productos cargados:', productosFiltrados.length);
    
    paginaActual = 1;
    renderizarProductos();
    renderizarPaginacion();
    
  } catch (error) {
    console.error('❌ Error al cargar productos:', error);
    mostrarErrorProductos();
  }
}

function mostrarLoading() {
  document.getElementById('productsGrid').innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner"></i>
      <p>Cargando productos...</p>
    </div>
  `;
}

function mostrarErrorProductos() {
  document.getElementById('productsGrid').innerHTML = `
    <div class="no-products">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Error al cargar productos</h3>
      <p>Por favor, intenta recargar la página</p>
      <button class="btn-primary" onclick="cargarProductos(categoriaActual)" style="margin-top: 1rem;">
        <i class="fas fa-sync"></i> Reintentar
      </button>
    </div>
  `;
}

// ============================================
// RENDERIZAR PRODUCTOS
// ============================================
function renderizarProductos() {
  const grid = document.getElementById('productsGrid');
  
  if (productosFiltrados.length === 0) {
    grid.innerHTML = `
      <div class="no-products">
        <i class="fas fa-shopping-basket"></i>
        <h3>No hay productos disponibles</h3>
        <p>${categoriaActual ? 'En esta categoría' : 'En este momento'}</p>
      </div>
    `;
    document.getElementById('pagination').style.display = 'none';
    return;
  }
  
  // Calcular productos de la página actual
  const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
  const fin = inicio + PRODUCTOS_POR_PAGINA;
  const productosPagina = productosFiltrados.slice(inicio, fin);
  
  let html = '';
  
  productosPagina.forEach(producto => {
    const icono = getIconoCategoria(producto.categoria_nombre);
    const precio = parseFloat(producto.precio_venta).toFixed(2);
    
    html += `
      <div class="product-card">
        <div class="product-icon">
          <i class="fas ${icono}"></i>
        </div>
        
        ${producto.categoria_nombre ? `<span class="category-badge">${producto.categoria_nombre}</span>` : ''}
        
        <h2>${producto.nombre}</h2>
        
        <p>${producto.descripcion || 'Producto de calidad'}</p>
        
        <span class="product-price">Bs ${precio}</span>
        
        <form class="add-cart-form" onsubmit="return addToCart(event, ${producto.id_producto})">
          <button type="submit" class="btn-primary">
            <i class="fas fa-shopping-cart"></i> Agregar al Pedido
          </button>
        </form>
      </div>
    `;
  });
  
  grid.innerHTML = html;
}

// ============================================
// PAGINACIÓN
// ============================================
function renderizarPaginacion() {
  const paginationDiv = document.getElementById('pagination');
  
  const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
  
  if (totalPaginas <= 1) {
    paginationDiv.style.display = 'none';
    return;
  }
  
  paginationDiv.style.display = 'flex';
  
  let html = `
    <button onclick="cambiarPagina(${paginaActual - 1})" ${paginaActual === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i> Anterior
    </button>
    
    <div class="page-numbers">
  `;
  
  // Mostrar máximo 5 números de página
  let inicio = Math.max(1, paginaActual - 2);
  let fin = Math.min(totalPaginas, inicio + 4);
  
  if (fin - inicio < 4) {
    inicio = Math.max(1, fin - 4);
  }
  
  for (let i = inicio; i <= fin; i++) {
    html += `
      <button 
        onclick="cambiarPagina(${i})" 
        class="${i === paginaActual ? 'active' : ''}"
      >
        ${i}
      </button>
    `;
  }
  
  html += `
    </div>
    
    <span class="page-info">
      Página ${paginaActual} de ${totalPaginas}
    </span>
    
    <button onclick="cambiarPagina(${paginaActual + 1})" ${paginaActual === totalPaginas ? 'disabled' : ''}>
      Siguiente <i class="fas fa-chevron-right"></i>
    </button>
  `;
  
  paginationDiv.innerHTML = html;
}

function cambiarPagina(nuevaPagina) {
  const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
  
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  
  paginaActual = nuevaPagina;
  renderizarProductos();
  renderizarPaginacion();
  
  // Scroll suave al inicio de los productos
  document.querySelector('.catalog h1').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// FILTRAR POR CATEGORÍA
// ============================================
function filtrarPorCategoria(idCategoria, nombreCategoria = null) {
  categoriaActual = idCategoria;
  
  // Actualizar sidebar
  document.querySelectorAll('.category-item').forEach(item => {
    item.classList.remove('active');
  });
  event.target.closest('.category-item').classList.add('active');
  
  // Mostrar filtros activos
  mostrarFiltrosActivos(nombreCategoria);
  
  // Cargar productos filtrados
  cargarProductos(idCategoria);
  
  closeAllDropdowns();
}

function mostrarFiltrosActivos(nombreCategoria) {
  const filtersDiv = document.getElementById('activeFilters');
  
  if (!nombreCategoria) {
    filtersDiv.style.display = 'none';
    return;
  }
  
  filtersDiv.style.display = 'flex';
  filtersDiv.innerHTML = `
    <div class="filter-tag">
      <i class="fas fa-filter"></i>
      <span>${nombreCategoria}</span>
      <button onclick="filtrarPorCategoria(null)" title="Quitar filtro">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
}

// ============================================
// AGREGAR AL PEDIDO
// ============================================
function addToCart(event, idProducto) {
  event.preventDefault();
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    if (confirm('Debes iniciar sesión para agregar productos al pedido.\n¿Deseas iniciar sesión?')) {
      openLoginModal();
    }
    return false;
  }
  
  // Buscar el producto
  const producto = todosLosProductos.find(p => p.id_producto === idProducto);
  
  if (!producto) {
    alert('❌ Producto no encontrado');
    return false;
  }
  
  console.log('🛒 Agregar al pedido:', producto);
  
  // TODO: Tu compañero implementará la lógica del carrito aquí
  // Por ahora solo mostramos confirmación
  alert(`✅ ${producto.nombre} agregado al pedido!\n\nPrecio: Bs ${producto.precio_venta}`);
  
  return false;
}

// ============================================
// SISTEMA DE UBICACIÓN 📍🗺️
// ============================================
function inicializarMapa() {
  if (map) {
    map.remove();
    map = null;
    marker = null;
  }

  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('❌ Contenedor del mapa no encontrado');
    return;
  }

  try {
    map = L.map('map', {
      center: [PANADERIA_LAT, PANADERIA_LNG],
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    marker = L.marker([PANADERIA_LAT, PANADERIA_LNG], {
      draggable: false,
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [35, 57],
        iconAnchor: [17, 57],
        popupAnchor: [1, -50],
        shadowSize: [57, 57]
      })
    }).addTo(map);

    const popupContent = `
      <div style="text-align: center; padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: #10b981; font-size: 1.1em;">
          <i class="fas fa-bread-slice"></i> ${PANADERIA_NOMBRE}
        </h3>
        <p style="margin: 5px 0; font-size: 0.9em;">
          <i class="fas fa-map-marker-alt" style="color: #ef4444;"></i> 
          ${PANADERIA_DIRECCION}
        </p>
        <p style="margin: 5px 0; font-size: 0.85em; color: #666;">
          <i class="fas fa-clock"></i> Lun - Dom: 6:00 AM - 8:00 PM
        </p>
        <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd;">
        <p style="margin: 5px 0; font-size: 0.8em; color: #888;">
          📍 Lat: ${PANADERIA_LAT.toFixed(5)}, Lng: ${PANADERIA_LNG.toFixed(5)}
        </p>
      </div>
    `;

    marker.bindPopup(popupContent, {
      closeButton: false,
      autoClose: false,
      closeOnClick: false
    }).openPopup();

    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 100);

    console.log('🗺️ Mapa inicializado correctamente');
    
  } catch (error) {
    console.error('❌ Error al inicializar mapa:', error);
  }
}

function openUbicacionModal() {
  document.getElementById('modalUbicacion').classList.add('show');
  closeAllDropdowns();
  
  setTimeout(() => {
    inicializarMapa();
  }, 200);
}

function closeUbicacionModal() {
  document.getElementById('modalUbicacion').classList.remove('show');
}

// ============================================
// AUTENTICACIÓN
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
      <a href="#" onclick="openLoginModal(event)"><i class="fas fa-sign-in-alt"></i> Iniciar Sesión</a>
      <button onclick="openModal()"><i class="fas fa-user-plus"></i> Crear Cuenta</button>
    `;
  }
}

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
// TEMA
// ============================================
function changeTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  closeAllDropdowns();
}

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// ============================================
// DROPDOWNS
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

document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    closeAllDropdowns();
  }
});

// ============================================
// MODALES
// ============================================
function openModal() {
  document.getElementById('modalCrearCuenta').classList.add('show');
  closeAllDropdowns();
}

function closeModal() {
  document.getElementById('modalCrearCuenta').classList.remove('show');
}

function openLoginModal(e) {
  if (e) e.preventDefault();
  document.getElementById('modalLogin').classList.add('show');
  closeAllDropdowns();
}

function closeLoginModal() {
  document.getElementById('modalLogin').classList.remove('show');
}

function switchToRegister(e) {
  e.preventDefault();
  closeLoginModal();
  openModal();
}

window.addEventListener('click', (e) => {
  const modalRegistro = document.getElementById('modalCrearCuenta');
  const modalLogin = document.getElementById('modalLogin');
  const modalUbicacion = document.getElementById('modalUbicacion');
  
  if (e.target === modalRegistro) closeModal();
  if (e.target === modalLogin) closeLoginModal();
  if (e.target === modalUbicacion) closeUbicacionModal();
});

// ============================================
// REGISTRO
// ============================================
async function handleRegistro(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  if (data.password !== data.confirmPassword) {
    alert('❌ Las contraseñas no coinciden');
    return false;
  }
  
  if (data.password.length < 8) {
    alert('❌ La contraseña debe tener al menos 8 caracteres');
    return false;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono || null,
        direccion: data.direccion || null,
        nit: data.nit || null,
        password: data.password
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('✅ ¡Registro exitoso!\n\nPor favor inicia sesión.');
      closeModal();
      e.target.reset();
      setTimeout(() => openLoginModal(), 500);
    } else {
      alert(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    console.error('❌ Error en registro:', error);
    alert('❌ Error de conexión con el servidor.');
  }
  
  return false;
}

// ============================================
// LOGIN
// ============================================
async function handleLogin(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');
  const remember = formData.get('remember') === 'on';
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      alert(data.message || 'Error al iniciar sesión');
      return false;
    }
    
    const storage = remember ? localStorage : sessionStorage;
    
    storage.setItem('token', data.token);
    storage.setItem('userData', JSON.stringify(data.user));
    
    alert(`✅ ¡Bienvenido ${data.user.nombre}!`);
    closeLoginModal();
    window.location.reload();
    
  } catch (error) {
    console.error('Error en login:', error);
    alert('Error de conexión con el servidor');
  }
  
  return false;
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando catálogo...');
  
  checkAuth();
  cargarCategorias();
  cargarProductos();
  
  console.log('✅ Catálogo inicializado');
  console.log('🏪 Panadería Belén - Montero, Santa Cruz');
});