package com.company.inventory.stock.mapper;

import com.company.inventory.product.entity.Category;
import com.company.inventory.product.entity.Product;
import com.company.inventory.stock.dto.StockMovementResponse;
import com.company.inventory.stock.entity.StockMovement;
import com.company.inventory.stock.entity.StockMovementType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StockMovementMapperTest {

    @Test
    void toResponse_mapsAllFields() {
        Category category = new Category();
        category.setId(1L);

        Product product = new Product();
        product.setId(10L);
        product.setSku("SKU-TEST");
        product.setName("Test Product");
        product.setCategory(category);
        product.setPrice(BigDecimal.TEN);

        Instant createdAt = Instant.parse("2026-01-15T10:00:00Z");
        StockMovement movement = mock(StockMovement.class);
        when(movement.getId()).thenReturn(99L);
        when(movement.getProduct()).thenReturn(product);
        when(movement.getUserId()).thenReturn("user-1");
        when(movement.getType()).thenReturn(StockMovementType.IN);
        when(movement.getPreviousQty()).thenReturn(5);
        when(movement.getNewQty()).thenReturn(15);
        when(movement.getDelta()).thenReturn(10);
        when(movement.getObservations()).thenReturn("restock");
        when(movement.getCorrelationId()).thenReturn("corr-123");
        when(movement.getCreatedAt()).thenReturn(createdAt);

        StockMovementResponse response = StockMovementMapper.toResponse(movement);

        assertThat(response.id()).isEqualTo(99L);
        assertThat(response.productId()).isEqualTo(10L);
        assertThat(response.productSku()).isEqualTo("SKU-TEST");
        assertThat(response.productName()).isEqualTo("Test Product");
        assertThat(response.userId()).isEqualTo("user-1");
        assertThat(response.type()).isEqualTo(StockMovementType.IN);
        assertThat(response.previousQty()).isEqualTo(5);
        assertThat(response.newQty()).isEqualTo(15);
        assertThat(response.delta()).isEqualTo(10);
        assertThat(response.observations()).isEqualTo("restock");
        assertThat(response.correlationId()).isEqualTo("corr-123");
        assertThat(response.createdAt()).isEqualTo(createdAt);
    }
}
