package com.company.inventory.stock.dto;

import com.company.inventory.stock.entity.StockMovementType;

import java.time.Instant;

public record StockMovementResponse(
        Long id,
        Long productId,
        String productSku,
        String productName,
        String userId,
        StockMovementType type,
        Integer previousQty,
        Integer newQty,
        Integer delta,
        String observations,
        String correlationId,
        Instant createdAt
) {
}
