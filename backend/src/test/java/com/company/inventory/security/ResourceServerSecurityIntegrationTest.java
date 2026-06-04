package com.company.inventory.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Resource Server con seguridad activa y {@link JwtDecoder} mockeado (sin Keycloak en CI).
 */
@SpringBootTest(properties = "inventory.security.enabled=true")
@Testcontainers(disabledWithoutDocker = true)
@AutoConfigureMockMvc
class ResourceServerSecurityIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("inventory_rs_test")
            .withUsername("inventory_user")
            .withPassword("inventory_password");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtDecoder jwtDecoder;

    @Test
    void actuatorHealth_withoutToken_isPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void swaggerUi_withoutToken_isPublic() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    void apiWithoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownPath_withJwt_returns403() throws Exception {
        mockMvc.perform(get("/internal/debug").with(jwt()))
                .andExpect(status().isForbidden());
    }

    @Test
    void apiWithJwtButNoPermission_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/products").with(jwt()))
                .andExpect(status().isForbidden());
    }

    @Test
    void apiWithProductView_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .with(jwt().authorities(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                        Permission.PRODUCT_VIEW))))
                .andExpect(status().isOk());
    }
}
