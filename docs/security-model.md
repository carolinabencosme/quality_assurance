# Modelo de seguridad — Inventory QAS (Fase 2)

## Componentes

| Elemento | Valor |
|----------|--------|
| Realm | `inventory-realm` |
| Cliente frontend | `inventory-frontend` (público, PKCE / password grant en dev) |
| Cliente API | `inventory-backend` (bearer-only, Resource Server) |
| Issuer (host) | `http://localhost:8081/realms/inventory-realm` |
| Issuer (Docker) | `http://keycloak:8080/realms/inventory-realm` |

## Permisos granulares (client roles en `inventory-backend`)

| Permiso | Descripción |
|---------|-------------|
| `product:view` | Ver productos y categorías |
| `product:manage` | Crear, editar, inactivar productos |
| `stock:view` | Ver existencias e historial |
| `stock:manage` | Registrar entradas, salidas, ajustes |
| `report:view` | Reportes y dashboard (Fase 3) |
| `audit:view` | Auditoría (Fase 3) |
| `user:manage` | Gestión de usuarios en Keycloak |

## Roles compuestos (realm)

| Rol | Permisos API |
|-----|----------------|
| `inventory-admin` | Todos |
| `warehouse-manager` | product + stock + report |
| `inventory-clerk` | product:view, stock:view, stock:manage |
| `inventory-viewer` | product:view, stock:view, report:view |

## Usuarios de prueba (realm export)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | inventory-admin |
| `warehouse` | `warehouse123` | warehouse-manager |
| `clerk` | `clerk123` | inventory-clerk |
| `viewer` | `viewer123` | inventory-viewer |

## Obtener token (desarrollo)

```bash
curl -s -X POST "http://localhost:8081/realms/inventory-realm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=inventory-frontend" \
  -d "username=viewer" \
  -d "password=viewer123"
```

Usar `access_token` en `Authorization: Bearer <token>`.

## Respuestas esperadas

| Caso | HTTP |
|------|------|
| Sin token | 401 Unauthorized |
| Token válido sin permiso | 403 Forbidden (JSON con `correlationId`) |
| Token con permiso correcto | 200 / 201 |

## CORS

Orígenes permitidos por defecto: `http://localhost:3000`, `http://127.0.0.1:3000`  
Variable: `INVENTORY_CORS_ORIGINS` (lista separada por comas).

## Desactivar seguridad (solo tests)

```properties
inventory.security.enabled=false
```
