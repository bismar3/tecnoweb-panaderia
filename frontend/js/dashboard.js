// ============================================
// DASHBOARD - SISTEMA COMPLETO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (typeof auth !== 'undefined' && !auth.isAuthenticated()) {
        window.location.href = '../login.html';
        return;
    }

    // Inicializar dashboard
    initDashboard();
    
    // Actualizar fecha
    updateCurrentDate();
    
    // Cargar estadísticas del home
    loadDashboardStats();

    // Cargar módulos al hacer clic en el sidebar
    document.querySelectorAll('.sidebar a[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            loadModule(section);
            
            // Actualizar clase activa
            document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Toggle sidebar en móvil
    document.getElementById('menu-toggle')?.addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('show');
    });

    // Cerrar sidebar al hacer clic fuera (móvil)
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menu-toggle');
        
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        }
    });

    // Botón refrescar (si existe)
    document.getElementById('btnRefresh')?.addEventListener('click', () => {
        location.reload();
    });

    // Cargar módulo por defecto (home)
    loadModule('productos');
});

// ============================================
// INICIALIZAR DASHBOARD
// ============================================

function initDashboard() {
    console.log('Dashboard inicializado');
}

// ============================================
// ACTUALIZAR FECHA ACTUAL
// ============================================

function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = new Date().toLocaleDateString('es-ES', options);
    }
}

// ============================================
// CARGAR ESTADÍSTICAS DEL DASHBOARD
// ============================================

async function loadDashboardStats() {
    try {
        // TODO: Conectar con el backend
        // const stats = await API.Dashboard.getStats();
        
        // Datos de ejemplo por ahora
        updateStat('ventasDia', 'Bs 2,450.00');
        updateStat('pedidosActivos', '12');
        updateStat('productosStock', '156');
        updateStat('produccionHoy', '8');
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Actualizar valor de una estadística
function updateStat(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// ============================================
// FUNCIÓN PARA CARGAR MÓDULOS DINÁMICAMENTE
// ============================================

async function loadModule(moduleName) {
    const mainContent = document.getElementById('dash-content');
    
    if (!mainContent) {
        console.error('Elemento dash-content no encontrado');
        return;
    }
    
    // Mostrar loading
    mainContent.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 400px;">
            <div style="text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary-color);"></i>
                <p style="margin-top: 1rem; color: var(--text-secondary);">Cargando módulo...</p>
            </div>
        </div>
    `;
    
    try {
        // ✅ CORREGIDO: Ruta correcta /page/ en lugar de modulo/
        const response = await fetch(`/page/${moduleName}.html`);
        
        if (!response.ok) {
            mainContent.innerHTML = `
                <div class="content-section active">
                    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1.5rem; margin: 2rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ff9800;"></i>
                            <div>
                                <h3 style="margin: 0 0 0.5rem 0; color: #856404;">Módulo no encontrado</h3>
                                <p style="margin: 0; color: #856404;">El módulo "${moduleName}" no está disponible o en desarrollo.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Cargar solo el body
        mainContent.innerHTML = doc.body.innerHTML;
        
        // Re-ejecutar scripts
        const scripts = mainContent.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            
            // Mantener el type="module" si lo tiene
            if (oldScript.type) {
                newScript.type = oldScript.type;
            }
            
            if (oldScript.src) {
                newScript.src = oldScript.src;
            }
            
            newScript.textContent = oldScript.textContent;
            
            // Copiar atributos
            Array.from(oldScript.attributes).forEach(attr => {
                if (attr.name !== 'src' && attr.name !== 'type') {
                    newScript.setAttribute(attr.name, attr.value);
                }
            });
            
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        
        console.log(`✅ Módulo ${moduleName} cargado correctamente`);
        
    } catch (error) {
        console.error('Error al cargar módulo:', error);
        mainContent.innerHTML = `
            <div class="content-section active">
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 1.5rem; margin: 2rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <i class="fas fa-times-circle" style="font-size: 2rem; color: #dc3545;"></i>
                        <div>
                            <h3 style="margin: 0 0 0.5rem 0; color: #721c24;">Error al cargar módulo</h3>
                            <p style="margin: 0; color: #721c24;">No se pudo cargar el módulo. Por favor, intente nuevamente.</p>
                            <small style="color: #721c24; opacity: 0.8;">${error.message}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}