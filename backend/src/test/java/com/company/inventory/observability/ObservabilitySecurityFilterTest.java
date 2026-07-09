package com.company.inventory.observability;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class ObservabilitySecurityFilterTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        ObservabilityMdc.clear();
    }

    @Test
    void putsPreferredUsernameInMdcDuringRequest() throws Exception {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("subject-1")
                .claim("preferred_username", "admin")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt, List.of()));

        ObservabilitySecurityFilter filter = new ObservabilitySecurityFilter();
        AtomicReference<String> userInChain = new AtomicReference<>();
        FilterChain chain = (request, response) -> userInChain.set(MDC.get(ObservabilityMdc.USER));

        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/products"),
                new MockHttpServletResponse(),
                chain);

        assertThat(userInChain).hasValue("admin");
    }
}
