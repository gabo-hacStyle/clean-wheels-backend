-- =============================================================================
-- DML — Datos dummy funcionales
-- =============================================================================

-- -----------------------------------------------------------------------------
-- USERS (10 usuarios, usuario 1 = admin)
-- -----------------------------------------------------------------------------
-- INSERT INTO users (email, rol, provider, provider_id) VALUES
--     ('admin@lavadero.com',        'ADMIN',   'google', 'google-uid-admin-001'),
--     ('carlos.mendez@gmail.com',   'CLIENT', 'google', 'google-uid-002'),
--     ('sofia.ramirez@gmail.com',   'CLIENT', 'google', 'google-uid-003'),
--     ('andres.torres@gmail.com',   'CLIENT', 'google', 'google-uid-004'),
--     ('laura.garcia@gmail.com',    'CLIENT', 'google', 'google-uid-005'),
--     ('miguel.lopez@gmail.com',    'CLIENT', 'google', 'google-uid-006'),
--     ('valentina.cruz@gmail.com',  'CLIENT', 'google', 'google-uid-007'),
--     ('jorge.perez@gmail.com',     'CLIENT', 'google', 'google-uid-008'),
--     ('daniela.mora@gmail.com',    'CLIENT', 'google', 'google-uid-009'),
--     ('sebastian.rios@gmail.com',  'CLIENT', 'google', 'google-uid-010');

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
-- INSERT INTO vehicles (placa, marca, modelo) VALUES
--     ('ABC123', 'Toyota',    'Corolla 2020'),
--     ('XYZ789', 'Chevrolet', 'Spark 2019'),
--     ('DEF456', 'Mazda',     'CX-5 2021'),
--     ('GHI321', 'Renault',   'Sandero 2018'),
--     ('JKL654', 'Ford',      'Explorer 2022'),
--     ('MNO987', 'Kia',       'Picanto 2020'),
--     ('PQR147', 'Hyundai',   'Tucson 2021'),
--     ('STU258', 'Nissan',    'Sentra 2019');

-- -----------------------------------------------------------------------------
-- VEHICLES_USERS
-- Vehículos 1, 3 y 5 son compartidos entre dos usuarios
-- -----------------------------------------------------------------------------
-- INSERT INTO vehicles_users (vehicle_id, user_id) VALUES
--     -- Vehículo 1 (ABC123) → Carlos y Sofía (pareja)
--     (1, 2),
--     (1, 3),
--     -- Vehículo 2 (XYZ789) → Andrés
--     (2, 4),
--     -- Vehículo 3 (DEF456) → Laura y Miguel (familia)
--     (3, 5),
--     (3, 6),
--     -- Vehículo 4 (GHI321) → Valentina
--     (4, 7),
--     -- Vehículo 5 (JKL654) → Jorge y Daniela (familia)
--     (5, 8),
--     (5, 9),
--     -- Vehículo 6 (MNO987) → Sebastián
--     (6, 10),
--     -- Vehículo 7 (PQR147) → Carlos (segundo carro)
--     (7, 2),
--     -- Vehículo 8 (STU258) → Andrés (segundo carro)
--     (8, 4);

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

