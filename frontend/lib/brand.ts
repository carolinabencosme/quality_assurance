export const BRAND = {
  name: 'Cub',
  tagline: 'Tu inventario, en orden.',
  description:
    'Stock en tiempo real, movimientos trazables y auditoria completa en un solo lugar.',
  short: 'Cub',
} as const;

export const LANDING_FEATURES = [
  {
    icon: 'dashboard',
    title: 'Dashboard en vivo',
    desc: 'KPIs, alertas criticas y movimientos recientes en un solo panel.',
  },
  {
    icon: 'package',
    title: 'Catalogo completo',
    desc: 'CRUD de productos con SKU unico, filtros precisos y paginacion.',
  },
  {
    icon: 'stock',
    title: 'Stock trazable',
    desc: 'Entradas, salidas y ajustes con reglas RF-STK e historial claro.',
  },
  {
    icon: 'audit',
    title: 'Auditoria Envers',
    desc: 'Cada cambio queda registrado para cumplimiento y defensa.',
  },
  {
    icon: 'shield',
    title: 'Seguridad JWT',
    desc: 'Keycloak, roles granulares y permisos por endpoint.',
  },
  {
    icon: 'reports',
    title: 'API documentada',
    desc: 'OpenAPI, pruebas Newman y CI automatizado para validar calidad.',
  },
] as const;

export const LANDING_STATS = [
  { value: 14, suffix: '+', label: 'Escenarios API' },
  { value: 60, suffix: '%+', label: 'Cobertura JaCoCo' },
  { value: 7, prefix: 'V1-V', label: 'Migraciones Flyway' },
  { value: 24, suffix: '/7', label: 'Observabilidad' },
] as const;
