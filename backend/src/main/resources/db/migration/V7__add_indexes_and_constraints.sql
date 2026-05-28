-- V7: índices y constraints adicionales de rendimiento (QA-17)

CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_status ON products (status);
CREATE INDEX idx_products_name_lower ON products (LOWER(name));
CREATE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_critical ON products (status, quantity, min_stock)
    WHERE status = 'ACTIVE' AND quantity <= min_stock;

CREATE INDEX idx_stock_movements_product_id ON stock_movements (product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements (created_at DESC);
CREATE INDEX idx_stock_movements_correlation_id ON stock_movements (correlation_id);
CREATE INDEX idx_stock_movements_type ON stock_movements (type);

CREATE INDEX idx_categories_status ON categories (status);

CREATE INDEX idx_users_profile_status ON users_profile (status);
CREATE INDEX idx_users_profile_email ON users_profile (email);
