// ============================================
// DASHBOARD CLIENTE - frontend/js/dashboard-cliente.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (typeof auth !== 'undefined' && !auth.isAuthenticated()) {
        window.location.href = '../../login.html';
        return;
    }

    initClientDashboard();
    updateCurrentDate();
    loadClientStats();

    // Cargar módulos
    document.querySelectorAll('.sidebar a[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            loadClientModule(section);
            document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Toggle sidebar móvil
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('show');
    });

    document.addEventListener('click', e => {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('menu-toggle');
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });

    // Cargar por defecto: Mis Pedidos
    loadClientModule('pedidos');
});

function initClientDashboard() {
    console.log('Dashboard Cliente inicializado');
}

function updateCurrentDate() {
    const el = document.getElementById('currentDate');
    if (el) {
        el.textContent = new Date().toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

async function loadClientStats() {
    try {
        // Ejemplo: await API.Cliente.getStats();
        updateStat('pedidosPendientes', '2');
        updateStat('pedidosMes', '8');
        updateStat('totalGastado', 'Bs 1,240.00');
        updateStat('promocionesActivas', '3');
    } catch (err) {
        console.error('Error en stats:', err);
    }
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ============================================
// CARGAR MÓDULOS CLIENTE
// ============================================

async function loadClientModule(module) {
    const container = document.getElementById('dash-content');
    if (!container) return;

    container.innerHTML = loadingHTML();

    try {
        // Ruta: frontend/page/cliente/modulos/pedidos.html
        const res = await fetch(`../modulos/${module}.html`);
        if (!res.ok) throw new Error('Módulo no encontrado');

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        container.innerHTML = doc.body.innerHTML;

        // Re-ejecutar scripts
        container.querySelectorAll('script').forEach(old => {
            const script = document.createElement('script');
            script.textContent = old.textContent;
            if (old.src) script.src = old.src;
            old.parentNode.replaceChild(script, old);
        });

    } catch (err) {
        container.innerHTML = errorHTML(module, err);
    }
}

function loadingHTML() {
    return `
        <div style="display:flex;justify-content:center;align-items:center;height:60vh;">
            <i class="fas fa-spinner fa-spin" style="font-size:3rem;color:var(--primary-color);"></i>
            <p style="margin-left:1rem;color:var(--text-secondary);">Cargando...</p>
        </div>
    `;
}

function errorHTML(module, err) {
    return `
        <div class="content-section" style="padding:2rem;">
            <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:1.5rem;">
                <h3><i class="fas fa-exclamation-triangle" style="color:#ff9800;"></i> En desarrollo</h3>
                <p>La sección "<strong>${module}</strong>" estará disponible pronto.</p>
            </div>
        </div>
    `;
}