package com.company.inventory.product.dto;

import com.company.inventory.product.entity.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 50) String sku,
        @Size(max = 5000) String description,
        @NotNull Long categoryId,
        @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal price,
        @NotNull @PositiveOrZero Integer quantity,
        @NotNull @Min(0) Integer minStock,
        ProductStatus status
) {
    public ProductRequest {
        if (status == null) {
            status = ProductStatus.ACTIVE;
        }
    }
}
