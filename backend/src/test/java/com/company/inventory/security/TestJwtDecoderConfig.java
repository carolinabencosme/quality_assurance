package com.company.inventory.security;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

/**
 * JwtDecoder de prueba sin red (CI no tiene Keycloak en localhost:8081).
 */
@TestConfiguration
public class TestJwtDecoderConfig {

    @Bean
    @Primary
    JwtDecoder jwtDecoder() {
        return token -> Jwt.withTokenValue(token != null ? token : "test-token")
                .header("alg", "none")
                .subject("ci-test-user")
                .claim("preferred_username", "ci-test-user")
                .build();
    }
}
