package com.company.inventory.report.controller;

import com.company.inventory.product.dto.ProductResponse;
import com.company.inventory.report.dto.DashboardResponse;
import com.company.inventory.report.service.ReportService;
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
@RequestMapping("/api/v1/reports")
@Tag(name = "Reports", description = "Dashboard, KPIs y productos críticos")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('" + Permission.REPORT_VIEW + "')")
    @Operation(summary = "Dashboard operativo", description = "KPIs, productos críticos y movimientos recientes")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "KPIs y resumen operativo"),
            @ApiResponse(responseCode = "401", description = "JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Sin permiso report:view")
    })
    public DashboardResponse dashboard() {
        return reportService.getDashboard();
    }

    @GetMapping("/critical-products")
    @PreAuthorize("hasAuthority('" + Permission.REPORT_VIEW + "')")
    @Operation(summary = "Productos con stock crítico", description = "quantity <= min_stock")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Página de productos críticos"),
            @ApiResponse(responseCode = "401", description = "JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Sin permiso report:view")
    })
    public Page<ProductResponse> criticalProducts(
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return reportService.getCriticalProducts(pageable);
    }
}
