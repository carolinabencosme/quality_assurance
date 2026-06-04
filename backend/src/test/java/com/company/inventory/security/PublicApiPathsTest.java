package com.company.inventory.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PublicApiPathsTest {

    @Test
    void actuatorPaths_includeHealth() {
        assertThat(PublicApiPaths.ACTUATOR).contains("/actuator/health");
    }

    @Test
    void openApiPaths_includeSwaggerUi() {
        assertThat(PublicApiPaths.OPENAPI).contains("/swagger-ui.html");
    }
}
