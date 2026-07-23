package com.company.inventory.user;

import com.company.inventory.common.exception.ApiException;
import com.company.inventory.user.KeycloakAdminClientConfig.KeycloakAdminClientFactory;
import com.company.inventory.user.dto.KeycloakUserResponse;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RoleMappingResource;
import org.keycloak.admin.client.resource.RoleScopeResource;
import org.keycloak.admin.client.resource.RolesResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import java.util.List;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceTest {

    @Test
    void propertiesConfiguredOnlyWhenAllValuesExist() {
        KeycloakAdminProperties properties = new KeycloakAdminProperties();
        assertThat(properties.isConfigured()).isFalse();

        properties.setServerUrl("http://keycloak:8080");
        properties.setRealm("inventory-realm");
        properties.setClientId("inventory-admin-api");
        properties.setClientSecret("secret");

        assertThat(properties.isConfigured()).isTrue();
        assertThat(properties.getServerUrl()).isEqualTo("http://keycloak:8080");
        assertThat(properties.getRealm()).isEqualTo("inventory-realm");
        assertThat(properties.getClientId()).isEqualTo("inventory-admin-api");
        assertThat(properties.getClientSecret()).isEqualTo("secret");
    }

    @Test
    void listUsers_withoutConfiguredClientReturns503() {
        KeycloakAdminProperties properties = new KeycloakAdminProperties();
        properties.setRealm("inventory-realm");
        UserService service = new UserService(new KeycloakAdminClientFactory(properties));

        assertThatThrownBy(() -> service.listUsers(null, null, null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("not configured");
    }

    @Test
    void setRealmRoles_rejectsUnsupportedRole() {
        UserService service = new UserService(mock(KeycloakAdminClientFactory.class));

        assertThatThrownBy(() -> service.setRealmRoles("user-1", Set.of("realm-admin")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Unsupported realm role");
    }

    @Test
    void setRealmRoles_rejectsNullRoleWithoutInternalError() {
        UserService service = new UserService(mock(KeycloakAdminClientFactory.class));
        Set<String> roles = new HashSet<>();
        roles.add(null);

        assertThatThrownBy(() -> service.setRealmRoles("user-1", roles))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Unsupported realm role");
    }

    @Test
    void factoryExposesConfiguration() {
        KeycloakAdminProperties properties = configuredProperties();
        KeycloakAdminClientFactory factory = new KeycloakAdminClientConfig().keycloakAdminClientFactory(properties);

        assertThat(factory.isConfigured()).isTrue();
        assertThat(factory.realm()).isEqualTo("inventory-realm");
    }

    @Test
    void listUsers_mapsManagedRoles() {
        KeycloakMocks mocks = keycloakMocks();
        UserRepresentation admin = user("user-1", "admin", true);
        when(mocks.users.search(null, 0, 50)).thenReturn(List.of(admin));
        when(mocks.roleScope.listEffective()).thenReturn(List.of(role("inventory-admin"), role("offline_access")));

        List<KeycloakUserResponse> users = new UserService(mocks.factory).listUsers(null, null, null);

        assertThat(users).hasSize(1);
        assertThat(users.getFirst().username()).isEqualTo("admin");
        assertThat(users.getFirst().roles()).containsExactly("inventory-admin");
    }

    @Test
    void setEnabled_updatesKeycloakUser() {
        KeycloakMocks mocks = keycloakMocks();
        UserRepresentation admin = user("user-1", "admin", true);
        when(mocks.userResource.toRepresentation()).thenReturn(admin);
        when(mocks.roleScope.listEffective()).thenReturn(List.of(role("inventory-admin")));

        KeycloakUserResponse updated = new UserService(mocks.factory).setEnabled("user-1", false);

        assertThat(updated.enabled()).isFalse();
        verify(mocks.userResource).update(admin);
    }

    @Test
    void setRealmRoles_replacesManagedRoles() {
        KeycloakMocks mocks = keycloakMocks();
        UserRepresentation admin = user("user-1", "admin", true);
        when(mocks.userResource.toRepresentation()).thenReturn(admin);
        when(mocks.roleScope.listAll()).thenReturn(List.of(role("inventory-viewer"), role("offline_access")));
        when(mocks.roleScope.listEffective()).thenReturn(List.of(role("warehouse-manager")));
        when(mocks.roles.get("warehouse-manager")).thenReturn(mock(org.keycloak.admin.client.resource.RoleResource.class));
        when(mocks.roles.get("warehouse-manager").toRepresentation()).thenReturn(role("warehouse-manager"));

        KeycloakUserResponse updated = new UserService(mocks.factory)
                .setRealmRoles("user-1", Set.of("warehouse-manager"));

        assertThat(updated.roles()).containsExactly("warehouse-manager");
        verify(mocks.roleScope).remove(anyList());
        verify(mocks.roleScope).add(anyList());
    }

    private KeycloakAdminProperties configuredProperties() {
        KeycloakAdminProperties properties = new KeycloakAdminProperties();
        properties.setServerUrl("http://keycloak:8080");
        properties.setRealm("inventory-realm");
        properties.setClientId("inventory-admin-api");
        properties.setClientSecret("secret");
        return properties;
    }

    private KeycloakMocks keycloakMocks() {
        KeycloakMocks mocks = new KeycloakMocks();
        when(mocks.factory.isConfigured()).thenReturn(true);
        when(mocks.factory.realm()).thenReturn("inventory-realm");
        when(mocks.factory.create()).thenReturn(mocks.keycloak);
        when(mocks.keycloak.realm("inventory-realm")).thenReturn(mocks.realm);
        when(mocks.realm.users()).thenReturn(mocks.users);
        when(mocks.realm.roles()).thenReturn(mocks.roles);
        when(mocks.users.get("user-1")).thenReturn(mocks.userResource);
        when(mocks.userResource.roles()).thenReturn(mocks.roleMapping);
        when(mocks.roleMapping.realmLevel()).thenReturn(mocks.roleScope);
        return mocks;
    }

    private UserRepresentation user(String id, String username, boolean enabled) {
        UserRepresentation user = new UserRepresentation();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(username + "@inventory.local");
        user.setFirstName("First");
        user.setLastName("Last");
        user.setEnabled(enabled);
        return user;
    }

    private RoleRepresentation role(String name) {
        RoleRepresentation role = new RoleRepresentation();
        role.setName(name);
        return role;
    }

    private static class KeycloakMocks {
        KeycloakAdminClientFactory factory = mock(KeycloakAdminClientFactory.class);
        Keycloak keycloak = mock(Keycloak.class);
        RealmResource realm = mock(RealmResource.class);
        UsersResource users = mock(UsersResource.class);
        UserResource userResource = mock(UserResource.class);
        RoleMappingResource roleMapping = mock(RoleMappingResource.class);
        RoleScopeResource roleScope = mock(RoleScopeResource.class);
        RolesResource roles = mock(RolesResource.class);
    }
}
