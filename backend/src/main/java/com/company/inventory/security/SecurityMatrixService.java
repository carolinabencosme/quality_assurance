package com.company.inventory.security;

import com.company.inventory.security.dto.PermissionDescriptionResponse;
import com.company.inventory.security.dto.PermissionsMatrixResponse;
import com.company.inventory.security.dto.RolePermissionsResponse;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

@Service
public class SecurityMatrixService {

    private static final Map<String, String> PERMISSION_DESCRIPTIONS = new LinkedHashMap<>();

    static {
        PERMISSION_DESCRIPTIONS.put(Permission.PRODUCT_VIEW, "Consultar productos, filtros y detalle.");
        PERMISSION_DESCRIPTIONS.put(Permission.PRODUCT_MANAGE, "Crear, editar e inactivar productos.");
        PERMISSION_DESCRIPTIONS.put(Permission.STOCK_VIEW, "Consultar existencias e historial de movimientos.");
        PERMISSION_DESCRIPTIONS.put(Permission.STOCK_MANAGE, "Registrar entradas, salidas y ajustes de stock.");
        PERMISSION_DESCRIPTIONS.put(Permission.REPORT_VIEW, "Consultar dashboard, KPIs y reportes operativos.");
        PERMISSION_DESCRIPTIONS.put(Permission.AUDIT_VIEW, "Consultar eventos de auditoria Envers.");
        PERMISSION_DESCRIPTIONS.put(Permission.USER_MANAGE, "Consultar la matriz empresarial de roles y permisos.");
    }

    public PermissionsMatrixResponse getPermissionsMatrix() {
        List<PermissionDescriptionResponse> descriptions = PERMISSION_DESCRIPTIONS.entrySet()
                .stream()
                .map(entry -> new PermissionDescriptionResponse(entry.getKey(), entry.getValue()))
                .toList();

        List<RolePermissionsResponse> roles = RealmRolePermissions.all()
                .entrySet()
                .stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new RolePermissionsResponse(
                        entry.getKey(),
                        new TreeSet<>(entry.getValue())))
                .sorted(Comparator.comparing(RolePermissionsResponse::role))
                .toList();

        return new PermissionsMatrixResponse(
                "keycloak/realm-export.json and backend RealmRolePermissions",
                descriptions,
                roles
        );
    }
}
