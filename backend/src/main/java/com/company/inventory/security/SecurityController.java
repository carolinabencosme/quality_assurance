package com.company.inventory.security;

import com.company.inventory.security.dto.PermissionsMatrixResponse;
import com.company.inventory.security.dto.SecurityMeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/security")
@Tag(name = "Security", description = "User profile and permission matrix")
@SecurityRequirement(name = "bearerAuth")
public class SecurityController {

    private final SecurityMatrixService securityMatrixService;

    public SecurityController(SecurityMatrixService securityMatrixService) {
        this.securityMatrixService = securityMatrixService;
    }

    @GetMapping("/permissions-matrix")
    @PreAuthorize("hasAuthority('" + Permission.USER_MANAGE + "')")
    @Operation(summary = "Permission matrix", description = "Read-only role to permission matrix aligned with Keycloak.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Permission matrix"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "403", description = "Missing user:manage permission")
    })
    public PermissionsMatrixResponse permissionsMatrix() {
        return securityMatrixService.getPermissionsMatrix();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Current security context", description = "JWT subject, username and effective authorities.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Current authenticated principal"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT")
    })
    public SecurityMeResponse me(Authentication authentication) {
        String subject = authentication.getName();
        String username = subject;
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            subject = jwt.getSubject();
            username = jwt.getClaimAsString("preferred_username");
            if (username == null || username.isBlank()) {
                username = subject;
            }
        }
        Set<String> authorities = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toCollection(TreeSet::new));
        return new SecurityMeResponse(subject, username, authorities);
    }
}
