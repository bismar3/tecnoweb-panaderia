// ============================================
// SISTEMA DE CAMBIO DE TEMAS
// Incluye: Cambio manual + Automático según hora
// ============================================

// Obtener tema guardado o determinar según hora
function getInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        return savedTheme;
    }
    
    // Determinar tema según la hora (modo automático)
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 18) {
        return 'light'; // 6 AM - 6 PM: Tema claro
    } else if (hour >= 18 && hour < 22) {
        return 'default'; // 6 PM - 10 PM: Tema predeterminado
    } else {
        return 'dark'; // 10 PM - 6 AM: Tema oscuro
    }
}

// Aplicar tema
function applyTheme(theme) {
    const themeLink = document.getElementById('theme-link');
    
    if (!themeLink) {
        console.error('No se encontró el elemento theme-link');
        return;
    }
    
    // Cambiar el archivo CSS
    themeLink.href = `css/themes/theme-${theme}.css`;
    
    // Agregar atributo data-theme al body
    document.body.setAttribute('data-theme', theme);
    
    // Guardar en localStorage
    localStorage.setItem('theme', theme);
    
    // Actualizar botones activos
    updateThemeButtons(theme);
    
    console.log(`Tema cambiado a: ${theme}`);
}

// Actualizar estado visual de los botones
function updateThemeButtons(activeTheme) {
    const buttons = document.querySelectorAll('.theme-btn');
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        
        // Determinar qué botón activar según el tema
        const btnTheme = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        if (btnTheme === activeTheme) {
            btn.classList.add('active');
        }
    });
}

// Función para cambiar tema manualmente
function changeTheme(theme) {
    applyTheme(theme);
    
    // Mostrar notificación
    showThemeNotification(theme);
}

// Mostrar notificación de cambio de tema
function showThemeNotification(theme) {
    const notifications = {
        'default': '🌈 Tema Predeterminado activado',
        'dark': '🌙 Modo Oscuro activado',
        'light': '☀️ Tema Claro activado'
    };
    
    const message = notifications[theme] || 'Tema cambiado';
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.textContent = message;
    
    // Agregar al body
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Ocultar después de 2 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Detectar preferencia del sistema operativo
function getSystemThemePreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

// Escuchar cambios en la preferencia del sistema
function watchSystemTheme() {
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // Solo cambiar si el usuario no ha seleccionado manualmente
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                applyTheme(newTheme);
            }
        });
    }
}

// Cambiar tema automáticamente según la hora (opcional)
function autoThemeByTime() {
    const hour = new Date().getHours();
    let autoTheme;
    
    if (hour >= 6 && hour < 18) {
        autoTheme = 'light';
    } else if (hour >= 18 && hour < 22) {
        autoTheme = 'default';
    } else {
        autoTheme = 'dark';
    }
    
    // Solo aplicar si el usuario no ha seleccionado manualmente
    if (!localStorage.getItem('theme')) {
        applyTheme(autoTheme);
    }
}

// Resetear al tema automático
function resetToAutoTheme() {
    localStorage.removeItem('theme');
    const autoTheme = getInitialTheme();
    applyTheme(autoTheme);
    showThemeNotification('auto');
}

// Inicializar tema al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    
    // Escuchar cambios del sistema (opcional)
    watchSystemTheme();
    
    // Actualizar tema cada hora (opcional)
    setInterval(autoThemeByTime, 3600000); // Cada 1 hora
});

// Agregar estilos para la notificación
const style = document.createElement('style');
style.textContent = `
    .theme-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--card-bg);
        color: var(--text-primary);
        padding: 12px 20px;
        border-radius: 10px;
        box-shadow: var(--shadow);
        font-size: 0.9rem;
        font-weight: 500;
        z-index: 9999;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);
    }
    
    .theme-notification.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    .theme-btn.active {
        border-color: var(--primary-color);
        background: var(--hover-bg);
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);