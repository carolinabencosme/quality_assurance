# Staging y Production en la nube

Objetivo: demos publicas **sin** tener Docker encendido en la PC.

## Arquitectura

```text
Navegador
  → Vercel (Next.js)     staging: cub-inventory-qas.vercel.app
                         production: cub-inventory-qas-prod.vercel.app
  → Render (API Spring)  cub-api.onrender.com
  → Render (Keycloak)    cub-keycloak.onrender.com
  → Render Postgres      cub-inventory-db
```

Observabilidad completa (Grafana/Jenkins/Sonar) sigue siendo el stack **local** Compose para la defensa tecnica; en la nube se demuestra funcionalidad + auth + API publica.

## URLs

| | Staging | Production |
|--|---------|------------|
| App | https://cub-inventory-qas.vercel.app | https://cub-inventory-qas-prod.vercel.app |
| API health | https://cub-api.onrender.com/actuator/health | igual (API compartida academica) |
| Keycloak | https://cub-keycloak.onrender.com | igual |
| Swagger | https://cub-api.onrender.com/swagger-ui.html | igual |

Credenciales app: `admin/admin123` (tambien viewer/warehouse/clerk).  
Keycloak admin console: `admin` / `admin` (valor inicial del Blueprint; rotar en demos reales).

## Archivos

| Archivo | Rol |
|---------|-----|
| `render.yaml` | Blueprint Render (Postgres + Keycloak + API) |
| `backend/Dockerfile.cloud` | Imagen API para PaaS |
| `backend/docker-entrypoint-cloud.sh` | Convierte `postgres://` → JDBC + issuer Keycloak |
| `keycloak/Dockerfile.cloud` | Imagen Keycloak + realm import |
| `docker-compose.cloud.yml` | Alternativa Railway / compose cloud |
| `frontend/vercel.json` | Proyecto Vercel |
| `scripts/deploy-vercel-cloud.ps1` | Redespliega staging + prod frontends |

## Pasos (primera vez)

1. Push de la rama `presentacion` a GitHub.
2. [Render → New Blueprint](https://dashboard.render.com/select-repo?type=blueprint) → repo `quality_assurance` → rama `presentacion` → Apply `render.yaml`.
3. Espera a que `cub-keycloak` y `cub-api` queden **Live** (build largo la primera vez).
4. En Keycloak (Admin), confirma redirects del client `inventory-frontend` (ya vienen `https://*.vercel.app/*` en `realm-export.json`).
5. Redespliega Vercel:

```powershell
$env:CLOUD_API_URL = "https://cub-api.onrender.com"
$env:CLOUD_KC_URL = "https://cub-keycloak.onrender.com"
.\scripts\deploy-vercel-cloud.ps1
```

6. Abre staging y production; login con `admin/admin123`.

## Notas Render free

- Cold start ~30–90s tras dormir.
- Keycloak en 512 MB es justo; si falla por memoria, subir el plan de `cub-keycloak` a Starter.
- Postgres free expira a los 30 dias: exportar dump antes si hace falta.

## Alternativa Railway

```powershell
# Tras railway login
railway init
railway up -c docker-compose.cloud.yml
```

Luego exporta las URLs publicas a `CLOUD_API_URL` / `CLOUD_KC_URL` y corre `deploy-vercel-cloud.ps1`.
