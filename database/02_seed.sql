-- USERS
INSERT INTO users (id, email, provider, provider_id, rol, cedula)
VALUES
    ('312d89af-4b1e-4036-a5c7-cc6fda71b351', 'jagt1806@gmail.com', 'google', '102577857263320027535', 'ADMIN', '100001'),
    ('7b5e4c0f-6a82-4067-95ae-f38d8da0b3b3', 'u20231213007@usco.edu.co', 'google', '107418288900757704283', 'CLIENT', '100002'),
    ('665851a6-f46a-4ade-ae0e-91f083f44899', 'juegosjagt@gmail.com', 'google', '102475646396706075583', 'CLIENT', '100003');

-- VEHICLES
INSERT INTO vehicles (id, placa, marca, modelo)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ABC123', 'Mazda', 'CX5'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'XYZ987', 'Toyota', 'Corolla'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'JKL456', 'Chevrolet', 'Onix');

-- VEHICLES_USERS
INSERT INTO vehicles_users (vehicle_id, user_id)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '7b5e4c0f-6a82-4067-95ae-f38d8da0b3b3'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '665851a6-f46a-4ade-ae0e-91f083f44899'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '7b5e4c0f-6a82-4067-95ae-f38d8da0b3b3');

-- SERVICES
INSERT INTO services (id, name, price, description)
VALUES
    ('44444444-4444-4444-4444-444444444444', 'Lavado Premium', 35000, 'Lavado exterior e interior'),
    ('55555555-5555-5555-5555-555555555555', 'Cambio de Aceite', 95000, 'Aceite sintético'),
    ('66666666-6666-6666-6666-666666666666', 'Alineación', 60000, 'Alineación computarizada');

-- RESERVATIONS
INSERT INTO reservations (
    id,
    vehicle_id,
    datetime,
    status,
    total_price,
    total_duration
)
VALUES
    (
        '77777777-7777-7777-7777-777777777777',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        NOW() + INTERVAL '1 day',
        'PENDING',
        130000,
        90
    ),
    (
        '88888888-8888-8888-8888-888888888888',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        NOW() - INTERVAL '2 day',
        'COMPLETED',
        35000,
        40
    );

-- RESERVATION SERVICES
INSERT INTO reservations_services (reservation_id, service_id)
VALUES
    ('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555'),
    ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666'),
    ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444');

-- FEEDBACK
INSERT INTO feedback (reservation_id, feedback)
VALUES
    ('88888888-8888-8888-8888-888888888888', 'Excelente servicio, muy recomendado.');

-- RECEIPTS
INSERT INTO receipts (
    user_id,
    reservation_id,
    discount,
    precio_final,
    payment_method
)
VALUES
    (
        '665851a6-f46a-4ade-ae0e-91f083f44899',
        '88888888-8888-8888-8888-888888888888',
        5000,
        30000,
        'CARD'
    );

-- NOTIFICATIONS
INSERT INTO notifications (
    user_id,
    vehicle_id,
    reservation_id,
    message
)
VALUES
    (
        '7b5e4c0f-6a82-4067-95ae-f38d8da0b3b3',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '77777777-7777-7777-7777-777777777777',
        'Tu cita fue agendada correctamente'
    ),
    (
        '665851a6-f46a-4ade-ae0e-91f083f44899',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '88888888-8888-8888-8888-888888888888',
        'Tu servicio fue completado'
    );