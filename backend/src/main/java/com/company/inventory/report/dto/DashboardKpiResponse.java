package com.company.inventory.report.dto;

import java.math.BigDecimal;

public record DashboardKpiResponse(
        long totalActiveProducts,
        long totalInactiveProducts,
        long criticalProductsCount,
        long totalStockUnits,
        BigDecimal inventoryValue,
        long movementsLast7Days,
        long categoriesCount
) {
}
