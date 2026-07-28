# Staging y Production en la nube (Vercel + Render)

Objetivo: demos publicas **sin** Docker en la PC.

## URLs

| | Staging | Production |
|--|---------|------------|
| App | https://cub-inventory-qas.vercel.app | https://cub-inventory-qas-prod.vercel.app |
| API | https://cub-api.onrender.com | igual |
| Keycloak | https://cub-keycloak.onrender.com | igual |
| Swagger | https://cub-api.onrender.com/swagger-ui.html | igual |

Usuarios app: `admin/admin123`, `viewer/viewer123`, `warehouse/warehouse123`, `clerk/clerk123`.  
Keycloak Admin: `admin` / `admin`.

## Deploy Render (obligatorio — un clic)

Si al login en Vercel ves **Not Found** en Keycloak, el Blueprint **no** esta aplicado o el realm no se importo.

1. Abre: https://dashboard.render.com/select-repo?type=blueprint  
2. Conecta `carolinabencosme/quality_assurance`.  
3. Branch: **`presentacion`**.  
4. Debe detectar `render.yaml`.  
5. **Apply**.  
6. Espera a que queden **Live**:
   - `cub-inventory-db`
   - `cub-keycloak`
   - `cub-api`  
   (nombres exactos; las URLs `*.onrender.com` dependen de esos nombres)

7. Importa el realm (si el OpenID del realm falla):

```powershell
.\scripts\import-keycloak-realm-cloud.ps1
```

8. Verifica:

- https://cub-keycloak.onrender.com/realms/inventory-realm/.well-known/openid-configuration → JSON  
- https://cub-api.onrender.com/actuator/health → `UP`  
- https://cub-inventory-qas.vercel.app → login `admin` / `admin123`

9. Si cambiaste URLs de API/KC, redespliega frontends:

```powershell
$env:CLOUD_API_URL = "https://cub-api.onrender.com"
$env:CLOUD_KC_URL = "https://cub-keycloak.onrender.com"
.\scripts\deploy-vercel-cloud.ps1
```

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `render.yaml` | Blueprint (healthcheck Keycloak en `/`, no en el realm) |
| `keycloak/Dockerfile.cloud` | KC 26 + `KC_BOOTSTRAP_ADMIN_*` + `--import-realm` |
| `keycloak/realm-export.json` | Realm + users + redirects `*.vercel.app` |
| `backend/Dockerfile.cloud` | API cloud |
| `scripts/import-keycloak-realm-cloud.ps1` | Fallback import Admin API |
| `scripts/deploy-vercel-cloud.ps1` | Staging + prod Vercel |

## Por que fallaba `cub-api` (Timed Out / port)

Spring tarda ~2–3 min en abrir el puerto. Render veia “No open ports”, luego “New primary port detected: 10000” y **reiniciaba** el deploy; el segundo boot hacia **Timed Out**.

Fix: `backend/docker-entrypoint-cloud.sh` abre `$PORT` al instante con **socat** y Spring escucha en `8080` interno. Healthcheck sigue en `/actuator/health`.

## Por que fallaba el Not Found

El healthcheck apuntaba a `/realms/inventory-realm/...` **antes** de que terminara el import. Render reiniciaba el contenedor en loop → realm nunca quedaba → login Vercel = Not Found.

## Notas free tier

- Cold start 30–90s.  
- Si `cub-keycloak` se cae por memoria, sube ese servicio a **Starter**.  
- Postgres free expira ~30 dias.
