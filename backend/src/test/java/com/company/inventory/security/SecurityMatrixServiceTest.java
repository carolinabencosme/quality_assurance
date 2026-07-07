package com.company.inventory.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityMatrixServiceTest {

    private final SecurityMatrixService service = new SecurityMatrixService();

    @Test
    void getPermissionsMatrix_returnsAdminUserManagePermission() {
        var matrix = service.getPermissionsMatrix();

        assertThat(matrix.permissionDescriptions())
                .anyMatch(permission -> Permission.USER_MANAGE.equals(permission.permission()));
        assertThat(matrix.roles())
                .anyMatch(role -> "inventory-admin".equals(role.role())
                        && role.permissions().contains(Permission.USER_MANAGE));
    }
}
