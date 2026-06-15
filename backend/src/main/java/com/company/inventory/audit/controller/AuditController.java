package com.company.inventory.audit.controller;

import com.company.inventory.audit.dto.AuditEventResponse;
import com.company.inventory.audit.service.AuditService;
import com.company.inventory.security.Permission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit")
@Tag(name = "Audit", description = "Historial de cambios con Hibernate Envers")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('" + Permission.AUDIT_VIEW + "')")
    @Operation(summary = "Consultar auditoría", description = "Revisiones de productos registradas por Hibernate Envers")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Página de eventos de auditoría"),
            @ApiResponse(responseCode = "401", description = "JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Sin permiso audit:view")
    })
    public Page<AuditEventResponse> findAll(
            @PageableDefault(size = 20, sort = "revisionId", direction = Sort.Direction.DESC) Pageable pageable) {
        return auditService.findAuditEvents(pageable);
    }
}
