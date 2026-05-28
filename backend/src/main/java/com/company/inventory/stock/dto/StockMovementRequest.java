package com.company.inventory.stock.dto;

import com.company.inventory.stock.entity.StockMovementType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StockMovementRequest(
        @NotNull Long productId,
        @NotNull StockMovementType type,
        @Min(1) Integer quantity,
        @Min(0) Integer newQuantity,
        @Size(max = 500) String observations,
        @Size(max = 100) String userId
) {
}
