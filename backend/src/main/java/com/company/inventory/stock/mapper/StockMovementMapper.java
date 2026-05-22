package com.company.inventory.stock.mapper;

import com.company.inventory.stock.dto.StockMovementResponse;
import com.company.inventory.stock.entity.StockMovement;

public final class StockMovementMapper {

    private StockMovementMapper() {
    }

    public static StockMovementResponse toResponse(StockMovement movement) {
        return new StockMovementResponse(
                movement.getId(),
                movement.getProduct().getId(),
                movement.getProduct().getSku(),
                movement.getProduct().getName(),
                movement.getUserId(),
                movement.getType(),
                movement.getPreviousQty(),
                movement.getNewQty(),
                movement.getDelta(),
                movement.getObservations(),
                movement.getCorrelationId(),
                movement.getCreatedAt()
        );
    }
}
