// ============================================
// MÓDULO DE RECETAS
// ============================================

function initRecetasModule() {
    console.log('🚀 Inicializando módulo de recetas...');
    
    const tabla = document.querySelector('#tablaRecetas tbody');
    const modal = document.getElementById('modalReceta');
    const modalDetalles = document.getElementById('modalDetalles');
    const form = document.getElementById('formReceta');
    const btnNueva = document.getElementById('btnNuevaReceta');
    const btnCerrar = document.getElementById('btnCerrarModal');
    const btnCerrarDetalles = document.getElementById('btnCerrarDetalles');
    const selectProductoBase = document.getElementById('selectProductoBase');
    const filtroProducto = document.getElementById('filtroProducto');
    const filtroEstado = document.getElementById('filtroEstado');
    const buscarReceta = document.getElementById('buscarReceta');
    const listaIngredientes = document.getElementById('listaIngredientes');
    const mensajeIngredientes = document.getElementById('mensajeIngredientes');
    const btnAgregarIngrediente = document.getElementById('btnAgregarIngrediente');

    let ingredientesReceta = [];
    let productosDisponibles = [];

    // ============================================
    // ABRIR/CERRAR MODALES
    // ============================================
    
    function abrirModal() {
        form.reset();
        form.querySelector('[name="id_receta"]').value = '';
        ingredientesReceta = [];
        renderizarIngredientes();
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-book"></i> Nueva Receta';
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    function cerrarModal() {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    function cerrarModalDetalles() {
        modalDetalles.classList.remove('show');
        setTimeout(() => modalDetalles.style.display = 'none', 300);
    }

    // Event listeners para modales
    if (btnNueva) btnNueva.onclick = abrirModal;
    if (btnCerrar) btnCerrar.onclick = cerrarModal;
    if (btnCerrarDetalles) btnCerrarDetalles.onclick = cerrarModalDetalles;

    // Cerrar modal al hacer clic en el overlay
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                cerrarModal();
            }
        };
    }

    if (modalDetalles) {
        modalDetalles.onclick = (e) => {
            if (e.target === modalDetalles) {
                cerrarModalDetalles();
            }
        };
    }

    // ============================================
    // CARGAR PRODUCTOS
    // ============================================
    
    async function cargarProductos() {
        try {
            const response = await API.Productos.getAll({ estado: 'true' });
            
            if (response.success && response.data) {
                productosDisponibles = response.data;
                
                const options = productosDisponibles.map(p => 
                    `<option value="${p.id_producto}">${p.nombre} (${p.unidad_medida})</option>`
                ).join('');
                
                if (selectProductoBase) {
                    selectProductoBase.innerHTML = '<option value="">Sin producto base</option>' + options;
                }
                if (filtroProducto) {
                    filtroProducto.innerHTML = '<option value="">Todos los productos</option>' + options;
                }
                
                console.log('✅ Productos cargados:', productosDisponibles.length);
            }
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            mostrarNotificacion('Error al cargar productos', 'error');
        }
    }

    // ============================================
    // GESTIÓN DE INGREDIENTES
    // ============================================
    
    if (btnAgregarIngrediente) {
        btnAgregarIngrediente.onclick = () => {
            ingredientesReceta.push({
                id_producto: '',
                cantidad: '',
                unidad: 'kg'
            });
            renderizarIngredientes();
        };
    }

    function renderizarIngredientes() {
        if (!listaIngredientes || !mensajeIngredientes) return;

        if (ingredientesReceta.length === 0) {
            listaIngredientes.style.display = 'none';
            mensajeIngredientes.style.display = 'block';
            return;
        }

        listaIngredientes.style.display = 'block';
        mensajeIngredientes.style.display = 'none';

        listaIngredientes.innerHTML = ingredientesReceta.map((ing, index) => `
            <div style="background: white; border: 1px solid #ddd; border-radius: 5px; padding: 10px; margin-bottom: 10px;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div style="flex: 2;">
                        <select class="select-ingrediente" data-index="${index}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="">Seleccionar producto</option>
                            ${productosDisponibles.map(p => 
                                `<option value="${p.id_producto}" ${ing.id_producto == p.id_producto ? 'selected' : ''}>
                                    ${p.nombre}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <input type="number" class="input-cantidad" data-index="${index}" 
                               value="${ing.cantidad}" placeholder="Cantidad" step="0.01" min="0.01"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="flex: 1;">
                        <select class="select-unidad" data-index="${index}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="kg" ${ing.unidad === 'kg' ? 'selected' : ''}>kg</option>
                            <option value="g" ${ing.unidad === 'g' ? 'selected' : ''}>g</option>
                            <option value="l" ${ing.unidad === 'l' ? 'selected' : ''}>l</option>
                            <option value="ml" ${ing.unidad === 'ml' ? 'selected' : ''}>ml</option>
                            <option value="unidad" ${ing.unidad === 'unidad' ? 'selected' : ''}>unidad</option>
                        </select>
                    </div>
                    <button type="button" class="btn-eliminar-ingrediente" data-index="${index}" 
                            style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Event listeners para ingredientes
        agregarEventListenersIngredientes();
    }

    function agregarEventListenersIngredientes() {
        document.querySelectorAll('.select-ingrediente').forEach(select => {
            select.onchange = (e) => {
                const index = parseInt(e.target.dataset.index);
                ingredientesReceta[index].id_producto = e.target.value;
            };
        });

        document.querySelectorAll('.input-cantidad').forEach(input => {
            input.oninput = (e) => {
                const index = parseInt(e.target.dataset.index);
                ingredientesReceta[index].cantidad = e.target.value;
            };
        });

        document.querySelectorAll('.select-unidad').forEach(select => {
            select.onchange = (e) => {
                const index = parseInt(e.target.dataset.index);
                ingredientesReceta[index].unidad = e.target.value;
            };
        });

        document.querySelectorAll('.btn-eliminar-ingrediente').forEach(btn => {
            btn.onclick = (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                ingredientesReceta.splice(index, 1);
                renderizarIngredientes();
            };
        });
    }

    // ============================================
    // CARGAR RECETAS
    // ============================================
    
    async function cargarRecetas() {
        if (!tabla) return;

        tabla.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6;"></i>
                    <p style="margin-top: 1rem; color: #666;">Cargando recetas...</p>
                </td>
            </tr>
        `;

        try {
            const params = {};
            if (filtroEstado && filtroEstado.value) params.estado = filtroEstado.value;
            if (filtroProducto && filtroProducto.value) params.id_producto = filtroProducto.value;
            
            const response = await API.Recetas.getAll(params);
            
            let recetas = response.data.data || response.data;
            
            if (!Array.isArray(recetas)) {
                throw new Error('Formato de datos incorrecto');
            }

            // Filtrar por búsqueda local
            if (buscarReceta && buscarReceta.value) {
                const buscar = buscarReceta.value.toLowerCase();
                recetas = recetas.filter(r => 
                    r.nombre.toLowerCase().includes(buscar) ||
                    (r.descripcion && r.descripcion.toLowerCase().includes(buscar))
                );
            }
            
            if (recetas.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 3rem;">
                            <i class="fas fa-book-open" style="font-size: 4rem; color: #ddd;"></i>
                            <h3 style="color: #999; margin-top: 1rem;">No hay recetas</h3>
                            <p style="color: #bbb;">Comienza creando tu primera receta</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tabla.innerHTML = recetas.map(r => `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        <strong>${r.nombre || 'N/A'}</strong>
                        ${r.descripcion ? `<br><small style="color: #666;">${r.descripcion}</small>` : ''}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${r.producto_nombre || 'Sin producto'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${parseFloat(r.rendimiento || 0).toFixed(2)}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${r.tiempo_produccion ? r.tiempo_produccion + ' min' : 'N/A'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        <button class="btn-ver" data-id="${r.id_receta}" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        <span style="background: ${r.estado ? '#10b981' : '#ef4444'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            ${r.estado ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        <button class="btn-edit" data-id="${r.id_receta}" style="background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" data-id="${r.id_receta}" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            // Event listeners
            agregarEventListenersRecetas();

        } catch (error) {
            console.error('❌ Error al cargar recetas:', error);
            tabla.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>
                        <p style="margin-top: 1rem; color: #ef4444;">Error al cargar recetas: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }

    // ============================================
    // EVENT LISTENERS PARA BOTONES DE RECETAS
    // ============================================
    
    function agregarEventListenersRecetas() {
        document.querySelectorAll('.btn-ver').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                verDetalles(id);
            });
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editarReceta(id);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                eliminarReceta(id);
            });
        });
    }

    // ============================================
    // VER DETALLES
    // ============================================
    
    async function verDetalles(id) {
        try {
            const response = await API.Recetas.getById(id);
            const receta = response.data.data || response.data;
            
            const contenido = document.getElementById('contenidoDetalles');
            contenido.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #333; margin-bottom: 10px;">${receta.nombre}</h3>
                    ${receta.descripcion ? `<p style="color: #666; margin-bottom: 15px;">${receta.descripcion}</p>` : ''}
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            <strong>Producto Base:</strong><br>
                            ${receta.producto_nombre || 'Sin producto'}
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            <strong>Rendimiento:</strong><br>
                            ${receta.rendimiento} ${receta.producto_unidad || ''}
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            <strong>Tiempo:</strong><br>
                            ${receta.tiempo_produccion || 'N/A'} minutos
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            <strong>Estado:</strong><br>
                            <span style="color: ${receta.estado ? '#10b981' : '#ef4444'};">
                                ${receta.estado ? '✅ Activo' : '❌ Inactivo'}
                            </span>
                        </div>
                    </div>
                    
                    <h4 style="color: #333; margin-bottom: 10px;"><i class="fas fa-list"></i> Ingredientes</h4>
                    <div style="background: #fff3e0; padding: 15px; border-radius: 5px;">
                        ${receta.ingredientes && receta.ingredientes.length > 0 ? 
                            receta.ingredientes.map(ing => `
                                <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #ffe0b2;">
                                    <span><i class="fas fa-circle" style="font-size: 6px; color: #ff9800;"></i> ${ing.ingrediente_nombre}</span>
                                    <strong>${ing.cantidad} ${ing.unidad}</strong>
                                </div>
                            `).join('') 
                            : '<p style="text-align: center; color: #999;">Sin ingredientes</p>'
                        }
                    </div>
                </div>
            `;
            
            modalDetalles.style.display = 'flex';
            setTimeout(() => modalDetalles.classList.add('show'), 10);
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar detalles de la receta', 'error');
        }
    }

    // ============================================
    // GUARDAR RECETA
    // ============================================
    
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            submitBtn.disabled = true;
            
            // Validar ingredientes
            if (ingredientesReceta.length === 0) {
                mostrarNotificacion('Debe agregar al menos un ingrediente', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            const ingredientesValidos = ingredientesReceta.filter(ing => 
                ing.id_producto && ing.cantidad && parseFloat(ing.cantidad) > 0
            );

            if (ingredientesValidos.length === 0) {
                mostrarNotificacion('Complete todos los campos de los ingredientes', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            data.estado = data.estado === 'true';
            data.rendimiento = parseFloat(data.rendimiento);
            data.tiempo_produccion = data.tiempo_produccion ? parseInt(data.tiempo_produccion) : null;
            
            if (!data.id_producto) {
                delete data.id_producto;
            }

            // Agregar ingredientes
            data.ingredientes = ingredientesValidos.map(ing => ({
                id_producto: parseInt(ing.id_producto),
                cantidad: parseFloat(ing.cantidad),
                unidad: ing.unidad
            }));

            try {
                let response;
                
                if (data.id_receta) {
                    const id = data.id_receta;
                    delete data.id_receta;
                    response = await API.Recetas.update(id, data);
                } else {
                    delete data.id_receta;
                    response = await API.Recetas.create(data);
                }
                
                if (response.success) {
                    mostrarNotificacion('✅ ' + (response.message || 'Receta guardada correctamente'), 'success');
                    cerrarModal();
                    cargarRecetas();
                }
            } catch (error) {
                mostrarNotificacion('❌ Error: ' + (error.response?.data?.message || error.message), 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        };
    }

    // ============================================
    // EDITAR RECETA
    // ============================================
    
    async function editarReceta(id) {
        try {
            const response = await API.Recetas.getById(id);
            
            if (response.success && response.data) {
                const receta = response.data;
                
                form.querySelector('[name="id_receta"]').value = receta.id_receta;
                form.querySelector('[name="nombre"]').value = receta.nombre;
                form.querySelector('[name="descripcion"]').value = receta.descripcion || '';
                form.querySelector('[name="id_producto"]').value = receta.id_producto || '';
                form.querySelector('[name="rendimiento"]').value = receta.rendimiento;
                form.querySelector('[name="tiempo_produccion"]').value = receta.tiempo_produccion || '';
                form.querySelector('[name="estado"]').value = receta.estado.toString();
                
                // Cargar ingredientes
                ingredientesReceta = (receta.ingredientes || []).map(ing => ({
                    id_producto: ing.id_producto,
                    cantidad: ing.cantidad,
                    unidad: ing.unidad
                }));
                
                renderizarIngredientes();
                
                document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Receta';
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('show'), 10);
            }
        } catch (error) {
            mostrarNotificacion('❌ Error al cargar receta: ' + error.message, 'error');
        }
    }

    // ============================================
    // ELIMINAR RECETA
    // ============================================
    
    async function eliminarReceta(id) {
        if (!confirm('¿Está seguro de eliminar esta receta?\n\nEsta acción la marcará como inactiva.')) {
            return;
        }
        
        try {
            const response = await API.Recetas.delete(id);
            
            if (response.success) {
                mostrarNotificacion('✅ Receta eliminada correctamente', 'success');
                cargarRecetas();
            }
        } catch (error) {
            mostrarNotificacion('❌ Error al eliminar: ' + (error.response?.data?.message || error.message), 'error');
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
    
    if (filtroProducto) {
        filtroProducto.addEventListener('change', cargarRecetas);
    }
    
    if (filtroEstado) {
        filtroEstado.addEventListener('change', cargarRecetas);
    }
    
    if (buscarReceta) {
        let searchTimeout;
        buscarReceta.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(cargarRecetas, 500);
        });
    }

    // ============================================
    // INICIALIZAR
    // ============================================
    
    cargarProductos();
    cargarRecetas();
    
    console.log('✅ Módulo de recetas inicializado correctamente');
}

// Asegurar que la función esté disponible globalmente
window.initRecetasModule = initRecetasModule;