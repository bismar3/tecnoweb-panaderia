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
// FUNCIONES API - PROVEEDORES
// ============================================

const ProveedoresAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/proveedores${query ? '?' + query : ''}`);
    },
    
    getById: (id) => api.get(`/proveedores/${id}`),
    
    create: (data) => api.post('/proveedores', data),
    
    update: (id, data) => api.put(`/proveedores/${id}`, data),
    
    cambiarEstado: (id, estado) => api.patch(`/proveedores/${id}/estado`, { estado }),
    
    delete: (id) => api.delete(`/proveedores/${id}`),
    
    getHistorialCompras: (id, limit = 10) => api.get(`/proveedores/${id}/compras?limit=${limit}`),
    
    getEstadisticas: (id) => api.get(`/proveedores/${id}/estadisticas`)
};

// ============================================
// FUNCIONES API - ALMACENES ✨ NUEVO
// ============================================

const AlmacenesAPI = {
    /**
     * Obtener todos los almacenes con filtros opcionales
     * @param {Object} params - Filtros: { estado: 'true'|'false' }
     * @returns {Promise} Lista de almacenes
     */
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/almacenes${query ? '?' + query : ''}`);
    },
    
    /**
     * Obtener almacén por ID
     * @param {number} id - ID del almacén
     * @returns {Promise} Almacén
     */
    getById: (id) => api.get(`/almacenes/${id}`),
    
    /**
     * Obtener productos de un almacén
     * @param {number} id - ID del almacén
     * @returns {Promise} Lista de productos en el almacén
     */
    getProductos: (id) => api.get(`/almacenes/${id}/productos`),
    
    /**
     * Crear nuevo almacén
     * @param {Object} data - { nombre, ubicacion?, capacidad_maxima? }
     * @returns {Promise} Almacén creado
     */
    create: (data) => api.post('/almacenes', data),
    
    /**
     * Actualizar almacén existente
     * @param {number} id - ID del almacén
     * @param {Object} data - Datos a actualizar
     * @returns {Promise} Almacén actualizado
     */
    update: (id, data) => api.put(`/almacenes/${id}`, data),
    
    /**
     * Eliminar almacén (soft delete - marca como inactivo)
     * @param {number} id - ID del almacén
     * @returns {Promise} Confirmación de eliminación
     */
    delete: (id) => api.delete(`/almacenes/${id}`)
};

// ============================================
// FUNCIONES API - RECETAS
// ============================================

const RecetasAPI = {
    /**
     * Obtener todas las recetas con filtros opcionales
     * @param {Object} params - Filtros: { estado: 'true'|'false', id_producto: number }
     * @returns {Promise} Lista de recetas
     */
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/recetas${query ? '?' + query : ''}`);
    },
    
    /**
     * Obtener receta por ID con sus ingredientes
     * @param {number} id - ID de la receta
     * @returns {Promise} Receta con ingredientes
     */
    getById: (id) => api.get(`/recetas/${id}`),
    
    /**
     * Crear nueva receta con ingredientes
     * @param {Object} data - { nombre, descripcion?, id_producto?, tiempo_produccion?, rendimiento, ingredientes: [{id_producto, cantidad, unidad}] }
     * @returns {Promise} Receta creada
     */
    create: (data) => api.post('/recetas', data),
    
    /**
     * Actualizar receta existente
     * @param {number} id - ID de la receta
     * @param {Object} data - Datos a actualizar (incluir ingredientes si se desean actualizar)
     * @returns {Promise} Receta actualizada
     */
    update: (id, data) => api.put(`/recetas/${id}`, data),
    
    /**
     * Eliminar receta (soft delete - marca como inactiva)
     * @param {number} id - ID de la receta
     * @returns {Promise} Confirmación de eliminación
     */
    delete: (id) => api.delete(`/recetas/${id}`)
};

// ============================================
// FUNCIONES API - PRODUCCIÓN ✨ NUEVO
// ============================================

const ProduccionAPI = {
    /**
     * Obtener todas las producciones con filtros
     * @param {Object} params - Filtros: { estado, id_almacen, fecha_desde, fecha_hasta }
     */
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/producciones${query ? '?' + query : ''}`);
    },
    
    /**
     * Obtener producción por ID con ingredientes
     */
    getById: (id) => api.get(`/producciones/${id}`),
    
    /**
     * Crear nueva orden de producción (valida stock)
     */
    create: (data) => api.post('/producciones', data),
    
    /**
     * Iniciar producción (descuenta ingredientes)
     */
    iniciar: (id) => api.patch(`/producciones/${id}/iniciar`),
    
    /**
     * Completar producción (agrega producto terminado)
     */
    completar: (id, data) => api.patch(`/producciones/${id}/completar`, data),
    
    /**
     * Cancelar producción
     */
    cancelar: (id, data) => api.patch(`/producciones/${id}/cancelar`, data)
};
// ============================================
// FUNCIONES API - AUTENTICACIÓN ✨ AGREGAR
// ============================================

const AuthAPI = {
    /**
     * Registrar nuevo usuario (asigna rol Cliente automáticamente)
     * @param {Object} data - { nombre, email, password, telefono?, direccion?, nit? }
     * @returns {Promise} Usuario registrado
     */
    register: (data) => api.post('/auth/register', data),
    
    /**
     * Iniciar sesión
     * @param {Object} credentials - { email, password }
     * @returns {Promise} { token, user }
     */
    login: (credentials) => api.post('/auth/login', credentials),
    
    /**
     * Cerrar sesión (opcional si tienes logout en backend)
     */
    logout: () => api.post('/auth/logout'),
    
    /**
     * Verificar token
     */
    verifyToken: () => api.get('/auth/verify'),
    
    /**
     * Refrescar token
     */
    refreshToken: () => api.post('/auth/refresh')
};
// ============================================
// EXPORTAR COMO WINDOW.API
// ============================================

window.API = {
    Auth: AuthAPI,   
    Usuarios: UsuariosAPI,
    Roles: RolesAPI,
    Permisos: PermisosAPI,
    Productos: ProductosAPI,
    Categorias: CategoriasAPI,
    Clientes: ClientesAPI,
    Proveedores: ProveedoresAPI,
    Almacenes: AlmacenesAPI,
    Recetas: RecetasAPI,
    Produccion: ProduccionAPI  // ✨ NUEVO
};

window.api = api;

console.log('✅ API configurada correctamente con Axios');
console.log('📦 Módulos disponibles:', Object.keys(window.API));