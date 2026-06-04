# AppShell — layout con sidebar, topbar y usuario (QA-28)

Layout principal de la aplicación autenticada: navegación lateral, barra superior con sesión y área de contenido.

## Estructura

```
SessionGuard
└── AppShell
    ├── Sidebar      — módulos del plan
    ├── Topbar       — contexto + usuario JWT + logout
    └── main-area    — páginas hijas
```

## Navegación

| Módulo     | Ruta               | Notas                                      |
|------------|--------------------|--------------------------------------------|
| Dashboard  | `/dashboard`       | KPIs operativos                            |
| Productos  | `/products`        | Catálogo CRUD                              |
| Stock      | `/stock/movements` | Movimientos (requiere QA-27 en `develop`)  |
| Reportes   | `/reports`         | Alertas y movimientos recientes            |
| Auditoría  | `/audit`           | Historial Envers                           |

## Usuario en topbar

El token JWT (`inventory_access`) se decodifica en cliente (`lib/sessionUser.ts`) para mostrar:

- Nombre (`name`) o `preferred_username`
- Email si está en el claim
- Iniciales en avatar
- Botón **Salir** (limpia sesión y redirige a login)

## Verificación local

1. `docker compose -f docker-compose.dev.yml up -d` (backend + Keycloak).
2. `cd frontend && npm run dev`
3. Login con `admin/admin123` o `viewer/viewer123`.
4. Comprobar sidebar (5 ítems), topbar con usuario y navegación entre módulos.

## Archivos

- `frontend/components/AppShell.tsx`
- `frontend/components/Sidebar.tsx`
- `frontend/components/Topbar.tsx`
- `frontend/lib/navigation.ts`
- `frontend/lib/sessionUser.ts`
- `frontend/app/(app)/layout.tsx`
