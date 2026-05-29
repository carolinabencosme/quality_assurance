package com.company.inventory.product.repository;

import com.company.inventory.product.entity.Category;
import com.company.inventory.product.entity.CategoryStatus;
import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = "inventory.security.enabled=false")
@Testcontainers(disabledWithoutDocker = true)
@Transactional
class ProductRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("inventory_test")
            .withUsername("inventory_user")
            .withPassword("inventory_password");

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void findBySkuIgnoreCase_findsSeededProduct() {
        assertThat(productRepository.findBySkuIgnoreCase("sku-mouse-001")).isPresent();
    }

    @Test
    void existsBySkuIgnoreCase_detectsDuplicates() {
        assertThat(productRepository.existsBySkuIgnoreCase("SKU-MOUSE-001")).isTrue();
        assertThat(productRepository.existsBySkuIgnoreCase("NEW-SKU-QA20")).isFalse();
    }

    @Test
    void findById_loadsCategoryViaEntityGraph() {
        Product product = productRepository.findById(1L).orElseThrow();
        assertThat(product.getCategory()).isNotNull();
        assertThat(product.getCategory().getName()).isEqualTo("Electronics");
    }

    @Test
    void saveProduct_withUniqueSkuAndCategory() {
        Category category = categoryRepository.findById(1L).orElseThrow();
        Product product = new Product();
        product.setName("QA-20 Test Product");
        product.setSku("QA20-UNIQUE-001");
        product.setCategory(category);
        product.setPrice(new BigDecimal("9.99"));
        product.setQuantity(1);
        product.setMinStock(0);
        product.setStatus(ProductStatus.ACTIVE);

        Product saved = productRepository.save(product);

        assertThat(saved.getId()).isNotNull();
        assertThat(productRepository.existsBySkuIgnoreCase("qa20-unique-001")).isTrue();
    }
}
