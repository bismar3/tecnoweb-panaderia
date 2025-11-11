// ============================================
// PEDIDO.JS - REGISTRAR PEDIDOS
// ============================================

const API_URL = 'http://localhost:3000/api';

let map = null;
let marker = null;
let productosDelPedido = [];
let productoSeleccionado = null;
let todosLosProductos = [];
let ubicacionActual = null;

const UBICACION_DEFAULT = {
  latitud: -17.34317,
  longitud: -63.23354,
  direccion: 'Montero, Santa Cruz - Bolivia'
};

// ============================================
// INICIALIZAR
// ============================================

// Auto-inicializar cuando el script se carga
(function() {
  console.log('🛒 Script pedido.js cargado');
  
  // Esperar a que el DOM del módulo esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPedidoModule);
  } else {
    // Si ya está cargado, esperar un poco para que se renderice el HTML del módulo
    setTimeout(initPedidoModule, 200);
  }
})();

function initPedidoModule() {
  console.log('🛒 Inicializando módulo de Pedidos...');
  
  if (!verificarAutenticacion()) return;
  
  cargarUbicacion();
  generarNumeroPedido();
  
  // Esperar a que el mapa esté en el DOM
  const checkMap = setInterval(() => {
    if (document.getElementById('mapaPedido')) {
      clearInterval(checkMap);
      inicializarMapa();
      cargarProductos();
    }
  }, 100);
  
  // Timeout de seguridad
  setTimeout(() => clearInterval(checkMap), 5000);
}

// ============================================
// VERIFICAR AUTENTICACIÓN
// ============================================

function verificarAutenticacion() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
 
  if (!token) {
    alert('Debes iniciar sesión para crear un pedido');
    window.location.href = '../page/catalogo.html';
    return false;
  }
  return true;
}

// ============================================
// CARGAR UBICACIÓN
// ============================================

function cargarUbicacion() {
  const ubicacionGuardada = localStorage.getItem('ubicacionEntrega');
 
  if (ubicacionGuardada) {
    ubicacionActual = JSON.parse(ubicacionGuardada);
  } else {
    ubicacionActual = { ...UBICACION_DEFAULT };
  }
 
  actualizarUIUbicacion();
}

function actualizarUIUbicacion() {
  const nombreEl = document.getElementById('ubicacionNombre');
  const direccionEl = document.getElementById('ubicacionDireccion');
  
  if (nombreEl) {
    nombreEl.textContent = ubicacionActual.ciudad || 'Mi ubicación';
  }
  if (direccionEl) {
    direccionEl.textContent = ubicacionActual.direccion || ubicacionActual.direccion_entrega || 'Sin dirección específica';
  }
}

// ============================================
// GENERAR NÚMERO DE PEDIDO
// ============================================

async function generarNumeroPedido() {
  try {
    const response = await fetch(`${API_URL}/pedidos`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
      }
    });
   
    const data = await response.json();
   
    const numeroEl = document.getElementById('numeroPedido');
    if (numeroEl) {
      if (data.success && data.data.length > 0) {
        const ultimoPedido = data.data[0];
        const numero = parseInt(ultimoPedido.numero_pedido.replace('PED', ''));
        const siguiente = numero + 1;
        numeroEl.textContent = `Número de pedido: PED${String(siguiente).padStart(6, '0')}`;
      } else {
        numeroEl.textContent = 'Número de pedido: PED000001';
      }
    }
  } catch (error) {
    console.error('Error al generar número:', error);
    const numeroEl = document.getElementById('numeroPedido');
    if (numeroEl) numeroEl.textContent = 'Número de pedido: PED000001';
  }
}

// ============================================
// INICIALIZAR MAPA
// ============================================

function inicializarMapa() {
  const mapElement = document.getElementById('mapaPedido');
  if (!mapElement) {
    console.error('Elemento mapaPedido no encontrado');
    return;
  }

  const lat = ubicacionActual?.latitud || UBICACION_DEFAULT.latitud;
  const lng = ubicacionActual?.longitud || UBICACION_DEFAULT.longitud;
 
  // Limpiar mapa anterior si existe
  if (map) {
    map.remove();
  }

  map = L.map('mapaPedido', {
    center: [lat, lng],
    zoom: 15,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  marker = L.marker([lat, lng], {
    draggable: true,
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(map);

  marker.bindPopup('<strong>Ubicación de entrega</strong>').openPopup();

  marker.on('dragend', function(e) {
    const position = marker.getLatLng();
    ubicacionActual.latitud = position.lat;
    ubicacionActual.longitud = position.lng;
    actualizarDireccion(position.lat, position.lng);
  });

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 100);

  actualizarUIUbicacion();
  console.log('✅ Mapa inicializado');
}

async function actualizarDireccion(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`
    );
   
    const data = await response.json();
    const address = data.address || {};
   
    let direccion = '';
    if (address.road) {
      direccion = address.road;
      if (address.house_number) direccion += ' ' + address.house_number;
    } else if (address.neighbourhood) {
      direccion = address.neighbourhood;
    } else {
      direccion = data.display_name;
    }
   
    ubicacionActual.direccion = direccion;
    ubicacionActual.direccion_entrega = direccion;
    actualizarUIUbicacion();
   
  } catch (error) {
    console.error('Error al obtener dirección:', error);
  }
}

function cambiarUbicacion() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
       
        ubicacionActual.latitud = lat;
        ubicacionActual.longitud = lng;
       
        if (map && marker) {
          map.setView([lat, lng], 16);
          marker.setLatLng([lat, lng]);
        }
       
        actualizarDireccion(lat, lng);
      },
      (error) => {
        alert('No se pudo obtener tu ubicación. Por favor, arrastra el marcador manualmente.');
      }
    );
  } else {
    alert('Tu navegador no soporta geolocalización');
  }
}

// ============================================
// CARGAR PRODUCTOS
// ============================================

async function cargarProductos() {
  try {
    const response = await fetch(`${API_URL}/productos?estado=true`);
    const data = await response.json();
   
    if (data.success) {
      todosLosProductos = data.data || [];
      console.log('✅ Productos cargados:', todosLosProductos.length);
    }
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
}

// ============================================
// MODAL: AGREGAR PRODUCTO
// ============================================

function abrirModalProductos() {
  const modal = document.getElementById('modalAgregarProducto');
  if (modal) {
    modal.classList.add('show');
    renderizarProductosModal(todosLosProductos);
  }
}

function cerrarModalProductos() {
  const modal = document.getElementById('modalAgregarProducto');
  if (modal) modal.classList.remove('show');
}

function buscarProductoModal() {
  const busqueda = document.getElementById('buscarProducto').value.toLowerCase();
  const productosFiltrados = todosLosProductos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda) ||
    p.codigo.toLowerCase().includes(busqueda)
  );
  renderizarProductosModal(productosFiltrados);
}

function renderizarProductosModal(productos) {
  const lista = document.getElementById('listaProductosModal');
  if (!lista) return;
 
  if (productos.length === 0) {
    lista.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No se encontraron productos</p>';
    return;
  }
 
  let html = '';
  productos.forEach(producto => {
    html += `
      <div class="producto-item" onclick="seleccionarProducto(${producto.id_producto})">
        <div class="producto-item-info">
          <h4>${producto.nombre}</h4>
          <p>${producto.descripcion || 'Producto de calidad'}</p>
          <small>${producto.categoria_nombre || 'Sin categoría'} • ${producto.unidad_medida}</small>
        </div>
        <span class="producto-precio">Bs ${parseFloat(producto.precio_venta).toFixed(2)}</span>
        <button class="btn btn-primary btn-sm">
          <i class="fas fa-plus"></i>
        </button>
      </div>
    `;
  });
 
  lista.innerHTML = html;
}

function seleccionarProducto(id_producto) {
  productoSeleccionado = todosLosProductos.find(p => p.id_producto === id_producto);
  if (!productoSeleccionado) return;
  cerrarModalProductos();
  abrirModalCantidad();
}

// ============================================
// MODAL: CANTIDAD
// ============================================

function abrirModalCantidad() {
  const modal = document.getElementById('modalCantidad');
  const info = document.getElementById('productoSeleccionadoInfo');
  
  if (info) {
    info.innerHTML = `
      <h4>${productoSeleccionado.nombre}</h4>
      <p style="color: var(--text-secondary); margin: 0.5rem 0;">${productoSeleccionado.descripcion || ''}</p>
      <p style="font-size: 1.5em; color: var(--accent); font-weight: 600; margin-top: 1rem;">
        Bs ${parseFloat(productoSeleccionado.precio_venta).toFixed(2)}
      </p>
    `;
  }
 
  const inputCantidad = document.getElementById('inputCantidad');
  if (inputCantidad) inputCantidad.value = 1;
  
  if (modal) modal.classList.add('show');
}

function cerrarModalCantidad() {
  const modal = document.getElementById('modalCantidad');
  if (modal) modal.classList.remove('show');
  productoSeleccionado = null;
}

function confirmarAgregarProducto() {
  const cantidad = parseInt(document.getElementById('inputCantidad').value);
 
  if (!cantidad || cantidad <= 0) {
    alert('La cantidad debe ser mayor a 0');
    return;
  }
 
  const existente = productosDelPedido.find(p => p.id_producto === productoSeleccionado.id_producto);
 
  if (existente) {
    existente.cantidad += cantidad;
    existente.subtotal = existente.cantidad * existente.precio_unitario;
  } else {
    productosDelPedido.push({
      id_producto: productoSeleccionado.id_producto,
      nombre: productoSeleccionado.nombre,
      codigo: productoSeleccionado.codigo,
      cantidad: cantidad,
      precio_unitario: parseFloat(productoSeleccionado.precio_venta),
      subtotal: cantidad * parseFloat(productoSeleccionado.precio_venta),
      unidad_medida: productoSeleccionado.unidad_medida
    });
  }
 
  cerrarModalCantidad();
  renderizarTablaProductos();
  actualizarTotal();
 
  console.log('✅ Producto agregado:', productosDelPedido);
}

// ============================================
// AGREGAR DESDE CARRITO
// ============================================

async function agregarDesdeCarrito() {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
   
    const response = await fetch(`${API_URL}/carrito`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
   
    const data = await response.json();
   
    if (!data.success || !data.carrito || data.carrito.items.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }
   
    data.carrito.items.forEach(item => {
      const existente = productosDelPedido.find(p => p.id_producto === item.id_producto);
     
      if (existente) {
        existente.cantidad += item.cantidad;
        existente.subtotal = existente.cantidad * existente.precio_unitario;
      } else {
        productosDelPedido.push({
          id_producto: item.id_producto,
          nombre: item.producto.nombre,
          codigo: item.producto.codigo,
          cantidad: item.cantidad,
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal: parseFloat(item.subtotal),
          unidad_medida: item.producto.unidad_medida
        });
      }
    });
   
    renderizarTablaProductos();
    actualizarTotal();
   
    alert(`${data.carrito.items.length} productos agregados desde el carrito`);
   
  } catch (error) {
    console.error('Error al cargar carrito:', error);
    alert('Error al cargar productos del carrito');
  }
}

// ============================================
// RENDERIZAR TABLA DE PRODUCTOS
// ============================================

function renderizarTablaProductos() {
  const container = document.getElementById('tablaProductos');
  if (!container) return;
 
  if (productosDelPedido.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-shopping-basket"></i>
        <p>No hay productos agregados</p>
        <p style="font-size: 0.9em;">Usa los botones de arriba para agregar productos</p>
      </div>
    `;
    const btnRealizar = document.getElementById('btnRealizarPedido');
    if (btnRealizar) btnRealizar.disabled = true;
    return;
  }
 
  let html = `
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Código</th>
          <th>Cantidad</th>
          <th>Precio Unit.</th>
          <th>Subtotal</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
  `;
 
  productosDelPedido.forEach((producto, index) => {
    html += `
      <tr>
        <td><strong>${producto.nombre}</strong></td>
        <td>${producto.codigo}</td>
        <td>
          <input
            type="number"
            class="cantidad-input"
            value="${producto.cantidad}"
            min="1"
            onchange="actualizarCantidadProducto(${index}, this.value)"
          />
        </td>
        <td>Bs ${producto.precio_unitario.toFixed(2)}</td>
        <td><strong>Bs ${producto.subtotal.toFixed(2)}</strong></td>
        <td>
          <div class="producto-acciones">
            <button class="btn btn-danger btn-icon" onclick="eliminarProducto(${index})" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
 
  html += '</tbody></table>';
  container.innerHTML = html;
 
  const btnRealizar = document.getElementById('btnRealizarPedido');
  if (btnRealizar) btnRealizar.disabled = false;
}

function actualizarCantidadProducto(index, nuevaCantidad) {
  const cantidad = parseInt(nuevaCantidad);
 
  if (!cantidad || cantidad <= 0) {
    alert('La cantidad debe ser mayor a 0');
    renderizarTablaProductos();
    return;
  }
 
  productosDelPedido[index].cantidad = cantidad;
  productosDelPedido[index].subtotal = cantidad * productosDelPedido[index].precio_unitario;
 
  renderizarTablaProductos();
  actualizarTotal();
}

function eliminarProducto(index) {
  if (confirm('¿Eliminar este producto del pedido?')) {
    productosDelPedido.splice(index, 1);
    renderizarTablaProductos();
    actualizarTotal();
  }
}

// ============================================
// CALCULAR TOTAL
// ============================================

function actualizarTotal() {
  const total = productosDelPedido.reduce((sum, p) => sum + p.subtotal, 0);
  
  const totalEl = document.getElementById('totalMonto');
  const pedidoTotalEl = document.getElementById('pedidoTotal');
  
  if (totalEl) totalEl.textContent = `Bs ${total.toFixed(2)}`;
  if (pedidoTotalEl) {
    pedidoTotalEl.style.display = productosDelPedido.length > 0 ? 'flex' : 'none';
  }
}

// ============================================
// REALIZAR PEDIDO
// ============================================

async function realizarPedido() {
  if (productosDelPedido.length === 0) {
    alert('Debes agregar al menos un producto');
    return;
  }
 
  if (!ubicacionActual || !ubicacionActual.latitud || !ubicacionActual.longitud) {
    alert('Debes configurar la ubicación de entrega');
    return;
  }
 
  if (!confirm('¿Confirmar pedido?')) {
    return;
  }
 
  mostrarLoading(true);
 
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
   
    const pedidoData = {
      id_almacen: 1,
      fecha_entrega_estimada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      observaciones: '',
      descuento: 0,
      detalles: productosDelPedido.map(p => ({
        id_producto: p.id_producto,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario
      })),
      latitud: ubicacionActual.latitud,
      longitud: ubicacionActual.longitud,
      direccion_entrega: ubicacionActual.direccion || ubicacionActual.direccion_entrega || 'Sin dirección',
      desde_carrito: false
    };
   
    console.log('📦 Enviando pedido...', pedidoData);
   
    const response = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pedidoData)
    });
   
    const result = await response.json();
   
    if (!result.success) {
      throw new Error(result.message || 'Error al crear pedido');
    }
   
    console.log('✅ Pedido creado:', result.data);
   
    // Generar QR de pago
    const pagoData = {
      numero_pedido: result.data.numero_pedido,
      total: result.data.total,
      cliente_nombre: result.data.cliente_nombre,
      cliente_email: result.data.cliente_email || '',
      cliente_telefono: result.data.cliente_telefono || ''
    };
   
    const pagoQR = await LibelulaService.crearPagoQR(pagoData);
   
    console.log('✅ QR generado:', pagoQR);
   
    mostrarLoading(false);
    mostrarModalQR(result.data.numero_pedido, pagoQR.qr_image || pagoQR.qr_url);
   
    // Limpiar formulario
    productosDelPedido = [];
    renderizarTablaProductos();
    actualizarTotal();
   
  } catch (error) {
    console.error('❌ Error al realizar pedido:', error);
    mostrarLoading(false);
    alert(`Error: ${error.message}`);
  }
}

// ============================================
// MODAL QR
// ============================================

function mostrarModalQR(numeroPedido, qrImage) {
  const modal = document.getElementById('modalQR');
  const numeroEl = document.getElementById('qrNumeroPedido');
  const imgEl = document.getElementById('qrImage');
  
  if (numeroEl) numeroEl.textContent = numeroPedido;
  if (imgEl) imgEl.src = qrImage;
  if (modal) modal.classList.add('show');
}

function cerrarModalQR() {
  const modal = document.getElementById('modalQR');
  if (modal) modal.classList.remove('show');
 
  if (confirm('¿Ir a ver mis pedidos?')) {
    loadModule('pedidos');
  }
}

function descargarQR() {
  const qrImage = document.getElementById('qrImage').src;
  const numeroPedido = document.getElementById('qrNumeroPedido').textContent;
  const link = document.createElement('a');
  link.href = qrImage;
  link.download = `QR_Pago_${numeroPedido}.png`;
  link.click();
}

// ============================================
// CANCELAR PEDIDO
// ============================================

function cancelarPedido() {
  if (productosDelPedido.length > 0) {
    if (!confirm('¿Cancelar pedido? Se perderán todos los productos agregados.')) {
      return;
    }
  }
 
  productosDelPedido = [];
  renderizarTablaProductos();
  actualizarTotal();
 
  if (confirm('¿Volver al inicio del dashboard?')) {
    loadModule('home');
  }
}

// ============================================
// LOADING
// ============================================

function mostrarLoading(mostrar) {
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.style.display = mostrar ? 'flex' : 'none';
}

console.log('✅ pedido.js cargado completamente');