package com.company.inventory.user;

import com.company.inventory.common.exception.ApiException;
import com.company.inventory.user.KeycloakAdminClientConfig.KeycloakAdminClientFactory;
import com.company.inventory.user.dto.KeycloakUserResponse;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RoleMappingResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

@Service
public class UserService {

    public static final Set<String> MANAGED_REALM_ROLES = Set.of(
            "inventory-admin",
            "warehouse-manager",
            "inventory-clerk",
            "inventory-viewer"
    );

    private final KeycloakAdminClientFactory clientFactory;

    public UserService(KeycloakAdminClientFactory clientFactory) {
        this.clientFactory = clientFactory;
    }

    public List<KeycloakUserResponse> listUsers(String search, Integer first, Integer max) {
        return withRealm(realm -> realm.users()
                .search(search, normalizeFirst(first), normalizeMax(max))
                .stream()
                .map(user -> toResponse(realm, user))
                .sorted(Comparator.comparing(KeycloakUserResponse::username,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList());
    }

    public KeycloakUserResponse getUser(String id) {
        return withRealm(realm -> toResponse(realm, userResource(realm, id).toRepresentation()));
    }

    public KeycloakUserResponse setEnabled(String id, boolean enabled) {
        return withRealm(realm -> {
            UserResource userResource = userResource(realm, id);
            UserRepresentation user = userResource.toRepresentation();
            user.setEnabled(enabled);
            userResource.update(user);
            return toResponse(realm, userResource.toRepresentation());
        });
    }

    public KeycloakUserResponse setRealmRoles(String id, Set<String> roles) {
        validateManagedRoles(roles);
        return withRealm(realm -> {
            UserResource userResource = userResource(realm, id);
            RoleMappingResource mappings = userResource.roles();

            List<RoleRepresentation> currentManagedRoles = mappings.realmLevel().listAll()
                    .stream()
                    .filter(role -> MANAGED_REALM_ROLES.contains(role.getName()))
                    .toList();
            if (!currentManagedRoles.isEmpty()) {
                mappings.realmLevel().remove(currentManagedRoles);
            }

            List<RoleRepresentation> requestedRoles = roles.stream()
                    .sorted()
                    .map(roleName -> realm.roles().get(roleName).toRepresentation())
                    .toList();
            mappings.realmLevel().add(requestedRoles);
            return toResponse(realm, userResource.toRepresentation());
        });
    }

    private <T> T withRealm(RealmCallback<T> callback) {
        if (!clientFactory.isConfigured()) {
            throw ApiException.serviceUnavailable("Keycloak admin client is not configured");
        }
        try (Keycloak keycloak = clientFactory.create()) {
            return callback.apply(keycloak.realm(clientFactory.realm()));
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw ApiException.serviceUnavailable("Keycloak admin API is unavailable");
        }
    }

    private KeycloakUserResponse toResponse(RealmResource realm, UserRepresentation user) {
        return new KeycloakUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                Boolean.TRUE.equals(user.isEnabled()),
                managedRoles(realm, user.getId())
        );
    }

    private Set<String> managedRoles(RealmResource realm, String userId) {
        return realm.users().get(userId).roles().realmLevel().listEffective()
                .stream()
                .map(RoleRepresentation::getName)
                .filter(MANAGED_REALM_ROLES::contains)
                .collect(java.util.stream.Collectors.toCollection(TreeSet::new));
    }

    private UserResource userResource(RealmResource realm, String id) {
        if (id == null || id.isBlank()) {
            throw ApiException.badRequest("User id is required");
        }
        return realm.users().get(id);
    }

    private void validateManagedRoles(Set<String> roles) {
        if (roles == null || roles.isEmpty()) {
            throw ApiException.badRequest("At least one role is required");
        }
        for (String role : roles) {
            if (!MANAGED_REALM_ROLES.contains(role)) {
                throw ApiException.badRequest("Unsupported realm role: " + role);
            }
        }
    }

    private int normalizeFirst(Integer first) {
        return first == null || first < 0 ? 0 : first;
    }

    private int normalizeMax(Integer max) {
        if (max == null) {
            return 50;
        }
        return Math.max(1, Math.min(max, 100));
    }

    @FunctionalInterface
    private interface RealmCallback<T> {
        T apply(RealmResource realm);
    }
}
