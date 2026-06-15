package com.company.inventory.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

/**
 * JwtDecoder en memoria para perfil {@code test} — evita llamadas JWKS a Keycloak en CI (GitHub Actions).
 */
@Configuration
@Profile("test")
@ConditionalOnProperty(name = "inventory.security.enabled", havingValue = "true", matchIfMissing = true)
public class TestJwtDecoderAutoConfiguration {

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
