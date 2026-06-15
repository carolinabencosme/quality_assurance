-- Evidencia de auditoría Hibernate Envers — Avance Proyecto V3
-- Ejecutar contra PostgreSQL del stack dev (puerto 5432, DB inventory)

-- 1. Tablas de auditoría generadas por Flyway V5
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%_aud'
ORDER BY table_name;

-- 2. Revisiones globales (cada cambio auditado)
SELECT rev, revtstmp, TO_TIMESTAMP(revtstmp / 1000) AS revision_time
FROM revinfo
ORDER BY rev DESC
LIMIT 10;

-- 3. Historial de productos auditados
SELECT pa.id, pa.rev, pa.revtype,
       CASE pa.revtype WHEN 0 THEN 'ADD' WHEN 1 THEN 'MOD' WHEN 2 THEN 'DEL' END AS operation,
       pa.name, pa.sku, pa.quantity, pa.status
FROM products_aud pa
ORDER BY pa.rev DESC, pa.id
LIMIT 20;

-- 4. Conteo de revisiones (evidencia numérica)
SELECT COUNT(*) AS total_revisiones FROM revinfo;
SELECT COUNT(*) AS filas_products_aud FROM products_aud;
