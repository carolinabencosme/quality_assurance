package com.company.inventory.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Extrae permisos granulares desde {@code resource_access.inventory-backend.roles} del JWT Keycloak.
 */
public class KeycloakJwtAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(@NonNull Jwt jwt) {
        List<String> authorities = new ArrayList<>();

        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            extractRoles(realmAccess.get("roles"), authorities);
        }

        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            Object clientAccess = resourceAccess.get(Permission.KEYCLOAK_CLIENT);
            if (clientAccess instanceof Map<?, ?> clientMap) {
                extractRoles(clientMap.get("roles"), authorities);
            }
        }

        return authorities.stream()
                .distinct()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toUnmodifiableList());
    }

    @SuppressWarnings("unchecked")
    private void extractRoles(Object rolesObject, List<String> target) {
        if (rolesObject instanceof Collection<?> roles) {
            for (Object role : roles) {
                if (role instanceof String roleName) {
                    target.add(roleName);
                }
            }
        }
    }
}
