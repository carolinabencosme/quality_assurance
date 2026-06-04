package com.company.inventory.security;

/**
 * Rutas HTTP públicas del Resource Server (sin JWT).
 * Cualquier otra ruta queda denegada por defecto ({@code denyAll}).
 */
public final class PublicApiPaths {

    public static final String[] ACTUATOR = {
            "/actuator/health",
            "/actuator/health/**",
            "/actuator/info",
            "/actuator/prometheus",
    };

    public static final String[] OPENAPI = {
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/api-docs",
            "/api-docs/**",
            "/v3/api-docs/**",
    };

    private PublicApiPaths() {
    }
}
