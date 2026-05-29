package com.company.inventory.product.repository;

import com.company.inventory.product.entity.CategoryStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = "inventory.security.enabled=false")
@Testcontainers(disabledWithoutDocker = true)
class CategoryRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("inventory_test")
            .withUsername("inventory_user")
            .withPassword("inventory_password");

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void findByNameIgnoreCase_findsSeededCategory() {
        assertThat(categoryRepository.findByNameIgnoreCase("electronics")).isPresent();
    }

    @Test
    void findAllByStatusOrderByNameAsc_returnsActiveCategories() {
        var active = categoryRepository.findAllByStatusOrderByNameAsc(CategoryStatus.ACTIVE);
        assertThat(active).hasSizeGreaterThanOrEqualTo(3);
        assertThat(active.get(0).getName()).isNotBlank();
        assertThat(active).allMatch(c -> c.getStatus() == CategoryStatus.ACTIVE);
    }
}
