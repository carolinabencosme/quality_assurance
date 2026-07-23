package com.company.inventory.user.dto;

import java.util.Set;

public record KeycloakUserResponse(
        String id,
        String username,
        String email,
        String firstName,
        String lastName,
        boolean enabled,
        Set<String> roles
) {
}
