package com.company.inventory.security;

import java.util.Set;

/**
 * Permisos granulares del Plan v3.0 — validados con {@code hasAuthority} en endpoints.
 */
public final class Permission {

    public static final String PRODUCT_VIEW = "product:view";
    public static final String PRODUCT_MANAGE = "product:manage";
    public static final String STOCK_VIEW = "stock:view";
    public static final String STOCK_MANAGE = "stock:manage";
    public static final String REPORT_VIEW = "report:view";
    public static final String AUDIT_VIEW = "audit:view";
    public static final String USER_MANAGE = "user:manage";

    public static final String KEYCLOAK_CLIENT = "inventory-api";

    private static final Set<String> KNOWN = Set.of(
            PRODUCT_VIEW,
            PRODUCT_MANAGE,
            STOCK_VIEW,
            STOCK_MANAGE,
            REPORT_VIEW,
            AUDIT_VIEW,
            USER_MANAGE
    );

    private Permission() {
    }

    public static boolean isKnown(String permission) {
        return KNOWN.contains(permission);
    }

    public static Set<String> all() {
        return KNOWN;
    }
}
