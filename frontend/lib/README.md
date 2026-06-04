# Cliente HTTP — Axios (QA-26)

Ticket **QA-26** — cliente Axios con `baseURL`, interceptors y manejo 401/403 (Keycloak Fase 2).

## Archivos

| Archivo | Rol |
|---------|-----|
| `lib/axiosClient.ts` | Instancia Axios + interceptors |
| `lib/api.ts` | Facade `apiGet` / `apiPost` / `apiPut` / `apiDelete` |
| `lib/auth.ts` | Token Bearer y refresh |

## Configuración

- **baseURL:** `NEXT_PUBLIC_API_URL` (default `/api/v1`, proxy Next.js → backend)
- **Request interceptor:** adjunta `Authorization: Bearer <token>` vía `getValidAccessToken()`
- **Response interceptor:**
  - **401** → limpia sesión y redirige a `/?reason=session`
  - **403** → `ApiError` con mensaje del backend o texto por defecto
  - Otros errores → parsea `ApiErrorResponse.message` del JSON estándar (QA-18)

## Uso

```tsx
import { apiGet, ApiError } from '@/lib/api';

try {
  const data = await apiGet<Dashboard>('/reports/dashboard');
} catch (e) {
  if (e instanceof ApiError && e.status === 403) {
    // sin permiso
  }
}
```

## Trazabilidad

| Requisito | Implementación |
|-----------|----------------|
| Bearer token | Request interceptor + `lib/auth.ts` |
| 401 / 403 | Response interceptor |
| JSON error estándar | `ApiErrorBody` + `correlationId` opcional |
