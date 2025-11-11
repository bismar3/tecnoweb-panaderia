// ============================================
// MÓDULO DE RECETAS - ACTUALIZADO (Versión con API.Recetas)
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
    
    // Selects
    const selectProductoBase = document.getElementById('selectProductoBase');
    const selectProductoFinal = document.getElementById('selectProductoFinal');
    const selectCategoria = document.getElementById('selectCategoria');
    const selectTipo = document.getElementById('selectTipo');
    
    // Filtros
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroNivelDificultad = document.getElementById('filtroNivelDificultad');
    const filtroEstado = document.getElementById('filtroEstado');
    const buscarReceta = document.getElementById('buscarReceta');
    
    // Ingredientes
    const listaIngredientes = document.getElementById('listaIngredientes');
    const mensajeIngredientes = document.getElementById('mensajeIngredientes');
    const btnAgregarIngrediente = document.getElementById('btnAgregarIngrediente');

    let ingredientesReceta = [];
    let productosDisponibles = [];
    let categoriasDisponibles = [];
    let tiposDisponibles = [];

    // ============================================
    // ABRIR/CERRAR MODALES
    // ============================================
    
    function abrirModal() {
        form.reset();
        form.querySelector('[name="id_receta"]').value = '';
        form.querySelector('[name="nivel_dificultad"]').value = 'Media';
        form.querySelector('[name="merma_porcentaje"]').value = '5.0';
        form.querySelector('[name="version"]').value = '1.0';
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
    // CARGAR INGREDIENTES
    // ============================================
    
    async function cargarIngredientes() {
        try {
            const response = await API.Ingredientes.getAll({ estado: 'true' });
            
            if (response.success && response.data) {
                productosDisponibles = response.data;
                
                const options = productosDisponibles.map(i => 
                    `<option value="${i.id_ingrediente}">${i.nombre} (${i.unidad_medida})</option>`
                ).join('');
                
                console.log('✅ Ingredientes cargados:', productosDisponibles.length);
            }
        } catch (error) {
            console.error('❌ Error al cargar ingredientes:', error);
            mostrarNotificacion('Error al cargar ingredientes', 'error');
        }
    }

    // ============================================
    // CARGAR CATEGORÍAS
    // ============================================
    
    async function cargarCategorias() {
        try {
            const response = await API.Categorias.getAll();
            
            if (response.success && response.data) {
                categoriasDisponibles = response.data;
                
                const options = categoriasDisponibles.map(c => 
                    `<option value="${c.id_categoria}">${c.nombre}</option>`
                ).join('');
                
                if (selectCategoria) {
                    selectCategoria.innerHTML = '<option value="">Sin categoría</option>' + options;
                }
                if (filtroCategoria) {
                    filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>' + options;
                }
                
                console.log('✅ Categorías cargadas:', categoriasDisponibles.length);
            }
        } catch (error) {
            console.error('❌ Error al cargar categorías:', error);
        }
    }

    // ============================================
    // CARGAR TIPOS (OPCIONAL)
    // ============================================
    
    async function cargarTipos() {
        try {
            // Si tienes la API de tipos, descomenta esto:
            // const response = await API.TiposReceta.getAll();
            // if (response.success && response.data) {
            //     tiposDisponibles = response.data;
            //     const options = tiposDisponibles.map(t => 
            //         `<option value="${t.id_tipo}">${t.nombre}</option>`
            //     ).join('');
            //     if (selectTipo) {
            //         selectTipo.innerHTML = '<option value="">Sin tipo</option>' + options;
            //     }
            //     console.log('✅ Tipos cargados:', tiposDisponibles.length);
            // }
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar tipos de receta:', error);
        }
    }

    // ============================================
    // GESTIÓN DE INGREDIENTES
    // ============================================
    
    if (btnAgregarIngrediente) {
        btnAgregarIngrediente.onclick = () => {
            ingredientesReceta.push({
                id_ingrediente: '',
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
                            <option value="">Seleccionar ingrediente</option>
                            ${productosDisponibles.map(i => 
                                `<option value="${i.id_ingrediente}" ${ing.id_ingrediente == i.id_ingrediente ? 'selected' : ''}>
                                    ${i.nombre}
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
                ingredientesReceta[index].id_ingrediente = e.target.value;
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
                <td colspan="8" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6;"></i>
                    <p style="margin-top: 1rem; color: #666;">Cargando recetas...</p>
                </td>
            </tr>
        `;

        try {
            const params = {};
            if (filtroEstado && filtroEstado.value) params.estado = filtroEstado.value;
            if (filtroCategoria && filtroCategoria.value) params.id_categoria = filtroCategoria.value;
            if (filtroNivelDificultad && filtroNivelDificultad.value) params.nivel_dificultad = filtroNivelDificultad.value;
            
            const response = await API.Recetas.getAll(params);
            console.log('📚 Respuesta completa:', response);
            
            // Manejar diferentes estructuras de respuesta
            let recetas = [];
            if (response.data && response.data.data) {
                recetas = response.data.data;
            } else if (response.data) {
                recetas = Array.isArray(response.data) ? response.data : [response.data];
            } else if (Array.isArray(response)) {
                recetas = response;
            }
            
            console.log('📚 Recetas procesadas:', recetas);
            
            if (!Array.isArray(recetas)) {
                throw new Error('Formato de datos incorrecto');
            }

            // Filtrar por búsqueda local
            if (buscarReceta && buscarReceta.value) {
                const buscar = buscarReceta.value.toLowerCase();
                recetas = recetas.filter(r => 
                    r.nombre.toLowerCase().includes(buscar) ||
                    (r.codigo && r.codigo.toLowerCase().includes(buscar)) ||
                    (r.descripcion && r.descripcion.toLowerCase().includes(buscar))
                );
            }
            
            if (recetas.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 3rem;">
                            <i class="fas fa-book-open" style="font-size: 4rem; color: #ddd;"></i>
                            <h3 style="color: #999; margin-top: 1rem;">No hay recetas</h3>
                            <p style="color: #bbb;">Comienza creando tu primera receta</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tabla.innerHTML = recetas.map(r => {
                const tiempoTotal = (parseInt(r.tiempo_preparacion) || 0) + 
                                  (parseInt(r.tiempo_fermentacion) || 0) + 
                                  (parseInt(r.tiempo_horneado) || 0);
                
                const dificultadColor = {
                    'Fácil': '#10b981',
                    'Media': '#f59e0b',
                    'Difícil': '#ef4444'
                };
                
                return `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        <strong>${r.codigo || 'S/C'}</strong>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        <strong>${r.nombre || 'N/A'}</strong>
                        ${r.descripcion ? `<br><small style="color: #666;">${r.descripcion.substring(0, 50)}${r.descripcion.length > 50 ? '...' : ''}</small>` : ''}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${r.categoria_nombre || 'Sin categoría'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        <span style="background: ${dificultadColor[r.nivel_dificultad] || '#6b7280'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            ${r.nivel_dificultad || 'Media'}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        ${parseFloat(r.rendimiento || 0).toFixed(2)} ${r.unidad_rendimiento || 'unidades'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        ${tiempoTotal > 0 ? tiempoTotal + ' min' : (r.tiempo_produccion ? r.tiempo_produccion + ' min' : 'N/A')}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        <span style="background: ${r.estado ? '#10b981' : '#ef4444'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            ${r.estado ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                        <button class="btn-ver" data-id="${r.id_receta}" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-edit" data-id="${r.id_receta}" style="background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" data-id="${r.id_receta}" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            }).join('');

            // Event listeners
            agregarEventListenersRecetas();

        } catch (error) {
            console.error('❌ Error al cargar recetas:', error);
            tabla.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem;">
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
            console.log('📖 Respuesta detalle:', response);
            
            // Manejar diferentes estructuras de respuesta
            let receta;
            if (response.data && response.data.data) {
                receta = response.data.data;
            } else if (response.data) {
                receta = response.data;
            } else {
                receta = response;
            }
            
            console.log('📖 Receta procesada:', receta);
            
            const tiempoTotal = (parseInt(receta.tiempo_preparacion) || 0) + 
                              (parseInt(receta.tiempo_fermentacion) || 0) + 
                              (parseInt(receta.tiempo_horneado) || 0);
            
            const contenido = document.getElementById('contenidoDetalles');
            contenido.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <!-- Encabezado -->
                    <div style="margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
                        <h3 style="color: #333; margin-bottom: 5px;">${receta.nombre}</h3>
                        <p style="color: #666; margin: 5px 0;"><strong>Código:</strong> ${receta.codigo || 'N/A'} | <strong>Versión:</strong> ${receta.version || '1.0'}</p>
                        ${receta.descripcion ? `<p style="color: #666; margin-top: 10px;">${receta.descripcion}</p>` : ''}
                    </div>
                    
                    <!-- Info Principal -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            <strong>Categoría:</strong><br>
                            ${receta.categoria_nombre || 'Sin categoría'}
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            <strong>Tipo:</strong><br>
                            ${receta.tipo_nombre || 'Sin tipo'}
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            <strong>Nivel de Dificultad:</strong><br>
                            ${receta.nivel_dificultad || 'Media'}
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            <strong>Estado:</strong><br>
                            <span style="color: ${receta.estado ? '#10b981' : '#ef4444'};">
                                ${receta.estado ? '✅ Activo' : '❌ Inactivo'}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Productos -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="background: #e8f5e9; padding: 10px; border-radius: 5px;">
                            <strong>Producto Base:</strong><br>
                            ${receta.producto_nombre || 'Sin producto'}
                        </div>
                        <div style="background: #e8f5e9; padding: 10px; border-radius: 5px;">
                            <strong>Producto Final:</strong><br>
                            ${receta.producto_final_nombre || 'Sin producto'}
                        </div>
                    </div>
                    
                    <!-- Tiempos -->
                    <h4 style="color: #333; margin-bottom: 10px;"><i class="fas fa-clock"></i> Tiempos de Producción</h4>
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                            <div>
                                <strong>Preparación:</strong><br>
                                ${receta.tiempo_preparacion || 0} min
                            </div>
                            <div>
                                <strong>Fermentación:</strong><br>
                                ${receta.tiempo_fermentacion || 0} min
                            </div>
                            <div>
                                <strong>Horneado:</strong><br>
                                ${receta.tiempo_horneado || 0} min
                            </div>
                            <div style="background: #1976d2; color: white; padding: 10px; border-radius: 5px; text-align: center;">
                                <strong>Total:</strong><br>
                                ${tiempoTotal} min
                            </div>
                        </div>
                    </div>
                    
                    <!-- Rendimiento y Costos -->
                    <h4 style="color: #333; margin-bottom: 10px;"><i class="fas fa-chart-line"></i> Rendimiento y Costos</h4>
                    <div style="background: #fff3e0; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                            <div>
                                <strong>Rendimiento:</strong><br>
                                ${receta.rendimiento} ${receta.unidad_rendimiento || 'unidades'}
                            </div>
                            <div>
                                <strong>Porciones:</strong><br>
                                ${receta.porciones || 'N/A'}
                            </div>
                            <div>
                                <strong>Merma:</strong><br>
                                ${receta.merma_porcentaje || 5}%
                            </div>
                            <div>
                                <strong>Costo Total:</strong><br>
                                Bs ${parseFloat(receta.costo_total || 0).toFixed(2)}
                            </div>
                            <div>
                                <strong>Costo Unitario:</strong><br>
                                Bs ${parseFloat(receta.costo_unitario || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Especificaciones Técnicas -->
                    ${receta.temperatura || receta.equipo ? `
                    <h4 style="color: #333; margin-bottom: 10px;"><i class="fas fa-thermometer-half"></i> Especificaciones Técnicas</h4>
                    <div style="background: #f3e5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        ${receta.temperatura ? `<p><strong>Temperatura:</strong> ${receta.temperatura}°C</p>` : ''}
                        ${receta.equipo ? `<p><strong>Equipo:</strong> ${receta.equipo}</p>` : ''}
                    </div>
                    ` : ''}
                    
                    <!-- Ingredientes -->
                    <h4 style="color: #333; margin-bottom: 10px;"><i class="fas fa-list"></i> Ingredientes</h4>
                    <div style="background: #fff8e1; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
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
                    
                    <!-- Aprobación y Notas -->
                    ${receta.aprobado_por || receta.notas ? `
                    <h4 style="color: #333; margin-bottom: 10px;"><i class="fas fa-check-circle"></i> Aprobación y Notas</h4>
                    <div style="background: #e0f2f1; padding: 15px; border-radius: 5px;">
                        ${receta.aprobado_por ? `<p><strong>Aprobado por:</strong> ${receta.aprobado_por}</p>` : ''}
                        ${receta.fecha_aprobacion ? `<p><strong>Fecha de aprobación:</strong> ${new Date(receta.fecha_aprobacion).toLocaleDateString()}</p>` : ''}
                        ${receta.notas ? `<p><strong>Notas:</strong> ${receta.notas}</p>` : ''}
                    </div>
                    ` : ''}
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
                ing.id_ingrediente && ing.cantidad && parseFloat(ing.cantidad) > 0
            );

            if (ingredientesValidos.length === 0) {
                mostrarNotificacion('Complete todos los campos de los ingredientes', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Convertir tipos de datos
            data.estado = data.estado === 'true';
            data.rendimiento = parseFloat(data.rendimiento);
            data.porciones = data.porciones ? parseInt(data.porciones) : null;
            data.temperatura = data.temperatura ? parseFloat(data.temperatura) : null;
            data.costo_total = data.costo_total ? parseFloat(data.costo_total) : 0;
            data.costo_unitario = data.costo_unitario ? parseFloat(data.costo_unitario) : 0;
            data.merma_porcentaje = data.merma_porcentaje ? parseFloat(data.merma_porcentaje) : 5.0;
            
            // Tiempos
            data.tiempo_produccion = data.tiempo_produccion ? parseInt(data.tiempo_produccion) : null;
            data.tiempo_preparacion = data.tiempo_preparacion ? parseInt(data.tiempo_preparacion) : null;
            data.tiempo_fermentacion = data.tiempo_fermentacion ? parseInt(data.tiempo_fermentacion) : null;
            data.tiempo_horneado = data.tiempo_horneado ? parseInt(data.tiempo_horneado) : null;
            
            // IDs
            if (!data.id_producto) delete data.id_producto;
            if (!data.id_producto_final) delete data.id_producto_final;
            if (!data.id_categoria) delete data.id_categoria;
            if (!data.id_tipo) delete data.id_tipo;
            
            // Strings vacíos a null
            if (!data.codigo) data.codigo = null;
            if (!data.equipo) data.equipo = null;
            if (!data.aprobado_por) data.aprobado_por = null;
            if (!data.fecha_aprobacion) data.fecha_aprobacion = null;
            if (!data.notas) data.notas = null;
            if (!data.imagen_url) data.imagen_url = null;

            // Agregar ingredientes
            data.ingredientes = ingredientesValidos.map(ing => ({
                id_ingrediente: parseInt(ing.id_ingrediente),
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
            console.log('✏️ Respuesta editar:', response);
            
            // Manejar diferentes estructuras de respuesta
            let receta;
            if (response.data && response.data.data) {
                receta = response.data.data;
            } else if (response.data) {
                receta = response.data;
            } else {
                receta = response;
            }
            
            if (response.success || receta) {
                
                form.querySelector('[name="id_receta"]').value = receta.id_receta;
                form.querySelector('[name="nombre"]').value = receta.nombre;
                form.querySelector('[name="codigo"]').value = receta.codigo || '';
                form.querySelector('[name="descripcion"]').value = receta.descripcion || '';
                form.querySelector('[name="id_producto"]').value = receta.id_producto || '';
                form.querySelector('[name="id_producto_final"]').value = receta.id_producto_final || '';
                form.querySelector('[name="id_categoria"]').value = receta.id_categoria || '';
                form.querySelector('[name="id_tipo"]').value = receta.id_tipo || '';
                form.querySelector('[name="nivel_dificultad"]').value = receta.nivel_dificultad || 'Media';
                form.querySelector('[name="rendimiento"]').value = receta.rendimiento;
                form.querySelector('[name="unidad_rendimiento"]').value = receta.unidad_rendimiento || 'unidades';
                form.querySelector('[name="porciones"]').value = receta.porciones || '';
                form.querySelector('[name="tiempo_preparacion"]').value = receta.tiempo_preparacion || '';
                form.querySelector('[name="tiempo_fermentacion"]').value = receta.tiempo_fermentacion || '';
                form.querySelector('[name="tiempo_horneado"]').value = receta.tiempo_horneado || '';
                form.querySelector('[name="tiempo_produccion"]').value = receta.tiempo_produccion || '';
                form.querySelector('[name="temperatura"]').value = receta.temperatura || '';
                form.querySelector('[name="equipo"]').value = receta.equipo || '';
                form.querySelector('[name="costo_total"]').value = receta.costo_total || '';
                form.querySelector('[name="costo_unitario"]').value = receta.costo_unitario || '';
                form.querySelector('[name="merma_porcentaje"]').value = receta.merma_porcentaje || '5.0';
                form.querySelector('[name="version"]').value = receta.version || '1.0';
                form.querySelector('[name="aprobado_por"]').value = receta.aprobado_por || '';
                form.querySelector('[name="fecha_aprobacion"]').value = receta.fecha_aprobacion ? receta.fecha_aprobacion.split('T')[0] : '';
                form.querySelector('[name="notas"]').value = receta.notas || '';
                form.querySelector('[name="imagen_url"]').value = receta.imagen_url || '';
                form.querySelector('[name="estado"]').value = receta.estado.toString();
                
                // Cargar ingredientes
                ingredientesReceta = (receta.ingredientes || []).map(ing => ({
                    id_ingrediente: ing.id_ingrediente,
                    cantidad: ing.cantidad,
                    unidad: ing.unidad
                }));
                
                renderizarIngredientes();
                
                document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Receta';
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('show'), 10);
            } else {
                throw new Error('No se pudo cargar la receta');
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
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    // ============================================
    // EVENTOS DE FILTROS
    // ============================================
    
    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', cargarRecetas);
    }
    
    if (filtroNivelDificultad) {
        filtroNivelDificultad.addEventListener('change', cargarRecetas);
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
    
    cargarIngredientes();
    cargarCategorias();
    cargarTipos();
    cargarRecetas();
    
    console.log('✅ Módulo de recetas inicializado correctamente');
}

// Asegurar que la función esté disponible globalmente
window.initRecetasModule = initRecetasModule;