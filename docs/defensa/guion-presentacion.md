# Guión de presentación — Inventory QAS (≈15 min)

**Proyecto:** Aseguramiento de Calidad de Software — PUCMM  
**Ticket:** QA-9 — Fase 7: Documentación y defensa

---

## 1. Introducción (2 min)

- Problema: gestión de inventario con trazabilidad, seguridad y operación observable.
- Solución: monorepo **Inventory QAS** — Spring Boot + Next.js + PostgreSQL + Keycloak.
- Objetivo de calidad: pruebas automatizadas, observabilidad y pipeline CI/CD desde el diseño.

---

## 2. Arquitectura (3 min)

Mostrar diagrama en [`../architecture.md`](../architecture.md):

- Usuario → Next.js (App Router, cookies JWT) → API REST → PostgreSQL + Flyway + Envers.
- Keycloak emite JWT; backend valida `iss` y permisos `@PreAuthorize`.
- Telemetría: OTLP → Alloy → Prometheus / Loki / Tempo → Grafana.

**Mensaje clave:** monolito modular por dominio (`product`, `stock`, `report`, `audit`, `security`) — simple de desplegar y testear.

---

## 3. Funcionalidad demo (5 min)

Orden sugerido (admin salvo donde se indique):

1. Login y roles (`viewer` vs `admin`).
2. Listado y filtro de productos; crear producto con SKU único.
3. Movimiento de stock (IN/OUT) y alerta de stock crítico en dashboard.
4. Auditoría Envers — quién cambió qué y cuándo.
5. Swagger en `/swagger-ui.html` (contrato API).

---

## 4. Aseguramiento de calidad (3 min)

- **Pruebas:** 8 suites backend (unit + integración + seguridad); Playwright E2E; scripts k6 y security smoke.
- **Evidencias:** [`../qa-evidence.md`](../qa-evidence.md) — bugs BUG-01/02 documentados y resueltos.
- **CI:** GitHub Actions (`ci.yml`) — backend `mvn verify`, frontend build, Sonar opcional.
- **Jenkins:** pipeline con parámetros staging y Sonar (`Jenkinsfile`).

---

## 5. Observabilidad y operación (2 min)

- Stack levantado con segundo compose file.
- Dashboards Grafana; health y métricas Actuator.
- Alertmanager configurado para umbrales básicos (ver guía observabilidad).

---

## 6. Cierre (1 min)

- Fases 0–7 completadas en ramas `feature/qa-*`.
- Trabajo futuro (opcional): más cobertura E2E en CI, despliegue cloud, RBAC fino en Keycloak.
- Preguntas.

---

## Ensayo — checklist rápido

- [ ] Cronometrar 15 min (no pasar de 18).
- [ ] Tener terminal con compose ya levantado antes de entrar.
- [ ] Tener pestañas: frontend, Grafana, Swagger, qa-evidence.md.
- [ ] Repetir transición viewer → admin sin cerrar sesión corrupta (usar logout).
