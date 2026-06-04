package com.company.inventory.stock.mapper;

import com.company.inventory.product.entity.Category;
import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.stock.dto.StockLevelResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class StockLevelMapperTest {

    @Test
    void toResponse_mapsProductToDtoWithoutNestedEntities() {
        Category category = new Category();
        category.setId(1L);
        category.setName("Electronics");

        Product product = new Product();
        product.setId(42L);
        product.setSku("SKU-MAP");
        product.setName("Mapped Product");
        product.setCategory(category);
        product.setPrice(BigDecimal.valueOf(19.99));
        product.setQuantity(8);
        product.setMinStock(10);
        product.setStatus(ProductStatus.ACTIVE);

        StockLevelResponse response = StockLevelMapper.toResponse(product);

        assertThat(response.productId()).isEqualTo(42L);
        assertThat(response.sku()).isEqualTo("SKU-MAP");
        assertThat(response.name()).isEqualTo("Mapped Product");
        assertThat(response.quantity()).isEqualTo(8);
        assertThat(response.minStock()).isEqualTo(10);
        assertThat(response.critical()).isTrue();
        assertThat(response.status()).isEqualTo(ProductStatus.ACTIVE);
    }
}
