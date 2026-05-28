-- V1: categories — dominio inventario (QA-17)
-- Ver docs/data-model.md

CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_categories_name UNIQUE (name),
    CONSTRAINT chk_categories_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
