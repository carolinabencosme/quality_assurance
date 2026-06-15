package com.company.inventory.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI inventoryOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Inventory QAS API")
                .description("""
                        API REST v1 del sistema de inventarios empresarial.
                        
                        **Endpoints documentados:**
                        - `GET /api/v1/products` — CRUD productos (permisos product:view / product:manage)
                        - `GET /api/v1/categories` — Catálogo de categorías
                        - `GET|POST /api/v1/stock` — Existencias y movimientos (stock:view / stock:manage)
                        - `GET /api/v1/reports/*` — Dashboard y productos críticos (report:view)
                        - `GET /api/v1/audit` — Historial Envers (audit:view)
                        
                        Autenticación: JWT Bearer emitido por Keycloak realm `inventory-realm`.
                        """)
                        .version("1.0.0")
                        .contact(new Contact().name("Inventory QAS Team")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Development")))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Token JWT emitido por Keycloak (Fase 2)")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME));
    }
}
