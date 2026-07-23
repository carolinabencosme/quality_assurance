package com.company.inventory.product.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = "inventory.security.enabled=false")
@Testcontainers(disabledWithoutDocker = true)
@Transactional
class ProductRepositoryConstraintTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("inventory_constraints_test")
            .withUsername("inventory_user")
            .withPassword("inventory_password");

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void insertProduct_withDuplicateSkuFails() {
        assertThatThrownBy(() -> jdbcTemplate.update("""
                insert into products (name, sku, category_id, price, quantity, min_stock, status)
                values ('Duplicate Mouse', 'SKU-MOUSE-001', 1, 10.00, 1, 0, 'ACTIVE')
                """))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void insertStockMovement_withMissingProductFails() {
        assertThatThrownBy(() -> jdbcTemplate.update("""
                insert into stock_movements
                (product_id, user_id, type, previous_qty, new_qty, delta, observations, correlation_id)
                values (999999, 'constraint-test', 'IN', 0, 1, 1, 'missing product', 'constraint-001')
                """))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void insertUserProfile_withDuplicateKeycloakUserIdFails() {
        jdbcTemplate.update("""
                insert into users_profile (keycloak_user_id, full_name, email, status)
                values ('kc-user-1', 'User One', 'user.one@example.test', 'ACTIVE')
                """);

        assertThatThrownBy(() -> jdbcTemplate.update("""
                insert into users_profile (keycloak_user_id, full_name, email, status)
                values ('kc-user-1', 'User Copy', 'user.copy@example.test', 'ACTIVE')
                """))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
