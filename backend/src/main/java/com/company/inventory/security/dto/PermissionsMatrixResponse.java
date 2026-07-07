package com.company.inventory.security.dto;

import java.util.List;

public record PermissionsMatrixResponse(
        String source,
        List<PermissionDescriptionResponse> permissionDescriptions,
        List<RolePermissionsResponse> roles
) {
}
