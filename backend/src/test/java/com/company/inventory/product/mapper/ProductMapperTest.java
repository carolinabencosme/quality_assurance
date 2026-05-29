package com.company.inventory.product.mapper;

import com.company.inventory.product.dto.ProductResponse;
import com.company.inventory.product.entity.Category;
import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ProductMapperTest {

    @Test
    void toResponse_mapsAllFieldsIncludingCategoryAndCritical() {
        Category category = new Category();
        category.setId(2L);
        category.setName("Office");

        Product product = new Product();
        product.setId(99L);
        product.setName("Notebook");
        product.setSku("SKU-NOTE-003");
        product.setDescription("Ruled");
        product.setCategory(category);
        product.setPrice(new BigDecimal("3.50"));
        product.setQuantity(5);
        product.setMinStock(10);
        product.setStatus(ProductStatus.ACTIVE);

        ProductResponse response = ProductMapper.toResponse(product);

        assertThat(response.id()).isEqualTo(99L);
        assertThat(response.categoryId()).isEqualTo(2L);
        assertThat(response.categoryName()).isEqualTo("Office");
        assertThat(response.critical()).isTrue();
        assertThat(response.sku()).isEqualTo("SKU-NOTE-003");
    }
}
