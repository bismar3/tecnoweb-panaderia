-- ============================================
-- SISTEMA DE GESTIÓN DE PRODUCCIÓN E INVENTARIOS
-- Script de Inicialización de Base de Datos
-- ============================================

-- Eliminar tablas si existen
DROP TABLE IF EXISTS log_actividades CASCADE;
DROP TABLE IF EXISTS visitas_paginas CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS promociones_productos CASCADE;
DROP TABLE IF EXISTS promociones CASCADE;
DROP TABLE IF EXISTS metodos_pago CASCADE;
DROP TABLE IF EXISTS compras_detalles CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS entregas CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS pedidos_detalles CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS movimientos_inventario CASCADE;
DROP TABLE IF EXISTS metodos_inventario CASCADE;
DROP TABLE IF EXISTS producciones CASCADE;
DROP TABLE IF EXISTS recetas_detalles CASCADE;
DROP TABLE IF EXISTS recetas CASCADE;
DROP TABLE IF EXISTS productos_almacenes CASCADE;
DROP TABLE IF EXISTS almacenes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios_roles_permisos CASCADE;
DROP TABLE IF EXISTS roles_permisos CASCADE;
DROP TABLE IF EXISTS permisos CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ============================================
-- MÓDULO 1: SEGURIDAD (ESTRUCTURA DE LA IMAGEN)
-- ============================================

-- Tabla: usuarios
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado BOOLEAN DEFAULT FALSE,
    fecha_bloqueo TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: roles
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: permisos
CREATE TABLE permisos (
    id_permiso SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: roles_permisos (relación Rol-Permiso)
CREATE TABLE roles_permisos (
    id_rol_permiso SERIAL PRIMARY KEY,
    id_rol INTEGER REFERENCES roles(id_rol) ON DELETE CASCADE,
    id_permiso INTEGER REFERENCES permisos(id_permiso) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_rol, id_permiso)
);

-- Tabla: usuarios_roles_permisos (asignación Usuario-Rol-Permiso)
CREATE TABLE usuarios_roles_permisos (
    id_usuario_rol_permiso SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_rol INTEGER REFERENCES roles(id_rol) ON DELETE CASCADE,
    id_permiso INTEGER REFERENCES permisos(id_permiso) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, id_rol, id_permiso)
);

-- ============================================
-- MÓDULO 2: PRODUCTOS Y ALMACENES
-- ============================================

CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    id_categoria INTEGER REFERENCES categorias(id_categoria),
    unidad_medida VARCHAR(20) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE almacenes (
    id_almacen SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200),
    capacidad_maxima DECIMAL(10,2),
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos_almacenes (
    id_producto_almacen SERIAL PRIMARY KEY,
    id_producto INTEGER REFERENCES productos(id_producto) ON DELETE CASCADE,
    id_almacen INTEGER REFERENCES almacenes(id_almacen) ON DELETE CASCADE,
    cantidad DECIMAL(10,2) DEFAULT 0,
    stock_minimo DECIMAL(10,2) DEFAULT 0,
    stock_maximo DECIMAL(10,2),
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_producto, id_almacen)
);

-- ============================================
-- MÓDULO 3: PRODUCCIÓN Y RECETAS
-- ============================================

CREATE TABLE recetas (
    id_receta SERIAL PRIMARY KEY,
    id_producto INTEGER REFERENCES productos(id_producto),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tiempo_produccion INTEGER,
    rendimiento DECIMAL(10,2),
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recetas_detalles (
    id_receta_detalle SERIAL PRIMARY KEY,
    id_receta INTEGER REFERENCES recetas(id_receta) ON DELETE CASCADE,
    id_producto INTEGER REFERENCES productos(id_producto),
    cantidad DECIMAL(10,2) NOT NULL,
    unidad VARCHAR(20) NOT NULL
);

CREATE TABLE producciones (
    id_produccion SERIAL PRIMARY KEY,
    id_receta INTEGER REFERENCES recetas(id_receta),
    id_almacen INTEGER REFERENCES almacenes(id_almacen),
    cantidad_producir DECIMAL(10,2) NOT NULL,
    cantidad_producida DECIMAL(10,2) DEFAULT 0,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'pendiente',
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 4: INVENTARIOS
-- ============================================

CREATE TABLE metodos_inventario (
    id_metodo SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE
);

CREATE TABLE movimientos_inventario (
    id_movimiento SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL,
    id_producto INTEGER REFERENCES productos(id_producto),
    id_almacen INTEGER REFERENCES almacenes(id_almacen),
    cantidad DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,2),
    motivo VARCHAR(100),
    referencia VARCHAR(100),
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 5: CLIENTES Y PEDIDOS (MAESTRO-DETALLE)
-- ============================================

CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    nit VARCHAR(20),
    tipo VARCHAR(20) DEFAULT 'regular',
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MAESTRO: Pedidos
CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    id_cliente INTEGER REFERENCES clientes(id_cliente),
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_estimada DATE,
    estado VARCHAR(20) DEFAULT 'pendiente',
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    observaciones TEXT
);

-- DETALLE: Productos del pedido
CREATE TABLE pedidos_detalles (
    id_pedido_detalle SERIAL PRIMARY KEY,
    id_pedido INTEGER REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INTEGER REFERENCES productos(id_producto),
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- ============================================
-- MÓDULO 6: ENTREGAS Y DELIVERY
-- ============================================

CREATE TABLE deliveries (
    id_delivery SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    vehiculo VARCHAR(50),
    placa VARCHAR(20),
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entregas (
    id_entrega SERIAL PRIMARY KEY,
    id_pedido INTEGER REFERENCES pedidos(id_pedido),
    id_delivery INTEGER REFERENCES deliveries(id_delivery),
    fecha_salida TIMESTAMP,
    fecha_entrega TIMESTAMP,
    direccion_entrega TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 7: PROVEEDORES Y COMPRAS (MAESTRO-DETALLE)
-- ============================================

CREATE TABLE proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    nit VARCHAR(20),
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MAESTRO: Compras
CREATE TABLE compras (
    id_compra SERIAL PRIMARY KEY,
    numero_compra VARCHAR(50) UNIQUE NOT NULL,
    id_proveedor INTEGER REFERENCES proveedores(id_proveedor),
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    observaciones TEXT
);

-- DETALLE: Productos de la compra
CREATE TABLE compras_detalles (
    id_compra_detalle SERIAL PRIMARY KEY,
    id_compra INTEGER REFERENCES compras(id_compra) ON DELETE CASCADE,
    id_producto INTEGER REFERENCES productos(id_producto),
    cantidad DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- ============================================
-- MÓDULO 8: PROMOCIONES Y PAGOS
-- ============================================

CREATE TABLE promociones (
    id_promocion SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promociones_productos (
    id_promocion_producto SERIAL PRIMARY KEY,
    id_promocion INTEGER REFERENCES promociones(id_promocion) ON DELETE CASCADE,
    id_producto INTEGER REFERENCES productos(id_producto),
    UNIQUE(id_promocion, id_producto)
);

CREATE TABLE metodos_pago (
    id_metodo_pago SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE
);

CREATE TABLE pagos (
    id_pago SERIAL PRIMARY KEY,
    id_pedido INTEGER REFERENCES pedidos(id_pedido),
    id_metodo_pago INTEGER REFERENCES metodos_pago(id_metodo_pago),
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    numero_transaccion VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'completado',
    observaciones TEXT
);

-- ============================================
-- MÓDULO 9: AUDITORÍA Y MONITOREO
-- ============================================

CREATE TABLE visitas_paginas (
    id_visita SERIAL PRIMARY KEY,
    pagina VARCHAR(100) NOT NULL UNIQUE,
    contador INTEGER DEFAULT 0,
    ultima_visita TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE log_actividades (
    id_log SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    accion VARCHAR(100) NOT NULL,
    tabla VARCHAR(50),
    id_registro INTEGER,
    detalles TEXT,
    ip_address VARCHAR(45),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_cliente ON pedidos(id_cliente);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(id_producto);
CREATE INDEX idx_log_fecha ON log_actividades(fecha);
CREATE INDEX idx_log_usuario ON log_actividades(id_usuario);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================