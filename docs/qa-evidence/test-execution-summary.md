# Resumen de pruebas — Avance V3

| Métrica | Valor |
|---------|-------|
| Tests totales | 72 |
| Ejecutados | 34 |
| Omitidos (sin Docker local) | 38 |
| Fallos | 0 |
| Errores | 0 |
| Cobertura mínima | **60% líneas** (JaCoCo gate) |
| Resultado `mvn verify` | **BUILD SUCCESS** |

## Comandos

```powershell
cd backend
.\mvnw.cmd verify
```

## Reportes

| Artefacto | Ruta |
|-----------|------|
| JaCoCo HTML | `backend/target/site/jacoco/index.html` |
| Surefire XML | `backend/target/surefire-reports/` |
| CI GitHub Actions | `.github/workflows/ci.yml` |

## Nota CI

En GitHub Actions Docker está disponible → Testcontainers y `ResourceServerSecurityIntegrationTest` **no se omiten**.  
Fix en rama `fix/100%`: `TestJwtDecoderAutoConfiguration` evita llamadas JWKS a Keycloak en perfil `test`.

Generado: 2026-06-14
