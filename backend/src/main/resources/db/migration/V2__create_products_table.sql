CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200)   NOT NULL,
    sku         VARCHAR(50)    NOT NULL,
    description TEXT,
    category_id BIGINT         NOT NULL REFERENCES categories (id),
    price       NUMERIC(12, 2) NOT NULL,
    quantity    INTEGER        NOT NULL DEFAULT 0,
    min_stock   INTEGER        NOT NULL DEFAULT 0,
    status      VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_products_sku UNIQUE (sku),
    CONSTRAINT chk_products_price CHECK (price >= 0),
    CONSTRAINT chk_products_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_products_min_stock CHECK (min_stock >= 0),
    CONSTRAINT chk_products_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
