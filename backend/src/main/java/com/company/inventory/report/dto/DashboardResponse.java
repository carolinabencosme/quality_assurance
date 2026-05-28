package com.company.inventory.report.dto;

import com.company.inventory.product.dto.ProductResponse;

import java.util.List;

public record DashboardResponse(
        DashboardKpiResponse kpis,
        List<ProductResponse> criticalProducts,
        List<RecentMovementSummary> recentMovements
) {
}
