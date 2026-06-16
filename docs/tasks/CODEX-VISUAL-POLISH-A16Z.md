# Task Codex — Visual polish nivel a16z (Cub)

**Proyecto:** Inventory QAS monorepo · frontend Next.js 15  
**Marca:** **Cub** (`frontend/lib/brand.ts`)  
**Objetivo:** Elevar el diseño visual de la landing y de toda la aplicación autenticada a nivel **SaaS premium** (referencia: Linear, Vercel, Visitors, dashboards YC/a16z). Debe verse **impecable**, coherente y listo para demo de defensa académica.

**Rama sugerida:** `feature/cub-visual-a16z` desde `develop`  
**NO tocar:** lógica de auth (`lib/auth.ts`), permisos, API calls, middleware, backend, tests E2E salvo selectores rotos por cambios de UI.

---

## 1. North star (criterio de éxito)

Al terminar, un evaluador debe pensar: *“esto parece un producto real de startup, no un CRUD de curso”*.

| Dimensión | Meta |
|-----------|------|
| **Coherencia** | Un solo design system; cero restos de “Inventory QAS” / “IQ” en UI |
| **Jerarquía** | Tipografía, espaciado y color guían la mirada sin esfuerzo |
| **Profundidad** | Capas (blobs, cards, sombras suaves), no flat aburrido |
| **Motion** | Animaciones sutiles, 60fps, `prefers-reduced-motion` respetado |
| **Detalle** | Hover/focus/empty/loading/error states pulidos en cada pantalla |
| **Responsive** | Mobile-first; dock nav y tablas usables en 375px |
| **Performance** | Sin librerías pesadas innecesarias; CSS + React nativo |

---

## 2. Referencias visuales (inspiración, no copia literal)

1. **Landing SaaS “Visitors”** — hero centrado, nav pill flotante oscura, preview de producto elevado, gradientes lavanda/índigo/rosa, mucho whitespace.
2. **Login Keycloak** — sección de acceso oscura, patrón geométrico low-poly, card flotante, CTA azul `#1b9af7`, inputs con borde fino.
3. **Dashboard a16z/YC** — KPI cards limpias, timeline de actividad, dock navigation inferior, métricas con tipografía bold y labels uppercase pequeños.
4. **Linear / Vercel** — micro-interacciones, bordes `1px` sutiles, radius generosos (16–24px), sombras difusas con tinte de marca.

---

## 3. Design system (centralizar y aplicar)

### 3.1 Tokens (actualizar en `frontend/app/globals.css`)

Mantener o refinar variables CSS en `:root`:

```css
/* Ejemplo orientativo — ajustar hasta perfección */
--font: 'Inter', system-ui, sans-serif;
--ink: #0f0f14;
--surface: #ffffff;
--surface-muted: #f4f4f7;
--line: #e8e8ef;
--brand: #6366f1;
--brand-strong: #4f46e5;
--gradient-brand: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
--radius-lg: 24px;
--radius-md: 16px;
--radius-sm: 10px;
--radius-pill: 999px;
--shadow-lg: 0 24px 80px rgb(99 102 241 / 12%);
--dock-bg: #14141c;
```

**Acción Codex:** auditar `globals.css` (~1800 líneas), eliminar duplicados/dead CSS (p. ej. estilos `.sidebar` si ya no se usa), agrupar por secciones con comentarios claros.

### 3.2 Tipografía

| Uso | Tamaño | Peso | Tracking |
|-----|--------|------|----------|
| Hero H1 | clamp(2.5rem, 6vw, 4rem) | 700 | -0.04em |
| Page title | 1.75–2rem | 700 | -0.025em |
| Section title | 1.5rem | 650 | -0.02em |
| Body | 15px | 400 | normal |
| Label/KPI | 0.72rem | 600 | 0.04em uppercase |
| Muted | 0.88–0.93rem | 400 | normal |

### 3.3 Iconografía

Reemplazar caracteres Unicode (`◆`, `▣`, `↕`) por **SVG inline** o componente `Icon` ligero (sin instalar `@heroicons` si se puede evitar — SVGs inline en `components/icons/`).

---

## 4. Alcance por área

### 4.1 Landing / Main page (`/`)

**Archivos:**
- `frontend/app/page.tsx`
- `frontend/components/LandingPage.tsx`
- `frontend/components/LoginForm.tsx`
- `frontend/components/DashboardPreview.tsx`
- `frontend/components/BrandMark.tsx`
- `frontend/components/Reveal.tsx`

**Requisitos:**

- [ ] **Hero:** tag animado, headline con gradient text opcional en una palabra clave, subcopy max-width 540px, CTAs con hover scale sutil.
- [ ] **Nav pill:** sticky, blur backdrop, links con underline animado, botón gradient con glow.
- [ ] **Features grid (6 cards):** icon SVG, hover lift + border brand, stagger reveal al scroll.
- [ ] **Stats bar:** números con gradient clip o contador animado.
- [ ] **Product preview:** mock dashboard más fiel al app real (usar datos fake realistas); barras de chart animadas; dock preview; sombra profunda; parallax leve opcional en scroll.
- [ ] **Login section:** fondo dark geometric full-bleed; card glassmorphism; toggle password; estados focus accesibles; spinner en botón.
- [ ] **Footer:** links a puertos (3000/8080/8081), copyright PUCMM discreto.
- [ ] **Fondo:** 3 blobs animados + grid mask; sin jank en mobile.

### 4.2 App shell (layout autenticado)

**Archivos:**
- `frontend/components/AppShell.tsx`
- `frontend/components/Topbar.tsx`
- `frontend/components/DockNav.tsx`
- `frontend/app/(app)/layout.tsx`

**Requisitos:**

- [ ] Canvas con blobs sutiles (no distraer del contenido).
- [ ] `app-frame`: card blanca max-width 1200px, radius 24px, shadow-lg.
- [ ] **Topbar:** BrandMark + nombre Cub; avatar gradient; logout ghost button; breadcrumb opcional según ruta.
- [ ] **Dock nav:** pill oscuro fijo abajo; iconos SVG; label visible desktop / solo icono mobile; indicador activo animado (pill deslizante); badge opcional en Stock si hay alertas (mock o hook futuro).
- [ ] **Eliminar o actualizar** `frontend/components/Sidebar.tsx` — aún dice “Inventory QAS” / “IQ”; no debe usarse; borrar si está muerto o migrar a Cub.

### 4.3 Dashboard (`/dashboard`)

**Archivo:** `frontend/app/(app)/dashboard/page.tsx`

- [ ] KPI grid 6 cards con AnimatedNumber (ya existe — pulir easing).
- [ ] Empty states ilustrados (icono + copy amigable).
- [ ] Listas críticos/movimientos: timeline visual con línea vertical, badges de tipo movimiento.
- [ ] Skeleton loading coherente con layout final.
- [ ] Reveal stagger en paneles.

### 4.4 Productos (`/products`, `/products/new`, `/products/[id]/edit`)

**Archivos:** pages + `ProductFilters.tsx`, `ProductForm.tsx`, `DataTable.tsx`

- [ ] Page header con acción primaria destacada (“Nuevo producto”).
- [ ] Filter bar como card compacta con chips activos visibles.
- [ ] **DataTable premium:** header sticky, row hover, zebra sutil, badges status (Activo/Inactivo/Crítico) refinados.
- [ ] Paginación con iconos prev/next, no solo texto.
- [ ] Formularios: labels, hints, validación visual, grid 2 cols en desktop.
- [ ] Edit: botón delete con confirmación visual (modal ligero CSS o `confirm` estilizado).

### 4.5 Stock (`/stock/movements`)

**Archivos:** `stock/movements/page.tsx`, `StockMovementForm.tsx`

- [ ] Split view: formulario registrar movimiento + tabla historial.
- [ ] Badges IN/OUT/ADJUSTMENT con colores semánticos consistentes.
- [ ] Delta positivo/negativo con flechas SVG, no solo `+/-` texto.

### 4.6 Reportes (`/reports`)

- [ ] Reutilizar componentes de dashboard (critical list + movements) con layout pulido.
- [ ] Título + descripción + empty state premium.

### 4.7 Auditoría (`/audit`)

- [ ] Tabla con columna action badge, timestamps legibles, filtros si existen en API.
- [ ] Sensación “compliance / enterprise”.

### 4.8 Componentes compartidos

| Componente | Mejoras |
|------------|---------|
| `BrandMark.tsx` | Variantes sm/md/lg; animación hover rotate sutil |
| `AnimatedNumber.tsx` | Easing cubic-bezier; format currency |
| `Reveal.tsx` | threshold configurable; once only |
| `DataTable.tsx` | skeleton shimmer, empty illustration |
| `SessionGuard.tsx` | loading screen Cub-branded (no flash blanco) |

### 4.9 Metadata y marca

- [ ] `frontend/app/layout.tsx` — title/description Cub
- [ ] `frontend/lib/brand.ts` — única fuente de verdad; exportar `FEATURES`, `STATS` si hace falta
- [ ] Buscar y reemplazar en todo `frontend/`: `Inventory QAS`, `IQ`, referencias PUCMM excesivas fuera del footer

---

## 5. Motion guidelines

```css
/* Duraciones */
--motion-fast: 150ms;
--motion-base: 250ms;
--motion-slow: 600ms;

/* Easing */
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Usar en:**
- Page enter (fade-up 20px)
- Card hover (translateY -4px, shadow)
- Button active (scale 0.98)
- Dock active indicator (slide)
- Chart bars (height transition staggered)

**Obligatorio:** bloque `@media (prefers-reduced-motion: reduce)` desactivando animaciones (parcialmente implementado — completar).

**Prohibido:** animaciones infinitas agresivas, parallax que cause mareo, blur > 20px en mobile.

---

## 6. Responsive breakpoints

| Breakpoint | Comportamiento |
|------------|----------------|
| `< 480px` | Dock solo iconos; KPI 2 cols; forms full width |
| `480–768px` | Stats 2x2; preview stack vertical |
| `768–1024px` | Grid 2 cols en panels |
| `> 1024px` | Layout completo; max-width contenido |

Probar en **375×812** (iPhone) y **1440×900** (laptop).

---

## 7. Accesibilidad (mínimo)

- [ ] Contraste WCAG AA en textos y botones
- [ ] `:focus-visible` en todos los interactivos
- [ ] `aria-label` en dock icons-only mobile
- [ ] Form labels asociados; errores con `role="alert"`
- [ ] No depender solo del color para estado (badges con texto)

---

## 8. Restricciones técnicas

1. **Stack:** Next.js 15 App Router, React 19, TypeScript, CSS en `globals.css` (sin Tailwind instalado actualmente — no añadir Tailwind salvo acuerdo explícito).
2. **Sin romper:** login Keycloak, cookies, proxy `/api` y `/keycloak` en Docker.
3. **Docker dev:** frontend en puerto **3000**; hot reload vía volumen.
4. **Build debe pasar:** `cd frontend && npm run build`
5. **Commits:** Conventional Commits, ej. `feat(ui): polish Cub landing hero and dock nav`
6. **Scope:** solo `frontend/` + este doc si hace falta actualizar checklist.

---

## 9. Entregables

1. UI visualmente coherente en **todas** las rutas listadas.
2. `globals.css` organizado y sin CSS muerto evidente.
3. Componentes SVG icon set mínimo en `frontend/components/icons/`.
4. Capturas recomendadas para evidencias:
   - `docs/qa-evidence/screenshots/cub-landing.png`
   - `docs/qa-evidence/screenshots/cub-dashboard.png`
   - `docs/qa-evidence/screenshots/cub-products.png`
   - `docs/qa-evidence/screenshots/cub-login-dark.png`
5. PR con descripción + checklist abajo copiado.

---

## 10. Checklist de aceptación (copiar en PR)

```markdown
## Visual polish Cub — a16z level

### Landing
- [ ] Hero + nav pill + CTAs pulidos
- [ ] Features + stats + preview animados
- [ ] Login dark Keycloak-style impecable
- [ ] Responsive mobile OK

### App
- [ ] Shell + dock + topbar Cub branding
- [ ] Dashboard KPIs animados + paneles
- [ ] Productos: tabla, filtros, forms
- [ ] Stock: form + historial
- [ ] Reportes + Auditoría
- [ ] Loading / empty / error states

### Calidad
- [ ] Sin "Inventory QAS" / "IQ" en UI
- [ ] npm run build verde
- [ ] prefers-reduced-motion OK
- [ ] Focus visible en controles
```

---

## 11. Verificación local

```powershell
# Desde raíz del repo
docker compose -f docker-compose.dev.yml up -d --build frontend

# URLs
# App:     http://localhost:3000
# API:     http://localhost:8080/swagger-ui.html
# Keycloak http://localhost:8081

# Build
cd frontend
npm run build
```

**Login prueba:** `viewer / viewer123` · `admin / admin123`

---

## 12. Prompt corto para pegar en Codex

```
Eres un senior product designer + frontend engineer. En el repo quality_assurance, rama feature/cub-visual-a16z, ejecuta el task completo en docs/tasks/CODEX-VISUAL-POLISH-A16Z.md.

Objetivo: visual impecable nivel a16z para la marca Cub (frontend Next.js 15). Landing SaaS premium + app autenticada coherente. CSS en globals.css, SVG icons inline, animaciones sutiles, responsive, a11y focus states. NO romper auth/API. NO añadir Tailwind. npm run build debe pasar.

Prioridad: (1) eliminar restos Inventory QAS/IQ, (2) landing hero+login+preview, (3) dock nav + shell, (4) dashboard + productos tabla/forms, (5) stock/reportes/audit, (6) loading/empty states.

Al terminar: checklist del doc en PR + capturas en docs/qa-evidence/screenshots/.
```

---

## 13. Mapa de archivos (referencia rápida)

```
frontend/
├── app/
│   ├── globals.css          ← design system principal
│   ├── layout.tsx           ← metadata Cub
│   ├── page.tsx             ← landing entry
│   └── (app)/
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── products/page.tsx, new/page.tsx, [id]/edit/page.tsx
│       ├── stock/movements/page.tsx
│       ├── reports/page.tsx
│       └── audit/page.tsx
├── components/
│   ├── LandingPage.tsx
│   ├── LoginForm.tsx
│   ├── DashboardPreview.tsx
│   ├── AppShell.tsx, Topbar.tsx, DockNav.tsx
│   ├── BrandMark.tsx, Reveal.tsx, AnimatedNumber.tsx
│   ├── DataTable.tsx, ProductFilters.tsx, ProductForm.tsx
│   ├── StockMovementForm.tsx
│   └── Sidebar.tsx          ← legacy, actualizar o eliminar
└── lib/
    ├── brand.ts             ← nombre Cub, taglines
    └── navigation.ts        ← APP_NAV
```

---

*Documento generado para handoff a Codex — Mayo 2026*
