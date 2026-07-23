package com.company.inventory.user;

import com.company.inventory.security.Permission;
import com.company.inventory.user.dto.EnabledUpdateRequest;
import com.company.inventory.user.dto.KeycloakUserResponse;
import com.company.inventory.user.dto.UserRolesUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasAuthority('" + Permission.USER_MANAGE + "') or hasAuthority('SCOPE_" + Permission.USER_MANAGE + "')")
@Tag(name = "Users", description = "Keycloak user and role management")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List Keycloak users")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Users returned"),
            @ApiResponse(responseCode = "403", description = "Missing user:manage"),
            @ApiResponse(responseCode = "503", description = "Keycloak admin client unavailable")
    })
    public List<KeycloakUserResponse> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer first,
            @RequestParam(required = false) Integer max) {
        return userService.listUsers(search, first, max);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Keycloak user detail")
    public KeycloakUserResponse getUser(@PathVariable String id) {
        return userService.getUser(id);
    }

    @PutMapping("/{id}/enabled")
    @Operation(summary = "Enable or disable a Keycloak user")
    public KeycloakUserResponse setEnabled(@PathVariable String id,
                                           @Valid @RequestBody EnabledUpdateRequest request) {
        return userService.setEnabled(id, request.enabled());
    }

    @PutMapping("/{id}/roles")
    @Operation(summary = "Replace managed realm roles for a Keycloak user")
    public KeycloakUserResponse setRoles(@PathVariable String id,
                                         @Valid @RequestBody UserRolesUpdateRequest request) {
        return userService.setRealmRoles(id, request.roles());
    }
}
