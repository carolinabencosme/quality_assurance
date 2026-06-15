package com.company.inventory.security;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * Mapeo realm role → permisos granulares (espejo de composites en keycloak/realm-export.json).
 */
final class RealmRolePermissions {

    private static final Map<String, Set<String>> BY_REALM_ROLE = Map.of(
            "inventory-admin", Set.of(
                    Permission.PRODUCT_VIEW, Permission.PRODUCT_MANAGE,
                    Permission.STOCK_VIEW, Permission.STOCK_MANAGE,
                    Permission.REPORT_VIEW, Permission.AUDIT_VIEW,
                    Permission.USER_MANAGE),
            "warehouse-manager", Set.of(
                    Permission.PRODUCT_VIEW, Permission.PRODUCT_MANAGE,
                    Permission.STOCK_VIEW, Permission.STOCK_MANAGE,
                    Permission.REPORT_VIEW),
            "inventory-clerk", Set.of(
                    Permission.PRODUCT_VIEW,
                    Permission.STOCK_VIEW, Permission.STOCK_MANAGE),
            "inventory-viewer", Set.of(
                    Permission.PRODUCT_VIEW,
                    Permission.STOCK_VIEW,
                    Permission.REPORT_VIEW)
    );

    private RealmRolePermissions() {
    }

    static Set<String> permissionsForRealmRoles(Iterable<String> realmRoles) {
        Set<String> permissions = new LinkedHashSet<>();
        for (String role : realmRoles) {
            permissions.addAll(BY_REALM_ROLE.getOrDefault(role, Set.of()));
        }
        return permissions;
    }

    static Map<String, Set<String>> all() {
        return Collections.unmodifiableMap(BY_REALM_ROLE);
    }
}
