package com.company.inventory.security;

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

    public static final String KEYCLOAK_CLIENT = "inventory-backend";

    private Permission() {
    }
}
