-- V5: auditoría Hibernate Envers — revinfo + products_aud (QA-17)
-- Alineado con InventoryRevisionEntity (@Table revinfo) y Product @Audited

CREATE SEQUENCE IF NOT EXISTS revinfo_seq INCREMENT BY 50 START WITH 1;

CREATE TABLE revinfo (
    rev         INTEGER      NOT NULL DEFAULT nextval('revinfo_seq'),
    revtstmp    BIGINT,
    modified_by VARCHAR(100),
    PRIMARY KEY (rev)
);

CREATE TABLE products_aud (
    id          BIGINT         NOT NULL,
    rev         INTEGER        NOT NULL,
    revtype     SMALLINT,
    name        VARCHAR(200),
    sku         VARCHAR(50),
    description TEXT,
    category_id BIGINT,
    price       NUMERIC(12, 2),
    quantity    INTEGER,
    min_stock   INTEGER,
    status      VARCHAR(20),
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_products_aud_rev FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE INDEX idx_products_aud_rev ON products_aud (rev);
