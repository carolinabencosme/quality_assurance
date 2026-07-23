package com.company.inventory.security.dto;

import java.util.Set;

public record RolePermissionsResponse(
        String role,
        Set<String> permissions
) {
}
