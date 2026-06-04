package com.company.inventory.stock.mapper;

import com.company.inventory.product.entity.Product;
import com.company.inventory.stock.dto.StockLevelResponse;

public final class StockLevelMapper {

    private StockLevelMapper() {
    }

    public static StockLevelResponse toResponse(Product product) {
        return new StockLevelResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getQuantity(),
                product.getMinStock(),
                product.isCritical(),
                product.getStatus()
        );
    }
}
