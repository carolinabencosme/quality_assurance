# Pruebas de seguridad — Fase 4 (QA-6)

## Script rápido

Con el stack en marcha (`docker compose -f docker-compose.dev.yml up -d`):

```powershell
.\tests\security\auth-smoke.ps1
```

Valida:

- Endpoints protegidos sin JWT → **401**
- `viewer` con token → dashboard **200**
- `viewer` sin `audit:view` → **/audit** **403**

## Evidencia manual recomendada

- Captura de Keycloak (roles `inventory-backend`)
- Respuesta 403 en Swagger con usuario sin permiso
- (Opcional) OWASP ZAP baseline contra `http://localhost:3000`
