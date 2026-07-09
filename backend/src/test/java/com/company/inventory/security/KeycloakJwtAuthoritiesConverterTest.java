package com.company.inventory.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class KeycloakJwtAuthoritiesConverterTest {

    private final KeycloakJwtAuthoritiesConverter converter = new KeycloakJwtAuthoritiesConverter();

    @Test
    void expandsRealmRolesToGranularPermissions() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("realm_access", Map.of("roles", List.of("inventory-viewer")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        Collection<GrantedAuthority> authorities = converter.convert(jwt);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder("product:view", "stock:view", "report:view");
    }

    @Test
    void extractsClientRolesFromResourceAccess() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("resource_access", Map.of(
                        "inventory-api", Map.of("roles", List.of("product:view", "stock:manage"))
                ))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        Collection<GrantedAuthority> authorities = converter.convert(jwt);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder("product:view", "stock:manage");
    }

    @Test
    void extractsKnownScopesWhenNoRoleClaimsExist() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("scope", "openid profile product:view audit:view unknown:scope")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        Collection<GrantedAuthority> authorities = converter.convert(jwt);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder(
                        "product:view", "SCOPE_product:view",
                        "audit:view", "SCOPE_audit:view");
    }

    @Test
    void addsScopeAliasesOnlyForRoleBackedPermissionsWhenRolesExist() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("realm_access", Map.of("roles", List.of("inventory-viewer")))
                .claim("scope", "product:view stock:view report:view audit:view user:manage")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        Collection<GrantedAuthority> authorities = converter.convert(jwt);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .contains(
                        "product:view", "SCOPE_product:view",
                        "stock:view", "SCOPE_stock:view",
                        "report:view", "SCOPE_report:view")
                .doesNotContain("audit:view", "SCOPE_audit:view", "user:manage", "SCOPE_user:manage");
    }

    @Test
    void supportsScopeClaimAsCollection() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("scope", List.of("product:view", "stock:manage", "not:known"))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        Collection<GrantedAuthority> authorities = converter.convert(jwt);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder(
                        "product:view", "SCOPE_product:view",
                        "stock:manage", "SCOPE_stock:manage");
    }
}
