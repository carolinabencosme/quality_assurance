package com.company.inventory.security;

import dasniko.testcontainers.keycloak.KeycloakContainer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Valida JWT reales emitidos por Keycloak importando el realm del repo.
 */
@SpringBootTest(properties = {
        "inventory.security.enabled=true",
        "inventory.test.jwt-decoder.enabled=false",
        "management.health.db.enabled=false"
})
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
@AutoConfigureMockMvc
@Import(KeycloakContainerIntegrationTest.RealJwtDecoderConfig.class)
class KeycloakContainerIntegrationTest {

    private static final String REALM = "inventory-realm";
    private static final String FRONTEND_CLIENT = "inventory-frontend";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("inventory_keycloak_test")
            .withUsername("inventory_user")
            .withPassword("inventory_password");

    /**
     * En Windows + realm con Authorization Services el arranque supera el timeout
     * por defecto de /health/started. Esperamos el realm HTTP y damos 5 minutos.
     */
    @Container
    static KeycloakContainer keycloak = new KeycloakContainer("quay.io/keycloak/keycloak:26.0.7")
            .withAdminUsername("admin")
            .withAdminPassword("admin")
            .withRealmImportFile("keycloak/realm-export.json")
            .withEnv("KC_HEALTH_ENABLED", "true")
            .withEnv("JAVA_OPTS_KC_HEAP", "-Xms64m -Xmx512m")
            .withStartupTimeout(Duration.ofMinutes(5))
            .waitingFor(Wait.forHttp("/realms/inventory-realm")
                    .forPort(8080)
                    .forStatusCode(200)
                    .withStartupTimeout(Duration.ofMinutes(5)));

    @Autowired
    private MockMvc mockMvc;

    private final RestTemplate restTemplate = new RestTemplate();

    @DynamicPropertySource
    static void keycloakProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.security.oauth2.resourceserver.jwt.issuer-uri",
                () -> keycloak.getAuthServerUrl() + "/realms/" + REALM);
        registry.add("spring.security.oauth2.resourceserver.jwt.jwk-set-uri",
                () -> keycloak.getAuthServerUrl() + "/realms/" + REALM
                        + "/protocol/openid-connect/certs");
        registry.add("inventory.keycloak.admin.server-url", keycloak::getAuthServerUrl);
        registry.add("inventory.keycloak.admin.realm", () -> REALM);
        registry.add("inventory.keycloak.admin.client-id", () -> "inventory-admin-api");
        registry.add("inventory.keycloak.admin.client-secret", () -> "inventory-admin-secret-change-me");
    }

    @Test
    void noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void viewerToken_canReadDashboard() throws Exception {
        String token = obtainToken("viewer", "viewer123",
                "openid profile email product:view stock:view report:view");

        mockMvc.perform(get("/api/v1/reports/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void viewerToken_cannotReadPermissionMatrix() throws Exception {
        String token = obtainToken("viewer", "viewer123",
                "openid profile email product:view stock:view report:view");

        mockMvc.perform(get("/api/v1/security/permissions-matrix")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminToken_canReadPermissionMatrix() throws Exception {
        String token = obtainToken("admin", "admin123",
                "openid profile email product:view product:manage stock:view stock:manage report:view user:manage audit:view");

        mockMvc.perform(get("/api/v1/security/permissions-matrix")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void realToken_exposesBusinessScopesAndAuthorities() throws Exception {
        String token = obtainToken("admin", "admin123",
                "openid profile email product:view product:manage stock:view stock:manage report:view user:manage audit:view");

        mockMvc.perform(get("/api/v1/security/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.authorities")
                        .value(org.hamcrest.Matchers.hasItems("product:view", "SCOPE_product:view", "user:manage")));
    }

    @Test
    void viewerToken_cannotListUsers() throws Exception {
        String token = obtainToken("viewer", "viewer123",
                "openid profile email product:view stock:view report:view");

        mockMvc.perform(get("/api/v1/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminToken_canListRealKeycloakUsers() throws Exception {
        String token = obtainToken("admin", "admin123",
                "openid profile email product:view product:manage stock:view stock:manage report:view user:manage audit:view");

        mockMvc.perform(get("/api/v1/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[*].username")
                        .value(org.hamcrest.Matchers.hasItem("admin")));
    }

    private String obtainToken(String username, String password, String scopes) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", FRONTEND_CLIENT);
        body.add("username", username);
        body.add("password", password);
        body.add("scope", scopes);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                keycloak.getAuthServerUrl() + "/realms/" + REALM + "/protocol/openid-connect/token",
                new HttpEntity<>(body, headers),
                Map.class
        );

        Object token = response.getBody() != null ? response.getBody().get("access_token") : null;
        assertThat(token).as("access_token").isInstanceOf(String.class);
        return (String) token;
    }

    @TestConfiguration
    static class RealJwtDecoderConfig {
        @Bean
        @Primary
        JwtDecoder keycloakJwtDecoder(
                @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri) {
            return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        }
    }
}
