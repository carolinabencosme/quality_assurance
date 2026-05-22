CREATE TABLE stock_movements (
    id             BIGSERIAL PRIMARY KEY,
    product_id     BIGINT       NOT NULL REFERENCES products (id),
    user_id        VARCHAR(100),
    type           VARCHAR(20)  NOT NULL,
    previous_qty   INTEGER      NOT NULL,
    new_qty        INTEGER      NOT NULL,
    delta          INTEGER      NOT NULL,
    observations   VARCHAR(500),
    correlation_id VARCHAR(64),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_stock_movements_type CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
    CONSTRAINT chk_stock_movements_previous_qty CHECK (previous_qty >= 0),
    CONSTRAINT chk_stock_movements_new_qty CHECK (new_qty >= 0)
);
