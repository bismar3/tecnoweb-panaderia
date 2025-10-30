// ============================================
// GESTIÓN DE USUARIOS
// ============================================

/*const API_URL = 'http://localhost:3000/api';*/

let usuarios = [];
let roles = [];
let permisos = [];
let usuarioActual = null;
let paginaActual = 1;
const itemsPorPagina = 10;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
   /* if (!requireAuth()) {
        return;
    }
    */
    initializeUsuarios();
    setupEventListeners();
});

function initializeUsuarios() {
    loadUsuarios();
    loadRoles();
    loadPermisos();
}

function setupEventListeners() {
    // Botón nuevo usuario
    const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
    btnNuevoUsuario?.addEventListener('click', () => openModal());
    
    // Cerrar modales
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Click fuera del modal
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModals();
            }
        });
    });
    
    // Botones del formulario
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');
    
    btnGuardar?.addEventListener('click', saveUsuario);
    btnCancelar?.addEventListener('click', closeModals);
    
    // Permisos
    const btnVerPermisos = document.getElementById('btnVerPermisos');
    const btnGuardarPermisos = document.getElementById('btnGuardarPermisos');
    const btnCerrarPermisos = document.getElementById('btnCerrarPermisos');
    
    btnVerPermisos?.addEventListener('click', openPermisosModal);
    btnGuardarPermisos?.addEventListener('click', savePermisos);
    btnCerrarPermisos?.addEventListener('click', closePermisosModal);
    
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    const btnSearch = document.getElementById('btnSearch');
    
    searchInput?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filterUsuarios();
        }
    });
    
    btnSearch?.addEventListener('click', filterUsuarios);
    
    // Filtros
    const filterRole = document.getElementById('filterRole');
    const filterStatus = document.getElementById('filterStatus');
    
    filterRole?.addEventListener('change', filterUsuarios);
    filterStatus?.addEventListener('change', filterUsuarios);
    
    // Paginación
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    
    btnPrev?.addEventListener('click', () => changePage(-1));
    btnNext?.addEventListener('click', () => changePage(1));
    
    // Switch de estado
    const estadoSwitch = document.getElementById('estado');
    estadoSwitch?.addEventListener('change', updateSwitchText);
    
    // Exportar
    const btnExport = document.getElementById('btnExport');
    btnExport?.addEventListener('click', exportUsuarios);
}

// ============================================
// CARGA DE DATOS
// ============================================

async function loadUsuarios() {
    showLoading(true);
    
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/usuarios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            usuarios = data.usuarios || [];
        } else {
            throw new Error('Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar usuarios', 'error');
        loadSampleUsuarios();
    } finally {
        showLoading(false);
        displayUsuarios();
    }
}

function loadSampleUsuarios() {
    usuarios = [
        {
            id_usuario: 1,
            nombre: 'Juan Pérez',
            email: 'juan@panaderia.com',
            estado: true,
            roles: ['Administrador'],
            ultimo_acceso: '2025-10-29 10:30:00'
        },
        {
            id_usuario: 2,
            nombre: 'María González',
            email: 'maria@panaderia.com',
            estado: true,
            roles: ['Vendedor'],
            ultimo_acceso: '2025-10-29 09:15:00'
        },
        {
            id_usuario: 3,
            nombre: 'Carlos Rodríguez',
            email: 'carlos@panaderia.com',
            estado: false,
            roles: ['Producción'],
            ultimo_acceso: '2025-10-28 18:45:00'
        }
    ];
}

async function loadRoles() {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/roles`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            roles = data.roles || [];
        } else {
            throw new Error('Error al cargar roles');
        }
    } catch (error) {
        console.error('Error:', error);
        loadSampleRoles();
    }
    
    displayRoles();
}

function loadSampleRoles() {
    roles = [
        { id_rol: 1, nombre: 'Administrador' },
        { id_rol: 2, nombre: 'Vendedor' },
        { id_rol: 3, nombre: 'Producción' },
        { id_rol: 4, nombre: 'Inventario' }
    ];
}

async function loadPermisos() {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/permisos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            permisos = data.permisos || [];
        } else {
            throw new Error('Error al cargar permisos');
        }
    } catch (error) {
        console.error('Error:', error);
        loadSamplePermisos();
    }
}

function loadSamplePermisos() {
    permisos = [
        { id_permiso: 1, nombre: 'Crear Usuarios', descripcion: 'Permite crear nuevos usuarios' },
        { id_permiso: 2, nombre: 'Editar Usuarios', descripcion: 'Permite editar usuarios existentes' },
        { id_permiso: 3, nombre: 'Eliminar Usuarios', descripcion: 'Permite eliminar usuarios' },
        { id_permiso: 4, nombre: 'Ver Reportes', descripcion: 'Permite ver reportes del sistema' },
        { id_permiso: 5, nombre: 'Gestionar Productos', descripcion: 'Permite gestionar productos' },
        { id_permiso: 6, nombre: 'Gestionar Pedidos', descripcion: 'Permite gestionar pedidos' }
    ];
}

// ============================================
// VISUALIZACIÓN
// ============================================

function displayUsuarios() {
    const tbody = document.getElementById('tablaUsuariosBody');
    
    if (!tbody) return;
    
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const usuariosPagina = usuarios.slice(inicio, fin);
    
    if (usuariosPagina.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-users" style="font-size: 3rem; color: #ccc; display: block; margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary, #666);">No hay usuarios para mostrar</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = usuariosPagina.map(usuario => `
        <tr>
            <td>
                <input type="checkbox" class="user-checkbox" data-id="${usuario.id_usuario}">
            </td>
            <td>${usuario.id_usuario}</td>
            <td><strong>${usuario.nombre}</strong></td>
            <td>${usuario.email}</td>
            <td>
                <div class="role-tags">
                    ${usuario.roles.map(rol => `<span class="role-tag">${rol}</span>`).join('')}
                </div>
            </td>
            <td>
                <span class="status-badge ${usuario.estado ? 'active' : 'inactive'}">
                    ${usuario.estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${formatDate(usuario.ultimo_acceso)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editUsuario(${usuario.id_usuario})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn permissions" onclick="openPermisosModal(${usuario.id_usuario})" title="Permisos">
                        <i class="fas fa-shield-alt"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteUsuario(${usuario.id_usuario})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    updatePagination();
}

function displayRoles() {
    const rolesContainer = document.getElementById('rolesContainer');
    
    if (!rolesContainer) return;
    
    rolesContainer.innerHTML = roles.map(rol => `
        <label>
            <input type="checkbox" name="roles" value="${rol.id_rol}">
            <span>${rol.nombre}</span>
        </label>
    `).join('');
}

function displayPermisos() {
    const permisosContainer = document.getElementById('permisosContainer');
    
    if (!permisosContainer) return;
    
    permisosContainer.innerHTML = permisos.map(permiso => `
        <label>
            <input type="checkbox" name="permisos" value="${permiso.id_permiso}">
            <span><strong>${permiso.nombre}</strong><br>
            <small>${permiso.descripcion}</small></span>
        </label>
    `).join('');
}

// ============================================
// FILTRADO Y BÚSQUEDA
// ============================================

function filterUsuarios() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('filterRole').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filtered = [...usuarios];
    
    // Filtro de búsqueda
    if (searchTerm) {
        filtered = filtered.filter(u => 
            u.nombre.toLowerCase().includes(searchTerm) ||
            u.email.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtro de rol
    if (roleFilter) {
        filtered = filtered.filter(u => 
            u.roles.some(r => r.toLowerCase().includes(roleFilter.toLowerCase()))
        );
    }
    
    // Filtro de estado
    if (statusFilter !== '') {
        const isActive = statusFilter === 'true';
        filtered = filtered.filter(u => u.estado === isActive);
    }
    
    // Guardar filtrados temporalmente
    const usuariosOriginal = usuarios;
    usuarios = filtered;
    paginaActual = 1;
    displayUsuarios();
    usuarios = usuariosOriginal;
}

// ============================================
// PAGINACIÓN
// ============================================

function changePage(direction) {
    const totalPages = Math.ceil(usuarios.length / itemsPorPagina);
    const newPage = paginaActual + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        paginaActual = newPage;
        displayUsuarios();
    }
}

function updatePagination() {
    const totalPages = Math.ceil(usuarios.length / itemsPorPagina);
    const paginationInfo = document.getElementById('paginationInfo');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    
    if (paginationInfo) {
        paginationInfo.textContent = `Página ${paginaActual} de ${totalPages || 1}`;
    }
    
    if (btnPrev) {
        btnPrev.disabled = paginaActual === 1;
    }
    
    if (btnNext) {
        btnNext.disabled = paginaActual >= totalPages;
    }
}

// ============================================
// MODALES
// ============================================

function openModal(usuario = null) {
    const modal = document.getElementById('modalUsuario');
    const modalTitulo = document.getElementById('modalTitulo');
    
    usuarioActual = usuario;
    
    if (usuario) {
        modalTitulo.innerHTML = '<i class="fas fa-user-edit"></i> Editar Usuario';
        fillForm(usuario);
    } else {
        modalTitulo.innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Usuario';
        clearForm();
    }
    
    modal.classList.add('active');
}

function openPermisosModal(userId = null) {
    const modal = document.getElementById('modalPermisos');
    const nombreUsuario = document.getElementById('nombreUsuarioPermisos');
    
    if (userId) {
        const usuario = usuarios.find(u => u.id_usuario === userId);
        if (usuario) {
            nombreUsuario.textContent = usuario.nombre;
        }
    } else if (usuarioActual) {
        nombreUsuario.textContent = usuarioActual.nombre;
    }
    
    displayPermisos();
    modal.classList.add('active');
}

function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
}

function closePermisosModal() {
    const modal = document.getElementById('modalPermisos');
    modal.classList.remove('active');
}

// ============================================
// CRUD OPERACIONES
// ============================================

async function saveUsuario() {
    const id = document.getElementById('usuarioId').value;
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const estado = document.getElementById('estado').checked;
    
    // Validaciones
    if (!nombre || !email) {
        showNotification('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Por favor ingrese un email válido', 'error');
        return;
    }
    
    if (!id && !password) {
        showNotification('La contraseña es requerida para nuevos usuarios', 'error');
        return;
    }
    
    if (password && password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (password && password.length < 8) {
        showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }
    
    // Obtener roles seleccionados
    const rolesSeleccionados = Array.from(document.querySelectorAll('input[name="roles"]:checked'))
        .map(input => parseInt(input.value));
    
    if (rolesSeleccionados.length === 0) {
        showNotification('Debe seleccionar al menos un rol', 'error');
        return;
    }
    
    const userData = {
        nombre,
        email,
        password,
        estado,
        roles: rolesSeleccionados
    };
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const url = id ? `${API_URL}/usuarios/${id}` : `${API_URL}/usuarios`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            showNotification(
                id ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
                'success'
            );
            closeModals();
            loadUsuarios();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Error al guardar usuario', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión con el servidor', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteUsuario(id) {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showNotification('Usuario eliminado exitosamente', 'success');
            loadUsuarios();
        } else {
            showNotification('Error al eliminar usuario', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión con el servidor', 'error');
    } finally {
        showLoading(false);
    }
}

function editUsuario(id) {
    const usuario = usuarios.find(u => u.id_usuario === id);
    if (usuario) {
        openModal(usuario);
    }
}

async function savePermisos() {
    const permisosSeleccionados = Array.from(document.querySelectorAll('input[name="permisos"]:checked'))
        .map(input => parseInt(input.value));
    
    // Aquí se implementaría la lógica para guardar permisos
    showNotification('Permisos actualizados exitosamente', 'success');
    closePermisosModal();
}

// ============================================
// UTILIDADES
// ============================================

function fillForm(usuario) {
    document.getElementById('usuarioId').value = usuario.id_usuario;
    document.getElementById('nombre').value = usuario.nombre;
    document.getElementById('email').value = usuario.email;
    document.getElementById('estado').checked = usuario.estado;
    document.getElementById('password').removeAttribute('required');
    document.getElementById('confirmPassword').removeAttribute('required');
    
    updateSwitchText();
}

function clearForm() {
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('password').setAttribute('required', 'required');
    document.getElementById('confirmPassword').setAttribute('required', 'required');
    updateSwitchText();
}

function updateSwitchText() {
    const estadoSwitch = document.getElementById('estado');
    const switchText = document.querySelector('.switch-text');
    
    if (switchText) {
        switchText.textContent = estadoSwitch.checked ? 'Activo' : 'Inactivo';
    }
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Implementación simple de notificaciones
    alert(message);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-BO') + ' ' + date.toLocaleTimeString('es-BO', {hour: '2-digit', minute: '2-digit'});
}

function exportUsuarios() {
    // Implementación básica de exportación a CSV
    const csv = ['ID,Nombre,Email,Estado,Roles'];
    
    usuarios.forEach(u => {
        csv.push(`${u.id_usuario},"${u.nombre}","${u.email}",${u.estado ? 'Activo' : 'Inactivo'},"${u.roles.join(', ')}"`);
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv';
    a.click();
}

// Hacer funciones globales
window.editUsuario = editUsuario;
window.deleteUsuario = deleteUsuario;
window.openPermisosModal = openPermisosModal;