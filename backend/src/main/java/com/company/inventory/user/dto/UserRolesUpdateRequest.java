package com.company.inventory.user.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

public record UserRolesUpdateRequest(
        @NotEmpty Set<String> roles
) {
}
