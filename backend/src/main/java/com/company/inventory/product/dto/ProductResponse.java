package com.company.inventory.product.dto;

import com.company.inventory.product.entity.ProductStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
        Long id,
        String name,
        String sku,
        String description,
        Long categoryId,
        String categoryName,
        BigDecimal price,
        Integer quantity,
        Integer minStock,
        boolean critical,
        ProductStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
