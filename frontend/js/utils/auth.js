// ============================================
// SISTEMA DE AUTENTICACIÓN
// Maneja login, logout, verificación de sesión
// ============================================

const API_URL = 'http://localhost:3000/api';

// ============================================
// VERIFICACIÓN DE AUTENTICACIÓN
// ============================================

function isAuthenticated() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return !!token;
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getUserData() {
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function getUserRole() {
    const userData = getUserData();
    return userData?.roles || [];
}

// ============================================
// LOGIN
// ============================================

async function login(email, password, remember = false) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al iniciar sesión');
        }

        // Guardar token y datos del usuario
        const storage = remember ? localStorage : sessionStorage;
        
        storage.setItem('token', data.token);
        storage.setItem('userData', JSON.stringify(data.usuario));

        return {
            success: true,
            data: data
        };

    } catch (error) {
        console.error('Error en login:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Limpiar sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userData');
    
    // Redirigir al login
    window.location.href = 'login.html';
}

// ============================================
// VERIFICACIÓN DE PERMISOS
// ============================================

function hasPermission(permissionName) {
    const userData = getUserData();
    if (!userData || !userData.permisos) return false;
    
    return userData.permisos.some(p => p.nombre === permissionName);
}

function hasRole(roleName) {
    const roles = getUserRole();
    return roles.some(r => r.nombre === roleName || r === roleName);
}

function isAdmin() {
    return hasRole('admin') || hasRole('Administrador');
}

// ============================================
// ACTUALIZAR ÚLTIMO ACCESO
// ============================================

async function updateLastAccess() {
    try {
        const token = getToken();
        const userData = getUserData();
        
        if (!token || !userData) return;

        await fetch(`${API_URL}/usuarios/${userData.id_usuario}/ultimo-acceso`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Error al actualizar último acceso:', error);
    }
}

// ============================================
// INTERCEPTOR DE PETICIONES
// ============================================

async function authenticatedFetch(url, options = {}) {
    const token = getToken();
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        
        // Si el token expiró o es inválido
        if (response.status === 401 || response.status === 403) {
            logout();
            throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        }

        return response;
    } catch (error) {
        console.error('Error en petición autenticada:', error);
        throw error;
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Actualizar último acceso si está autenticado
    if (isAuthenticated()) {
        updateLastAccess();
    }

    // Configurar botón de logout si existe
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Está seguro de que desea cerrar sesión?')) {
                logout();
            }
        });
    }

    // Mostrar nombre de usuario si existe
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        const userData = getUserData();
        if (userData) {
            userNameElement.textContent = userData.nombre;
        }
    }
});

// ============================================
// MANEJO DE SESIÓN EXPIRADA
// ============================================

// Verificar cada 5 minutos si la sesión sigue activa
setInterval(() => {
    if (isAuthenticated()) {
        const userData = getUserData();
        const token = getToken();
        
        if (!userData || !token) {
            logout();
        }
    }
}, 300000); // 5 minutos

// ============================================
// EXPORTAR FUNCIONES
// ============================================

window.auth = {
    isAuthenticated,
    requireAuth,
    login,
    logout,
    getToken,
    getUserData,
    getUserRole,
    hasPermission,
    hasRole,
    isAdmin,
    authenticatedFetch
};