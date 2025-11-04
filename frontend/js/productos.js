// ============================================
// MÓDULO DE PRODUCTOS
// ============================================

function initProductosModule() {
    console.log('Inicializando módulo de productos...');
    
    const listaProductos = document.getElementById('listaProductos');
    const modal = document.getElementById('modalProducto');
    const form = document.getElementById('formProducto');
    const btnNuevo = document.getElementById('btnNuevoProducto');
    const btnCerrar = document.getElementById('btnCerrarModal');
    const btnCancelar = document.getElementById('btnCancelar');
    const selectCategoria = document.getElementById('selectCategoria');
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroEstado = document.getElementById('filtroEstado');
    const buscarProducto = document.getElementById('buscarProducto');

    // ============================================
    // ABRIR/CERRAR MODAL
    // ============================================
    
    function abrirModal() {
        form.reset();
        document.getElementById('id_producto').value = '';
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-box"></i> Nuevo Producto';
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    function cerrarModal() {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    // Event listeners para modal
    if (btnNuevo) btnNuevo.onclick = abrirModal;
    if (btnCerrar) btnCerrar.onclick = cerrarModal;
    if (btnCancelar) btnCancelar.onclick = cerrarModal;

    // Cerrar modal al hacer clic en el overlay
    if (modal) {
        modal.onclick = (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                cerrarModal();
            }
        };
    }

    // ============================================
    // CARGAR CATEGORÍAS
    // ============================================
    
    async function cargarCategorias() {
        try {
            const response = await API.Categorias.getAll();
            
            if (response.success && response.data) {
                const options = response.data.map(c => 
                    `<option value="${c.id_categoria}">${c.nombre}</option>`
                ).join('');
                
                if (selectCategoria) {
                    selectCategoria.innerHTML = '<option value="">Sin categoría</option>' + options;
                }
                if (filtroCategoria) {
                    filtroCategoria.innerHTML = '<option value="">📁 Todas las categorías</option>' + options;
                }
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    }

    // ============================================
    // CARGAR PRODUCTOS
    // ============================================
    
    async function cargarProductos() {
        if (!listaProductos) return;

        listaProductos.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6;"></i>
                <p style="margin-top: 1rem; color: #666;">Cargando productos...</p>
            </div>
        `;

        try {
            const params = {};
            if (filtroEstado && filtroEstado.value) params.estado = filtroEstado.value;
            if (filtroCategoria && filtroCategoria.value) params.categoria = filtroCategoria.value;
            if (buscarProducto && buscarProducto.value) params.buscar = buscarProducto.value;
            
            const response = await API.Productos.getAll(params);
            
            if (response.success && response.data && response.data.length > 0) {
                listaProductos.innerHTML = response.data.map(p => `
                    <div class="producto-card">
                        <div class="producto-header">
                            <div class="producto-badge ${p.estado ? 'badge-activo' : 'badge-inactivo'}">
                                ${p.estado ? '✅ Activo' : '❌ Inactivo'}
                            </div>
                            <div class="producto-codigo">${p.codigo}</div>
                        </div>
                        
                        <div class="producto-body">
                            <h3 class="producto-nombre">${p.nombre}</h3>
                            
                            ${p.descripcion ? `<p class="producto-descripcion">${p.descripcion}</p>` : ''}
                            
                            <div class="producto-info">
                                <div class="info-item">
                                    <i class="fas fa-folder"></i>
                                    <span>${p.categoria_nombre || 'Sin categoría'}</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-ruler"></i>
                                    <span>${p.unidad_medida}</span>
                                </div>
                            </div>
                            
                            <div class="producto-precio">
                                Bs. ${parseFloat(p.precio_venta).toFixed(2)}
                            </div>
                        </div>
                        
                        <div class="producto-actions">
                            <button class="btn-action btn-edit" data-id="${p.id_producto}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-action btn-delete" data-id="${p.id_producto}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                `).join('');

                // Agregar event listeners a los botones de acción
                agregarEventListenersProductos();
            } else {
                listaProductos.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                        <i class="fas fa-box-open" style="font-size: 4rem; color: #ddd;"></i>
                        <h3 style="color: #999; margin-top: 1rem;">No hay productos</h3>
                        <p style="color: #bbb;">Comienza agregando tu primer producto</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            listaProductos.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>
                    <p style="margin-top: 1rem; color: #ef4444;">Error al cargar productos: ${error.message}</p>
                </div>
            `;
        }
    }

    // ============================================
    // EVENT LISTENERS PARA BOTONES DE PRODUCTOS
    // ============================================
    
    function agregarEventListenersProductos() {
        // Botones de editar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editarProducto(id);
            });
        });

        // Botones de eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                eliminarProducto(id);
            });
        });
    }

    // ============================================
    // GUARDAR PRODUCTO
    // ============================================
    
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            submitBtn.disabled = true;
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            data.estado = data.estado === 'true';
            data.precio_venta = parseFloat(data.precio_venta);
            
            if (!data.id_categoria) {
                delete data.id_categoria;
            }
            
            try {
                let response;
                
                if (data.id_producto) {
                    const id = data.id_producto;
                    delete data.id_producto;
                    response = await API.Productos.update(id, data);
                } else {
                    delete data.id_producto;
                    response = await API.Productos.create(data);
                }
                
                if (response.success) {
                    mostrarNotificacion('✅ ' + (response.message || 'Producto guardado correctamente'), 'success');
                    cerrarModal();
                    cargarProductos();
                }
            } catch (error) {
                mostrarNotificacion('❌ Error: ' + error.message, 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        };
    }

    // ============================================
    // EDITAR PRODUCTO
    // ============================================
    
    async function editarProducto(id) {
        try {
            const response = await API.Productos.getById(id);
            
            if (response.success && response.data) {
                const producto = response.data;
                
                document.getElementById('id_producto').value = producto.id_producto;
                form.codigo.value = producto.codigo;
                form.nombre.value = producto.nombre;
                form.descripcion.value = producto.descripcion || '';
                form.id_categoria.value = producto.id_categoria || '';
                form.unidad_medida.value = producto.unidad_medida;
                form.precio_venta.value = producto.precio_venta;
                form.estado.value = producto.estado.toString();
                
                document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Producto';
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('show'), 10);
            }
        } catch (error) {
            mostrarNotificacion('❌ Error al cargar producto: ' + error.message, 'error');
        }
    }

    // ============================================
    // ELIMINAR PRODUCTO
    // ============================================
    
    async function eliminarProducto(id) {
        if (!confirm('¿Está seguro de eliminar este producto?\n\nEsta acción lo marcará como inactivo.')) {
            return;
        }
        
        try {
            const response = await API.Productos.delete(id);
            
            if (response.success) {
                mostrarNotificacion('✅ Producto eliminado correctamente', 'success');
                cargarProductos();
            }
        } catch (error) {
            mostrarNotificacion('❌ Error al eliminar: ' + error.message, 'error');
        }
    }

    // ============================================
    // NOTIFICACIONES
    // ============================================
    
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const notif = document.createElement('div');
        notif.className = `notificacion notif-${tipo}`;
        notif.textContent = mensaje;
        document.body.appendChild(notif);
        
        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    // ============================================
    // EVENTOS DE FILTROS
    // ============================================
    
    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', cargarProductos);
    }
    
    if (filtroEstado) {
        filtroEstado.addEventListener('change', cargarProductos);
    }
    
    if (buscarProducto) {
        let searchTimeout;
        buscarProducto.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(cargarProductos, 500);
        });
    }

    // ============================================
    // INICIALIZAR
    // ============================================
    
    cargarCategorias();
    cargarProductos();
}

// Asegurar que la función esté disponible globalmente
window.initProductosModule = initProductosModule;