-- =============================================================================
-- CARWASH - Script SQL completo
-- PostgreSQL | DDL + DML + Rollback
-- =============================================================================

-- =============================================================================
-- ROLLBACK (ejecutar en orden inverso para limpiar todo)
-- =============================================================================

-- DROP TABLE IF EXISTS feedback             CASCADE;
-- DROP TABLE IF EXISTS receipts             CASCADE;
-- DROP TABLE IF EXISTS reservations_services CASCADE;
-- DROP TABLE IF EXISTS reservations         CASCADE;
-- DROP TABLE IF EXISTS notifications        CASCADE;
-- DROP TABLE IF EXISTS vehicles_users       CASCADE;
-- DROP TABLE IF EXISTS vehicles             CASCADE;
-- DROP TABLE IF EXISTS services             CASCADE;
-- DROP TABLE IF EXISTS categories           CASCADE;
-- DROP TABLE IF EXISTS users               CASCADE;

-- =============================================================================
-- DDL
-- =============================================================================

CREATE TABLE users (
                       id          BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                       email       VARCHAR(255)    NOT NULL UNIQUE,
                       rol         VARCHAR(20)     NOT NULL DEFAULT 'CLIENT'
                           CHECK (rol IN ('CLIENT', 'ADMIN', 'GUEST')),
                       provider    VARCHAR(20)     NOT NULL DEFAULT 'google'
                           CHECK (provider IN ('google', 'local')),
                       provider_id VARCHAR(255)    NOT NULL,
                       created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                       updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
                            id          BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                            name        VARCHAR(100)    NOT NULL UNIQUE,
                            description TEXT,
                            created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                            updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
                          id          BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          name        VARCHAR(150)    NOT NULL,
                          price       NUMERIC(10,2)   NOT NULL CHECK (price >= 0),
                          description TEXT,
                          url         VARCHAR(500),
                          is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
                          duration    INTEGER         NOT NULL CHECK (duration > 0), -- minutos
                          category_id BIGINT          NOT NULL REFERENCES categories(id),
                          created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                          updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicles (
                          id          BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          placa       VARCHAR(10)     NOT NULL UNIQUE,
                          marca       VARCHAR(80)     NOT NULL,
                          modelo      VARCHAR(80)     NOT NULL,
                          created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                          updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicles_users (
                                id          BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                vehicle_id  BIGINT          NOT NULL REFERENCES vehicles(id),
                                user_id     BIGINT          NOT NULL REFERENCES users(id),
                                created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                                updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                                UNIQUE (vehicle_id, user_id)
);

CREATE TABLE reservations (
                              id             BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                              vehicle_id     BIGINT        NOT NULL REFERENCES vehicles(id),
                              datetime       TIMESTAMPTZ   NOT NULL,
                              status         VARCHAR(20)   NOT NULL DEFAULT 'pendiente'
                                  CHECK (status IN ('pendiente','confirmada','en_proceso','finalizada','cancelada')),
                              total_price    NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
                              total_duration INTEGER       NOT NULL CHECK (total_duration > 0),
                              created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
                              updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE reservations_services (
                                       id             BIGINT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                       reservation_id BIGINT  NOT NULL REFERENCES reservations(id),
                                       service_id     BIGINT  NOT NULL REFERENCES services(id),
                                       created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                       updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                       UNIQUE (reservation_id, service_id)
);

CREATE TABLE notifications (
                               id             BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                               user_id        BIGINT        NOT NULL REFERENCES users(id),
                               vehicle_id     BIGINT        NOT NULL REFERENCES vehicles(id),
                               reservation_id BIGINT        NOT NULL REFERENCES reservations(id),
                               type           VARCHAR(40)   NOT NULL
                                   CHECK (type IN (
                                                   'reserva_creada','reserva_cancelada','recordatorio_24h',
                                                   'servicio_iniciado','servicio_finalizado',
                                                   'solicitud_feedback','reporte_diario'
                                       )),
                               channel        VARCHAR(20)   NOT NULL DEFAULT 'email'
                                   CHECK (channel IN ('email')),
                               status         VARCHAR(20)   NOT NULL DEFAULT 'pendiente'
                                   CHECK (status IN ('pendiente','enviada','fallida')),
                               scheduled_at   TIMESTAMPTZ   NOT NULL,
                               sent_at        TIMESTAMPTZ,
                               created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
                               updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE receipts (
                          id               BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          user_id          BIGINT        NOT NULL REFERENCES users(id),
                          reservation_id   BIGINT        NOT NULL REFERENCES reservations(id) UNIQUE,
                          discount         NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
                          precio_final     NUMERIC(10,2) NOT NULL CHECK (precio_final >= 0),
                          payment_method   VARCHAR(20)   NOT NULL
                              CHECK (payment_method IN ('efectivo','tarjeta','transferencia')),
                          payment_datetime TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
                          created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
                          updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
                          id             BIGINT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          reservation_id BIGINT  NOT NULL REFERENCES reservations(id) UNIQUE,
                          rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
                          feedback       TEXT    NOT NULL,
                          created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                          updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices útiles para las queries más frecuentes
CREATE INDEX idx_reservations_datetime    ON reservations(datetime);
CREATE INDEX idx_reservations_status      ON reservations(status);
CREATE INDEX idx_reservations_vehicle     ON reservations(vehicle_id);
CREATE INDEX idx_vehicles_users_user      ON vehicles_users(user_id);
CREATE INDEX idx_vehicles_users_vehicle   ON vehicles_users(vehicle_id);
CREATE INDEX idx_res_services_reservation ON reservations_services(reservation_id);
CREATE INDEX idx_services_category        ON services(category_id);
CREATE INDEX idx_notifications_reservation ON notifications(reservation_id);
