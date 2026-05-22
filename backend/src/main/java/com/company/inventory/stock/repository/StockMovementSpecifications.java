package com.company.inventory.stock.repository;

import com.company.inventory.stock.entity.StockMovement;
import com.company.inventory.stock.entity.StockMovementType;
import org.springframework.data.jpa.domain.Specification;

public final class StockMovementSpecifications {

    private StockMovementSpecifications() {
    }

    public static Specification<StockMovement> withProductId(Long productId) {
        if (productId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("product").get("id"), productId);
    }

    public static Specification<StockMovement> withType(StockMovementType type) {
        if (type == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("type"), type);
    }
}
