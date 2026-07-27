# Rama `defensa` — indice de estudio

> Empieza aqui. Esta rama deja listo el material para estudiar, probar y presentar el Proyecto Final V3 (Cub).

## Orden recomendado de estudio (1–2 dias)

| Paso | Documento | Objetivo |
|-----:|-----------|----------|
| 1 | Este README | Orientarte |
| 2 | [LINKS-DEMO-PROFESOR.md](./LINKS-DEMO-PROFESOR.md) | **Todos los links** para probar con el profesor |
| 3 | [../EXTERNAL-TOOLS.md](../EXTERNAL-TOOLS.md) | Grafana, Sonar, Prometheus, Alertmanager |
| 4 | [GUIA-ESTUDIO-Y-PRUEBAS-V3.md](./GUIA-ESTUDIO-Y-PRUEBAS-V3.md) | Mapa de codigo + como probar + que decir |
| 5 | [GUIA-PRESENTACION-FINAL-V3.md](./GUIA-PRESENTACION-FINAL-V3.md) | Guion oral con tiempos |
| 6 | [../architecture.md](../architecture.md) | Diagramas C4 (L1/L2/L3) |
| 7 | [guion-sellado-v3.md](./guion-sellado-v3.md) | 5 demos cortas de sellado |
| 8 | [../qa-evidence/FINAL-CHECKLIST.md](../qa-evidence/FINAL-CHECKLIST.md) | Que ya esta sellado |
| 9 | [preguntas-defensa-completa.md](./preguntas-defensa-completa.md) | Preguntas tipicas |

## Arranque rapido del sistema

```powershell
git checkout defensa
git pull
copy .env.example .env
docker compose -f docker-compose.dev.yml -f docker-compose.observability.yml up -d --build
```

| URL | Uso |
|-----|-----|
| http://localhost:3000 | App Cub |
| http://localhost:8080/swagger-ui.html | API |
| http://localhost:8081 | Keycloak |
| http://localhost:3030 | Grafana |

Usuarios: `admin/admin123`, `viewer/viewer123`, `warehouse/warehouse123`, `clerk/clerk123`.

## Bateria de pruebas

```powershell
$env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "//./pipe/docker_engine"
.\scripts\run-all-tests.ps1
```

Detalle por capa: [../testing-guide.md](../testing-guide.md).

## Que no tocar en defensa

- No borrar `.env` local con secretos reales.
- No commitear `.vscode/`.
- Keycloak publico: `http://localhost:8081` (no revertir a proxy roto).
