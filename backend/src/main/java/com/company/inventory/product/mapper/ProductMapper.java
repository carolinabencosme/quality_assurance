package com.company.inventory.product.mapper;

import com.company.inventory.product.dto.ProductResponse;
import com.company.inventory.product.entity.Product;

public final class ProductMapper {

    private ProductMapper() {
    }

    public static ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getDescription(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getPrice(),
                product.getQuantity(),
                product.getMinStock(),
                product.isCritical(),
                product.getStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
