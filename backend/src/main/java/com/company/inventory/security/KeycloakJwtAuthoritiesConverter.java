package com.company.inventory.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Extrae permisos granulares desde roles de realm (compuestos) y {@code resource_access.inventory-api.roles}.
 */
public class KeycloakJwtAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(@NonNull Jwt jwt) {
        Set<String> authorities = new LinkedHashSet<>();

        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            List<String> realmRoles = new ArrayList<>();
            extractRoles(realmAccess.get("roles"), realmRoles);
            authorities.addAll(RealmRolePermissions.permissionsForRealmRoles(realmRoles));
        }

        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            Object clientAccess = resourceAccess.get(Permission.KEYCLOAK_CLIENT);
            if (clientAccess instanceof Map<?, ?> clientMap) {
                extractRoles(clientMap.get("roles"), authorities);
            }
        }

        addScopeAuthorities(jwt.getClaim("scope"), authorities);

        return authorities.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toUnmodifiableList());
    }

    @SuppressWarnings("unchecked")
    private void extractRoles(Object rolesObject, Collection<String> target) {
        if (rolesObject instanceof Collection<?> roles) {
            for (Object role : roles) {
                if (role instanceof String roleName) {
                    target.add(roleName);
                }
            }
        }
    }

    private void addScopeAuthorities(Object scopeClaim, Set<String> authorities) {
        Set<String> knownScopes = extractScopes(scopeClaim);
        if (knownScopes.isEmpty()) {
            return;
        }

        boolean hasRoleBasedPermissions = authorities.stream().anyMatch(Permission::isKnown);
        for (String scope : knownScopes) {
            if (!Permission.isKnown(scope)) {
                continue;
            }
            if (hasRoleBasedPermissions && !authorities.contains(scope)) {
                continue;
            }
            authorities.add(scope);
            authorities.add("SCOPE_" + scope);
        }
    }

    private Set<String> extractScopes(Object scopeClaim) {
        Set<String> scopes = new LinkedHashSet<>();
        if (scopeClaim instanceof String scopeString) {
            for (String scope : scopeString.split("\\s+")) {
                addScope(scope, scopes);
            }
        } else if (scopeClaim instanceof Collection<?> scopeCollection) {
            for (Object scope : scopeCollection) {
                if (scope instanceof String scopeName) {
                    addScope(scopeName, scopes);
                }
            }
        }
        return scopes;
    }

    private void addScope(String scope, Set<String> scopes) {
        if (scope != null && !scope.isBlank()) {
            scopes.add(scope.trim());
        }
    }
}
