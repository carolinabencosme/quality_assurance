package com.company.inventory.security.dto;

import java.util.Set;

public record SecurityMeResponse(
        String subject,
        String username,
        Set<String> authorities
) {
}
