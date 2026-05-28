INSERT INTO categories (name, description, status) VALUES
    ('Electronics', 'Electronic devices and accessories', 'ACTIVE'),
    ('Office', 'Office supplies and equipment', 'ACTIVE'),
    ('General', 'General inventory items', 'ACTIVE');

INSERT INTO products (name, sku, description, category_id, price, quantity, min_stock, status) VALUES
    ('Wireless Mouse', 'SKU-MOUSE-001', 'Ergonomic wireless mouse', 1, 29.99, 50, 10, 'ACTIVE'),
    ('USB-C Hub', 'SKU-HUB-002', '7-in-1 USB-C hub', 1, 45.00, 8, 10, 'ACTIVE'),
    ('Notebook A4', 'SKU-NOTE-003', 'Ruled notebook 100 pages', 2, 3.50, 120, 20, 'ACTIVE'),
    ('Desk Lamp', 'SKU-LAMP-004', 'LED desk lamp', 2, 24.00, 5, 5, 'ACTIVE');

INSERT INTO stock_movements (product_id, user_id, type, previous_qty, new_qty, delta, observations, correlation_id) VALUES
    (1, 'seed-system', 'IN', 0, 50, 50, 'Initial stock load', 'seed-001'),
    (2, 'seed-system', 'IN', 0, 8, 8, 'Initial stock load', 'seed-002'),
    (3, 'seed-system', 'IN', 0, 120, 120, 'Initial stock load', 'seed-003'),
    (4, 'seed-system', 'IN', 0, 5, 5, 'Initial stock load', 'seed-004');
