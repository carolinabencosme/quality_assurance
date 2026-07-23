package com.company.inventory.report.dto;

public record TopMovedProductSummary(
        Long productId,
        String sku,
        String name,
        Long totalOutQty,
        Long movementCount
) {
}
