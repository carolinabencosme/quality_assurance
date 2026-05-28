package com.company.inventory.report.dto;

import com.company.inventory.stock.entity.StockMovementType;

import java.time.Instant;

public record RecentMovementSummary(
        Long movementId,
        Long productId,
        String productSku,
        String productName,
        StockMovementType type,
        Integer delta,
        Integer newQty,
        Instant createdAt
) {
}
