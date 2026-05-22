package com.company.inventory.stock.dto;

import com.company.inventory.product.entity.ProductStatus;

public record StockLevelResponse(
        Long productId,
        String sku,
        String name,
        Integer quantity,
        Integer minStock,
        boolean critical,
        ProductStatus status
) {
}
