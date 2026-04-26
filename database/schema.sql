
-- User
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(20),
    provider_id VARCHAR(255),
    rol VARCHAR(20) NOT NULL DEFAULT 'CLIENT' CHECK (rol IN ('CLIENT', 'ADMIN', 'GUEST')),
    cedula VARCHAR(20)
)