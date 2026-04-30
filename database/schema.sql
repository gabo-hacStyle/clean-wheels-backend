-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN
CREATE TYPE user_role AS ENUM ('CLIENT', 'ADMIN', 'GUEST');
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'reservation_status'
    ) THEN
CREATE TYPE reservation_status AS ENUM (
            'PENDING',
            'CONFIRMED',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED'
        );
END IF;

--     IF NOT EXISTS (
--         SELECT 1 FROM pg_type WHERE typname = 'payment_method_type'
--     ) THEN
-- CREATE TYPE payment_method_type AS ENUM (
--             'CASH',
--             'CARD',
--             'TRANSFER',
--             'NEQUI',
--             'DAVIPLATA'
--         );
-- END IF;
END $$;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(20),
    provider_id VARCHAR(255),
    rol user_role NOT NULL DEFAULT 'CLIENT',
    cedula VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
    );

-- VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR(10) UNIQUE NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    );


-- RELACION VEHICULOS / USUARIOS
CREATE TABLE IF NOT EXISTS vehicles_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vehicle_id UUID NOT NULL,
    user_id UUID NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_vehicle_user_vehicle
    FOREIGN KEY (vehicle_id)
    REFERENCES vehicles(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_vehicle_user_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    CONSTRAINT uq_vehicle_user UNIQUE(vehicle_id, user_id)
    );

-- SERVICES
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) UNIQUE NOT NULL,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
    );

-- RESERVATIONS
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vehicle_id UUID NOT NULL,

    datetime TIMESTAMP NOT NULL,

    status reservation_status NOT NULL DEFAULT 'PENDING',

    total_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),

    total_duration INTEGER NOT NULL DEFAULT 0 CHECK (total_duration >= 0),

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_reservation_vehicle
    FOREIGN KEY (vehicle_id)
    REFERENCES vehicles(id)
    ON DELETE RESTRICT
    );

-- RESERVATION SERVICES
CREATE TABLE IF NOT EXISTS reservations_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reservation_id UUID NOT NULL,
    service_id UUID NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_rs_reservation
    FOREIGN KEY (reservation_id)
    REFERENCES reservations(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_rs_service
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE RESTRICT,

    CONSTRAINT uq_reservation_service UNIQUE(reservation_id, service_id)
    );

-- FEEDBACK
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reservation_id UUID UNIQUE NOT NULL,
    feedback TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_feedback_reservation
    FOREIGN KEY (reservation_id)
    REFERENCES reservations(id)
    ON DELETE CASCADE
    );

-- RECEIPTS
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    reservation_id UUID UNIQUE NOT NULL,

    discount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),

    precio_final NUMERIC(12,2) NOT NULL CHECK (precio_final >= 0),

    payment_method VARCHAR(255),

    payment_datetime TIMESTAMP DEFAULT NOW(),

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_receipt_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT,

    CONSTRAINT fk_receipt_reservation
    FOREIGN KEY (reservation_id)
    REFERENCES reservations(id)
    ON DELETE CASCADE
    );

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    reservation_id UUID NOT NULL,

    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_notification_vehicle
    FOREIGN KEY (vehicle_id)
    REFERENCES vehicles(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_notification_reservation
    FOREIGN KEY (reservation_id)
    REFERENCES reservations(id)
    ON DELETE CASCADE
    );

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_cedula
    ON users(cedula);

CREATE INDEX IF NOT EXISTS idx_vehicles_placa
    ON vehicles(placa);

CREATE INDEX IF NOT EXISTS idx_reservations_datetime
    ON reservations(datetime);

CREATE INDEX IF NOT EXISTS idx_reservations_status
    ON reservations(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_receipts_user
    ON receipts(user_id);