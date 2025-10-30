// Configuración de la API
const API_URL = 'http://localhost:3000/api';

// Token de autenticación (se guarda después del login)
let authToken = localStorage.getItem('token') || '';

// Función genérica para hacer peticiones
async function fetchAPI(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }

        return data;
    } catch (error) {
        console.error('Error en la API:', error);
        throw error;
    }
}

// Función para guardar el token
function setToken(token) {
    authToken = token;
    localStorage.setItem('token', token);
}

// Función para cerrar sesión
function logout() {
    authToken = '';
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// API de Usuarios
const UsuariosAPI = {
    getAll: () => fetchAPI('/usuarios'),
    getById: (id) => fetchAPI(`/usuarios/${id}`),
    create: (data) => fetchAPI('/usuarios', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => fetchAPI(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => fetchAPI(`/usuarios/${id}`, {
        method: 'DELETE'
    })
};

// API de Roles
const RolesAPI = {
    getAll: () => fetchAPI('/roles')
};

// API de Permisos
const PermisosAPI = {
    getAll: () => fetchAPI('/permisos'),
    getByUsuario: (id_usuario) => fetchAPI(`/permisos/usuario/${id_usuario}`),
    asignar: (id_usuario, permisos) => fetchAPI(`/permisos/asignar`, {
        method: 'POST',
        body: JSON.stringify({ id_usuario, permisos })
    })
};