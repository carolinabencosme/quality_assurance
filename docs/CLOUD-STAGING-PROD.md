# Staging y Production en la nube (Vercel + Render)

Objetivo: demos publicas **sin** Docker en la PC.

## URLs

| | Staging | Production |
|--|---------|------------|
| App | https://cub-inventory-qas.vercel.app | https://cub-inventory-qas-prod.vercel.app |
| API | https://cub-api-elre.onrender.com | igual |
| Keycloak | https://cub-keycloak.onrender.com | igual |
| Swagger | https://cub-api-elre.onrender.com/swagger-ui.html | igual |

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
- https://cub-api-elre.onrender.com/actuator/health → `UP`  
- https://cub-inventory-qas.vercel.app → login `admin` / `admin123`

9. Si cambiaste URLs de API/KC, redespliega frontends:

```powershell
$env:CLOUD_API_URL = "https://cub-api-elre.onrender.com"
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

## Por que fallaba `cub-api` (Timed Out / port / pending eterno)

Spring tarda ~2–3 min en free tier. Dos fallos tipicos:

1. **Puerto tarde:** Render veia “No open ports” y reiniciaba el deploy.  
2. **Puerto pronto con socat crudo:** `$PORT` abría al instante, pero `/actuator/health` fallaba mientras `8080` aun no escuchaba → deploy “Live” a medias y el dashboard de Vercel se quedaba en **(pending)**.

Fix actual: `backend/cloud-port-gate.py` + `docker-entrypoint-cloud.sh`:

- Abre `$PORT` al instante.
- Mientras Spring arranca, `GET /actuator/health` responde **200** (gate).
- Cuando Spring está `UP` en `8080`, el gate hace **proxy** de todo el trafico a la API.

## Por que fallaba `cub-keycloak` (Port scan timeout / Timed Out)

`start-dev` recompila providers en cada arranque (“Updating the configuration…”) **antes** de abrir HTTP. En free tier eso supera el port-scan de Render → **Timed Out**.

Fix:

- `keycloak/Dockerfile.cloud` hace `kc.sh build --db=postgres` en build time.
- Runtime usa `kc.sh start --optimized` (mucho mas rapido).
- `keycloak/cloud-port-gate.py` abre `$PORT` al instante y responde **200** en `/` (healthcheck del blueprint) hasta que Keycloak escuche en `8080`; luego hace proxy.

## Notas free tier

- Cold start 30–90s.  
- Si `cub-keycloak` se cae por memoria, sube ese servicio a **Starter**.  
- Postgres free expira ~30 dias.
