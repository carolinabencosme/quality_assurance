# QA-74 - Codex task: visual system YC/a16z level

## Objetivo

Elevar el frontend de Inventory QAS a una experiencia SaaS operativa de nivel inversionista: sobria, precisa, con jerarquia visual clara, paleta solida y acabados profesionales. El resultado debe sentirse listo para demo ejecutiva, no como plantilla generica.

## Rama

`feature/QA-74-visual-system-yc-a16z`

## Contexto del producto

Inventory QAS es una app interna de inventario con dashboard, productos, movimientos de stock, auditoria y reportes. La interfaz debe priorizar lectura rapida, comparacion de datos, accion operativa y confianza tecnica.

## Alcance

- Redisenar el sistema visual global en `frontend/app/globals.css`.
- Refinar shell, sidebar, topbar, tablas, filtros, formularios, paneles, KPIs, alerts, loading, empty states y badges.
- Ajustar componentes y paginas si la semantica HTML o estructura visual actual limita un resultado premium.
- Cubrir como minimo:
  - `/dashboard`
  - `/products`
  - `/products/new`
  - `/products/[id]/edit`
  - `/stock/movements`
  - `/audit`
  - `/reports`
  - login

## Direccion visual

- Benchmark: dashboard SaaS profesional de calidad Y Combinator / a16z.
- Paleta solida, sin difuminados, sin gradientes, sin orbes, sin brillos decorativos.
- Evitar una interfaz dominada por un solo tono verde. Mantener verde como acento de marca, no como todo el sistema.
- Propuesta de paleta:
  - Ink: `#17211b`
  - Charcoal: `#253028`
  - Canvas: `#f6f7f4`
  - Surface: `#ffffff`
  - Line: `#dfe5dc`
  - Muted text: `#667166`
  - Brand green: `#1f7a4d`
  - Blue data accent: `#2563eb`
  - Amber warning: `#b7791f`
  - Red danger: `#b42318`
- Usar color para estado y jerarquia, no como decoracion.
- Layout denso, ordenado y facil de escanear. No crear landing page ni hero marketing.
- Cards solo para unidades reales de informacion. No meter cards dentro de cards.
- Bordes maximo 8px salvo elementos circulares como avatar.
- Tipografia limpia con escala controlada. Sin letras con tracking negativo.
- Botones y controles con estados hover/focus/disabled consistentes.
- Tablas con headers claros, filas escaneables y acciones visibles sin ruido.
- Formularios con labels, ayuda contextual compacta, errores claros y areas de accion bien alineadas.

## Restricciones

- No gradientes (`linear-gradient`, `radial-gradient`, etc.) en el resultado final.
- No blur decorativo (`filter: blur`, `backdrop-filter: blur`) ni efectos difuminados.
- No sombras grandes ni glow. Si se usan sombras, deben ser muy sutiles y funcionales.
- No ilustraciones genericas ni elementos decorativos abstractos.
- No texto dentro de la UI explicando que el diseno es profesional o como usarlo.
- No romper contratos API, permisos, rutas ni flujos existentes.
- No introducir librerias de UI nuevas salvo que sea estrictamente necesario.
- Mantener TypeScript estricto.

## Entregables esperados

- CSS global refinado con tokens claros y reutilizables.
- Componentes actualizados donde haga falta para lograr consistencia visual.
- Estados visuales coherentes para loading, error, empty, disabled y focus.
- Responsive funcional en desktop y mobile.
- Capturas de verificacion para dashboard, productos y login si se ejecuta Playwright o navegador local.

## Criterios de aceptacion

- `npm run build` pasa en `frontend`.
- No quedan usos de `linear-gradient`, `radial-gradient` o glow decorativo en CSS/TSX.
- No quedan usos de blur visual decorativo en CSS/TSX.
- La app se ve profesional en 1440px, 1024px y mobile.
- La navegacion conserva estado activo y no hay solapamientos de texto.
- La paleta usa neutros fuertes + acentos controlados, con contraste accesible.
- Dashboard y tablas comunican prioridad operacional sin parecer una plantilla.
- El diff queda enfocado en frontend y documentacion relacionada.

## Verificacion sugerida para Codex

```powershell
cd frontend
npm run build
```

Opcional si hay entorno local disponible:

```powershell
cd frontend
npm run dev
```

Revisar visualmente:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/products`
- `http://localhost:3000/stock/movements`
- `http://localhost:3000`
