-- ============================================
-- DATOS INICIALES DEL SISTEMA
-- ============================================

-- ROLES (basado en la imagen)
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema - Gestiona usuarios, roles y permisos'),
('Encargado Ventas', 'Gestión de ventas, pedidos, clientes y entregas');

-- PERMISOS (basado en la imagen)
INSERT INTO permisos (nombre, descripcion) VALUES
('Rol', 'Gestionar roles del sistema'),
('Permiso', 'Gestionar permisos del sistema'),
('Rol Permiso', 'Asignar permisos a roles'),
('Usuario', 'Gestionar usuarios'),
('Asignacion Roles y Permisos', 'Asignar roles y permisos a usuarios'),
('Cliente', 'Gestionar clientes'),
('Categoria', 'Gestionar categorías de productos'),
('Producto', 'Gestionar productos'),
('Almacen', 'Gestionar almacenes'),
('Producto Almacen', 'Gestionar inventario de productos por almacén'),
('Venta', 'Gestionar ventas y pedidos'),
('Receta', 'Gestionar recetas de producción'),
('Produccion', 'Gestionar órdenes de producción'),
('Inventario', 'Gestionar movimientos de inventario'),
('Metodo Inventario', 'Gestionar métodos de inventario (FIFO, LIFO)'),
('Delivery', 'Gestionar personal de delivery'),
('Entrega', 'Gestionar entregas de pedidos'),
('Proveedor', 'Gestionar proveedores'),
('Compra', 'Gestionar compras a proveedores'),
('Promocion', 'Gestionar promociones'),
('Pago', 'Gestionar pagos'),
('Metodo Pago', 'Gestionar métodos de pago'),
('Reporte', 'Generar y visualizar reportes'),
('Dashboard', 'Visualizar dashboard principal');

-- ASIGNAR PERMISOS AL ROL ADMINISTRADOR (permisos 1-5)
INSERT INTO roles_permisos (id_rol, id_permiso) VALUES
(1, 1),  -- Rol
(1, 2),  -- Permiso
(1, 3),  -- Rol Permiso
(1, 4),  -- Usuario
(1, 5);  -- Asignacion Roles y Permisos

-- ASIGNAR PERMISOS AL ROL ENCARGADO VENTAS (permisos 6-11)
INSERT INTO roles_permisos (id_rol, id_permiso) VALUES
(2, 6),   -- Cliente
(2, 7),   -- Categoria
(2, 8),   -- Producto
(2, 9),   -- Almacen
(2, 10),  -- Producto Almacen
(2, 11);  -- Venta

-- USUARIO ADMINISTRADOR
-- Password temporal: Admin123 (cumple: 8+ chars, mayúscula, número)
-- Hash se generará con el script
INSERT INTO usuarios (nombre, email, password) VALUES
('Edwin', 'admin@panaderia.com', '$2b$10$HASH_TEMPORAL_REPLACE');

-- USUARIO ENCARGADO VENTAS
INSERT INTO usuarios (nombre, email, password) VALUES
('Carlos', 'ventas@panaderia.com', '$2b$10$HASH_TEMPORAL_REPLACE');

-- ASIGNAR ROL ADMINISTRADOR A EDWIN (User_Id=1, Rol=1, Permisos 1-5)
INSERT INTO usuarios_roles_permisos (id_usuario, id_rol, id_permiso) VALUES
(1, 1, 1),
(1, 1, 2),
(1, 1, 3),
(1, 1, 4),
(1, 1, 5);

-- ASIGNAR ROL ENCARGADO VENTAS A CARLOS (User_Id=2, Rol=2, Permisos 6-11)
INSERT INTO usuarios_roles_permisos (id_usuario, id_rol, id_permiso) VALUES
(2, 2, 6),
(2, 2, 7),
(2, 2, 8),
(2, 2, 9),
(2, 2, 10),
(2, 2, 11);

-- MÉTODOS DE INVENTARIO
INSERT INTO metodos_inventario (nombre, descripcion) VALUES
('FIFO', 'First In, First Out - Primero en entrar, primero en salir'),
('LIFO', 'Last In, First Out - Último en entrar, primero en salir'),
('Promedio', 'Costo promedio ponderado');

-- MÉTODOS DE PAGO
INSERT INTO metodos_pago (nombre, descripcion) VALUES
('Efectivo', 'Pago en efectivo'),
('Tarjeta', 'Pago con tarjeta de crédito/débito'),
('Transferencia', 'Transferencia bancaria'),
('QR', 'Pago por código QR');

-- CATEGORÍAS DE PRODUCTOS
INSERT INTO categorias (nombre, descripcion) VALUES
('Panes', 'Pan tradicional y especialidades'),
('Pasteles', 'Pasteles y tortas'),
('Galletas', 'Galletas variadas'),
('Ingredientes', 'Materias primas para producción');

-- ALMACENES
INSERT INTO almacenes (nombre, ubicacion, capacidad_maxima) VALUES
('Almacén Principal', 'Planta Baja', 10000.00),
('Almacén Ingredientes', 'Bodega', 5000.00);

-- PRODUCTOS DE EJEMPLO
INSERT INTO productos (codigo, nombre, descripcion, id_categoria, unidad_medida, precio_venta) VALUES
('PAN001', 'Pan Francés', 'Pan tradicional francés', 1, 'unidad', 1.50),
('PAN002', 'Pan Integral', 'Pan integral con granos', 1, 'unidad', 2.00),
('PAST001', 'Pastel de Chocolate', 'Pastel de chocolate 1kg', 2, 'unidad', 45.00),
('GALL001', 'Galletas de Avena', 'Galletas de avena paquete 200g', 3, 'paquete', 8.00),
('ING001', 'Harina Blanca', 'Harina blanca premium 50kg', 4, 'kg', 0.80);

-- INVENTARIO INICIAL
INSERT INTO productos_almacenes (id_producto, id_almacen, cantidad, stock_minimo, stock_maximo) VALUES
(1, 1, 100, 20, 200),
(2, 1, 80, 15, 150),
(3, 1, 30, 5, 50),
(4, 1, 50, 10, 100),
(5, 2, 500, 100, 1000);

-- CLIENTES DE EJEMPLO
INSERT INTO clientes (nombre, email, telefono, direccion, nit, tipo) VALUES
('Supermercado El Ahorro', 'compras@elahorro.com', '71234567', 'Av. Principal 123', '1234567890', 'mayorista'),
('Cafetería Central', 'pedidos@cafecentral.com', '78901234', 'Calle Comercio 456', '0987654321', 'regular'),
('María Gonzales', 'maria@email.com', '76543210', 'Zona Sur', '', 'regular');

-- ============================================
-- FIN DE DATOS INICIALES
-- ============================================