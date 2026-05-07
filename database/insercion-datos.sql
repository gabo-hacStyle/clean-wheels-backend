-- =============================================================================
-- DML — Datos dummy funcionales
-- =============================================================================

-- -----------------------------------------------------------------------------
-- USERS (10 usuarios, usuario 1 = admin)
-- -----------------------------------------------------------------------------
INSERT INTO users (email, rol, provider, provider_id) VALUES
    ('admin@lavadero.com',        'ADMIN',   'google', 'google-uid-admin-001'),
    ('carlos.mendez@gmail.com',   'CLIENT', 'google', 'google-uid-002'),
    ('sofia.ramirez@gmail.com',   'CLIENT', 'google', 'google-uid-003'),
    ('andres.torres@gmail.com',   'CLIENT', 'google', 'google-uid-004'),
    ('laura.garcia@gmail.com',    'CLIENT', 'google', 'google-uid-005'),
    ('miguel.lopez@gmail.com',    'CLIENT', 'google', 'google-uid-006'),
    ('valentina.cruz@gmail.com',  'CLIENT', 'google', 'google-uid-007'),
    ('jorge.perez@gmail.com',     'CLIENT', 'google', 'google-uid-008'),
    ('daniela.mora@gmail.com',    'CLIENT', 'google', 'google-uid-009'),
    ('sebastian.rios@gmail.com',  'CLIENT', 'google', 'google-uid-010');

-- -----------------------------------------------------------------------------
-- CATEGORIES (3 categorías)
-- -----------------------------------------------------------------------------
INSERT INTO categories (name, description) VALUES
    ('Lavado Exterior',  'Servicios enfocados en la limpieza exterior del vehículo'),
    ('Lavado Interior',  'Servicios de limpieza y acondicionamiento del habitáculo'),
    ('Detallado',        'Servicios especializados de detallado y protección');

-- -----------------------------------------------------------------------------
-- SERVICES (8 servicios distribuidos en las 3 categorías)
-- Precios en COP. Duración en minutos.
--
-- cat 1 = Lavado Exterior  (id 1)
-- cat 2 = Lavado Interior  (id 2)
-- cat 3 = Detallado        (id 3)
-- -----------------------------------------------------------------------------
INSERT INTO services (name, price, description, url, duration, category_id) VALUES
    -- Lavado Exterior
    ('Lavado Básico',           15000,  'Lavado exterior con agua a presión y jabón',               NULL, 30,  1),
    ('Lavado Premium',          25000,  'Lavado exterior + encerado manual y secado de microfibra', NULL, 50,  1),
    ('Lavado de Motor',         20000,  'Limpieza y desengrase del compartimiento del motor',       NULL, 40,  1),
    -- Lavado Interior
    ('Aspirado Interior',       12000,  'Aspirado completo de tapetes, asientos y maletero',        NULL, 25,  2),
    ('Limpieza de Tapicería',   35000,  'Limpieza profunda de asientos y forros con vapor',         NULL, 60,  2),
    ('Aromatización',            8000,  'Aplicación de aromatizante de larga duración',             NULL, 10,  2),
    -- Detallado
    ('Pulida y Brillada',       80000,  'Pulida de pintura con pulidora eléctrica y sellante',      NULL, 120, 3),
    ('Ceramic Coating Básico', 150000,  'Aplicación de recubrimiento cerámico de entrada',          NULL, 180, 3);

-- -----------------------------------------------------------------------------
-- VEHICLES (8 vehículos)
-- -----------------------------------------------------------------------------
INSERT INTO vehicles (placa, marca, modelo) VALUES
    ('ABC123', 'Toyota',    'Corolla 2020'),
    ('XYZ789', 'Chevrolet', 'Spark 2019'),
    ('DEF456', 'Mazda',     'CX-5 2021'),
    ('GHI321', 'Renault',   'Sandero 2018'),
    ('JKL654', 'Ford',      'Explorer 2022'),
    ('MNO987', 'Kia',       'Picanto 2020'),
    ('PQR147', 'Hyundai',   'Tucson 2021'),
    ('STU258', 'Nissan',    'Sentra 2019');

-- -----------------------------------------------------------------------------
-- VEHICLES_USERS
-- Vehículos 1, 3 y 5 son compartidos entre dos usuarios
-- -----------------------------------------------------------------------------
INSERT INTO vehicles_users (vehicle_id, user_id) VALUES
    -- Vehículo 1 (ABC123) → Carlos y Sofía (pareja)
    (1, 2),
    (1, 3),
    -- Vehículo 2 (XYZ789) → Andrés
    (2, 4),
    -- Vehículo 3 (DEF456) → Laura y Miguel (familia)
    (3, 5),
    (3, 6),
    -- Vehículo 4 (GHI321) → Valentina
    (4, 7),
    -- Vehículo 5 (JKL654) → Jorge y Daniela (familia)
    (5, 8),
    (5, 9),
    -- Vehículo 6 (MNO987) → Sebastián
    (6, 10),
    -- Vehículo 7 (PQR147) → Carlos (segundo carro)
    (7, 2),
    -- Vehículo 8 (STU258) → Andrés (segundo carro)
    (8, 4);

-- -----------------------------------------------------------------------------
-- RESERVATIONS
--
-- Historial (10 reservas, abril 2026 hacia atrás, finalizadas o canceladas)
-- Próximas (5 reservas, primera semana de mayo 2026)
--
-- Regla de 3 empleados: lunes 5 mayo 10:00 tiene 3 reservas simultáneas.
--
-- Cálculo total_price / total_duration según servicios asignados abajo:
--
--  R1 : svc 1 (30min, $15000)                        → 30min, $15000
--  R2 : svc 1+4 (30+25=55min, 15000+12000=$27000)    → 55min, $27000
--  R3 : svc 2 (50min, $25000)                        → 50min, $25000
--  R4 : svc 5 (60min, $35000)                        → 60min, $35000
--  R5 : svc 1+4+6 (30+25+10=65min, 15000+12000+8000=$35000) → 65min, $35000
--  R6 : svc 7 (120min, $80000)                       → 120min, $80000
--  R7 : svc 2+4 (50+25=75min, 25000+12000=$37000)    → 75min, $37000
--  R8 : svc 3 (40min, $20000)                        → 40min, $20000
--  R9 : svc 1+6 (30+10=40min, 15000+8000=$23000)     → 40min, $23000
-- R10 : svc 8 (180min, $150000)                      → 180min, $150000  [CANCELADA]
-- R11 : svc 1 (30min, $15000)                        → 30min, $15000    [próxima]
-- R12 : svc 2+4 (75min, $37000)                      → 75min, $37000    [próxima]
-- R13 : svc 1+4+6 (65min, $35000)                    → 65min, $35000    [próxima, mismo slot R11]
-- R14 : svc 2 (50min, $25000)                        → 50min, $25000    [próxima, mismo slot R11+R13]
-- R15 : svc 5+6 (60+10=70min, 35000+8000=$43000)     → 70min, $43000    [próxima]
-- -----------------------------------------------------------------------------

-- Historial (finalizadas)
INSERT INTO reservations (vehicle_id, datetime, status, total_price, total_duration, created_at, updated_at) VALUES
    -- R1: enero 2026
    (1, '2026-01-10 09:00:00-05', 'finalizada', 15000,  30,  '2026-01-09 15:00:00-05', '2026-01-10 09:35:00-05'),
    -- R2: enero 2026
    (2, '2026-01-15 11:00:00-05', 'finalizada', 27000,  55,  '2026-01-14 10:00:00-05', '2026-01-15 12:00:00-05'),
    -- R3: febrero 2026
    (3, '2026-02-03 08:00:00-05', 'finalizada', 25000,  50,  '2026-02-02 09:00:00-05', '2026-02-03 09:00:00-05'),
    -- R4: febrero 2026
    (4, '2026-02-18 14:00:00-05', 'finalizada', 35000,  60,  '2026-02-17 11:00:00-05', '2026-02-18 15:05:00-05'),
    -- R5: marzo 2026
    (5, '2026-03-05 10:00:00-05', 'finalizada', 35000,  65,  '2026-03-04 08:00:00-05', '2026-03-05 11:10:00-05'),
    -- R6: marzo 2026
    (6, '2026-03-20 09:00:00-05', 'finalizada', 80000,  120, '2026-03-19 16:00:00-05', '2026-03-20 11:05:00-05'),
    -- R7: abril 2026
    (7, '2026-04-02 13:00:00-05', 'finalizada', 37000,  75,  '2026-04-01 12:00:00-05', '2026-04-02 14:20:00-05'),
    -- R8: abril 2026
    (8, '2026-04-10 08:00:00-05', 'finalizada', 20000,  40,  '2026-04-09 10:00:00-05', '2026-04-10 08:45:00-05'),
    -- R9: abril 2026
    (1, '2026-04-22 16:00:00-05', 'finalizada', 23000,  40,  '2026-04-21 09:00:00-05', '2026-04-22 16:45:00-05'),
    -- R10: abril 2026 (cancelada)
    (3, '2026-04-28 10:00:00-05', 'cancelada',  150000, 180, '2026-04-27 14:00:00-05', '2026-04-27 16:00:00-05');

-- Próximas (primera semana de mayo 2026)
-- Lunes 4 mayo — R11 y R12
-- Lunes 5 mayo 10:00 — R13, R14, R15 (3 reservas simultáneas = cupo lleno)
INSERT INTO reservations (vehicle_id, datetime, status, total_price, total_duration, created_at, updated_at) VALUES
    -- R11: lunes 5 mayo 08:00
    (2, '2026-05-05 08:00:00-05', 'confirmada', 15000,  30,  NOW(), NOW()),
    -- R12: martes 6 mayo 09:00
    (4, '2026-05-06 09:00:00-05', 'confirmada', 37000,  75,  NOW(), NOW()),
    -- R13: lunes 5 mayo 10:00 (empleado 1)
    (1, '2026-05-05 10:00:00-05', 'confirmada', 35000,  65,  NOW(), NOW()),
    -- R14: lunes 5 mayo 10:00 (empleado 2)
    (5, '2026-05-05 10:00:00-05', 'confirmada', 25000,  50,  NOW(), NOW()),
    -- R15: lunes 5 mayo 10:00 (empleado 3 — cupo lleno en ese slot)
    (7, '2026-05-05 10:00:00-05', 'confirmada', 43000,  70,  NOW(), NOW());

-- -----------------------------------------------------------------------------
-- RESERVATIONS_SERVICES
-- -----------------------------------------------------------------------------
INSERT INTO reservations_services (reservation_id, service_id) VALUES
    -- R1: svc 1
    (1, 1),
    -- R2: svc 1+4
    (2, 1), (2, 4),
    -- R3: svc 2
    (3, 2),
    -- R4: svc 5
    (4, 5),
    -- R5: svc 1+4+6
    (5, 1), (5, 4), (5, 6),
    -- R6: svc 7
    (6, 7),
    -- R7: svc 2+4
    (7, 2), (7, 4),
    -- R8: svc 3
    (8, 3),
    -- R9: svc 1+6
    (9, 1), (9, 6),
    -- R10: svc 8 (cancelada)
    (10, 8),
    -- R11: svc 1
    (11, 1),
    -- R12: svc 2+4
    (12, 2), (12, 4),
    -- R13: svc 1+4+6
    (13, 1), (13, 4), (13, 6),
    -- R14: svc 2
    (14, 2),
    -- R15: svc 5+6
    (15, 5), (15, 6);

-- -----------------------------------------------------------------------------
-- RECEIPTS (solo para reservas finalizadas R1-R9, descuento siempre 0)
-- precio_final = total_price - discount = total_price
-- -----------------------------------------------------------------------------
INSERT INTO receipts (user_id, reservation_id, discount, precio_final, payment_method, payment_datetime) VALUES
    -- R1 → user 2 (Carlos, propietario principal de vehículo 1)
    (2,  1,  0, 15000,  'efectivo',       '2026-01-10 09:35:00-05'),
    -- R2 → user 4 (Andrés, propietario de vehículo 2)
    (4,  2,  0, 27000,  'tarjeta',        '2026-01-15 12:00:00-05'),
    -- R3 → user 5 (Laura, propietaria principal de vehículo 3)
    (5,  3,  0, 25000,  'transferencia',  '2026-02-03 09:00:00-05'),
    -- R4 → user 7 (Valentina, propietaria de vehículo 4)
    (7,  4,  0, 35000,  'efectivo',       '2026-02-18 15:05:00-05'),
    -- R5 → user 8 (Jorge, propietario principal de vehículo 5)
    (8,  5,  0, 35000,  'tarjeta',        '2026-03-05 11:10:00-05'),
    -- R6 → user 10 (Sebastián, propietario de vehículo 6)
    (10, 6,  0, 80000,  'tarjeta',        '2026-03-20 11:05:00-05'),
    -- R7 → user 2 (Carlos, propietario principal de vehículo 7)
    (2,  7,  0, 37000,  'efectivo',       '2026-04-02 14:20:00-05'),
    -- R8 → user 4 (Andrés, propietario de vehículo 8)
    (4,  8,  0, 20000,  'transferencia',  '2026-04-10 08:45:00-05'),
    -- R9 → user 2 (Carlos, propietario de vehículo 1)
    (2,  9,  0, 23000,  'efectivo',       '2026-04-22 16:45:00-05');

-- -----------------------------------------------------------------------------
-- FEEDBACK (solo reservas finalizadas, 7 de 9 dejaron feedback)
-- -----------------------------------------------------------------------------
INSERT INTO feedback (reservation_id, rating, feedback) VALUES
    (1, 5, 'Excelente servicio, quedó impecable.'),
    (2, 4, 'Muy bueno, rápido y cumplido.'),
    (3, 5, 'El premium vale cada peso, lo recomiendo.'),
    (4, 3, 'Bien, aunque tardaron un poco más de lo esperado.'),
    (5, 5, 'Perfecto en todo sentido, volveré pronto.'),
    (6, 5, 'La pulida quedó increíble, como nuevo.'),
    (7, 4, 'Buen trabajo, cumplieron con el tiempo estimado.');
