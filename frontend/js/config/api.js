// ============================================
// CONFIGURACIÓN DE LA API
// ============================================

const API_URL = 'http://localhost:3000/api';

async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        // Si no hay autorización, redirigir al login
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.href = '../login.html';
            throw new Error('Sesión expirada');
        }

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

// ============================================
// API DE USUARIOS
// ============================================

const UsuariosAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/usuarios${query ? '?' + query : ''}`);
    },
    
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

// ============================================
// API DE ROLES
// ============================================

const RolesAPI = {
    getAll: () => fetchAPI('/roles'),
    
    getById: (id) => fetchAPI(`/roles/${id}`),
    
    create: (data) => fetchAPI('/roles', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    update: (id, data) => fetchAPI(`/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    delete: (id) => fetchAPI(`/roles/${id}`, {
        method: 'DELETE'
    })
};

// ============================================
// API DE PERMISOS
// ============================================

const PermisosAPI = {
    getAll: () => fetchAPI('/permisos'),
    
    getById: (id) => fetchAPI(`/permisos/${id}`),
    
    getByUsuario: (id_usuario) => fetchAPI(`/permisos/usuario/${id_usuario}`),
    
    asignar: (id_usuario, permisos) => fetchAPI('/permisos/asignar', {
        method: 'POST',
        body: JSON.stringify({ id_usuario, permisos })
    })
};

// ============================================
// API DE PRODUCTOS
// ============================================

const ProductosAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/productos${query ? '?' + query : ''}`);
    },
    
    getById: (id) => fetchAPI(`/productos/${id}`),
    
    create: (data) => fetchAPI('/productos', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    update: (id, data) => fetchAPI(`/productos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    delete: (id) => fetchAPI(`/productos/${id}`, {
        method: 'DELETE'
    })
};

// ============================================
// API DE CATEGORÍAS
// ============================================

const CategoriasAPI = {
    getAll: () => fetchAPI('/categorias'),
    
    getById: (id) => fetchAPI(`/categorias/${id}`),
    
    create: (data) => fetchAPI('/categorias', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    update: (id, data) => fetchAPI(`/categorias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    delete: (id) => fetchAPI(`/categorias/${id}`, {
        method: 'DELETE'
    })
};

// ============================================
// API DE CLIENTES
// ============================================

const ClientesAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/clientes${query ? '?' + query : ''}`);
    },
    
    getById: (id) => fetchAPI(`/clientes/${id}`),
    
    create: (data) => fetchAPI('/clientes', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    update: (id, data) => fetchAPI(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    delete: (id) => fetchAPI(`/clientes/${id}`, {
        method: 'DELETE'
    })
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================

window.API = {
    API_URL,
    fetchAPI,
    Usuarios: UsuariosAPI,
    Roles: RolesAPI,
    Permisos: PermisosAPI,
    Productos: ProductosAPI,
    Categorias: CategoriasAPI,
    Clientes: ClientesAPI
};