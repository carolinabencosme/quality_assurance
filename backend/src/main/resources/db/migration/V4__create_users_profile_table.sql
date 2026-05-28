CREATE TABLE users_profile (
    id               BIGSERIAL PRIMARY KEY,
    keycloak_user_id VARCHAR(100) NOT NULL,
    full_name        VARCHAR(200) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_profile_keycloak_id UNIQUE (keycloak_user_id),
    CONSTRAINT uq_users_profile_email UNIQUE (email),
    CONSTRAINT chk_users_profile_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
