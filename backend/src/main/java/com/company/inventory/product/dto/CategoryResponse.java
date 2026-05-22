package com.company.inventory.product.dto;

import com.company.inventory.product.entity.CategoryStatus;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        CategoryStatus status
) {
}
