// ============================================
// CONFIGURACIÓN DE AXIOS
// ============================================

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================
// INTERCEPTOR PARA AGREGAR TOKEN
// ============================================

api.interceptors.request.use(
    config => {
        // ✅ Buscar token en localStorage O sessionStorage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('🔑 Token enviado en la petición');
        } else {
            console.warn('⚠️ No hay token guardado');
        }
        
        return config;
    },
    error => {
        console.error('❌ Error en interceptor request:', error);
        return Promise.reject(error);
    }
);

// ============================================
// INTERCEPTOR PARA MANEJAR ERRORES
// ============================================

api.interceptors.response.use(
    response => {
        console.log('✅ Respuesta exitosa:', response.config.url);
        return response;
    },
    error => {
        console.error('❌ Error API:', error.response?.data || error.message);
        
        // Si es 401 o 403 (no autorizado), limpiar y redirigir a login
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('🔒 Sesión expirada, redirigiendo al login...');
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('usuario');
            window.location.href = '/frontend/page/login.html';
        }
        
        return Promise.reject(error);
    }
);

// ============================================
// FUNCIONES API - USUARIOS
// ============================================

const UsuariosAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/usuarios${query ? '?' + query : ''}`);
    },
    
    getById: (id) => api.get(`/usuarios/${id}`),
    
    create: (data) => api.post('/usuarios', data),
    
    update: (id, data) => api.put(`/usuarios/${id}`, data),
    
    delete: (id) => api.delete(`/usuarios/${id}`)
};

// ============================================
// FUNCIONES API - ROLES
// ============================================

const RolesAPI = {
    getAll: () => api.get('/roles'),
    
    getById: (id) => api.get(`/roles/${id}`),
    
    create: (data) => api.post('/roles', data),
    
    update: (id, data) => api.put(`/roles/${id}`, data),
    
    delete: (id) => api.delete(`/roles/${id}`)
};

// ============================================
// FUNCIONES API - PERMISOS
// ============================================

const PermisosAPI = {
    getAll: () => api.get('/permisos'),
    
    getById: (id) => api.get(`/permisos/${id}`),
    
    getByUsuario: (id_usuario) => api.get(`/permisos/usuario/${id_usuario}`),
    
    asignar: (id_usuario, permisos) => api.post('/permisos/asignar', { 
        id_usuario, 
        permisos 
    })
};

// ============================================
// FUNCIONES API - PRODUCTOS
// ============================================

const ProductosAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/productos${query ? '?' + query : ''}`);
    },
    
    getById: (id) => api.get(`/productos/${id}`),
    
    create: (data) => api.post('/productos', data),
    
    update: (id, data) => api.put(`/productos/${id}`, data),
    
    delete: (id) => api.delete(`/productos/${id}`)
};

// ============================================
// FUNCIONES API - CATEGORÍAS
// ============================================

const CategoriasAPI = {
    getAll: () => api.get('/categorias'),
    
    getById: (id) => api.get(`/categorias/${id}`),
    
    create: (data) => api.post('/categorias', data),
    
    update: (id, data) => api.put(`/categorias/${id}`, data),
    
    delete: (id) => api.delete(`/categorias/${id}`)
};

// ============================================
// FUNCIONES API - CLIENTES
// ============================================

const ClientesAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/clientes${query ? '?' + query : ''}`);
    },
    
    getById: (id) => api.get(`/clientes/${id}`),
    
    create: (data) => api.post('/clientes', data),
    
    update: (id, data) => api.put(`/clientes/${id}`, data),
    
    delete: (id) => api.delete(`/clientes/${id}`)
};

// ============================================
// EXPORTAR COMO WINDOW.API
// ============================================

window.API = {
    Usuarios: UsuariosAPI,
    Roles: RolesAPI,
    Permisos: PermisosAPI,
    Productos: ProductosAPI,
    Categorias: CategoriasAPI,
    Clientes: ClientesAPI
};

// Exportar también el objeto axios por si se necesita
window.api = api;

console.log('✅ API configurada correctamente con Axios');
console.log('📦 Módulos disponibles:', Object.keys(window.API));