package com.company.inventory.user.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;

import java.util.Set;

public record UserRolesUpdateRequest(
        @NotEmpty Set<@NotBlank String> roles
) {
}
