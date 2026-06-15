package com.company.inventory.stock.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "inventory.security.enabled=false")
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@Transactional
class StockGetApiIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("inventory_test")
            .withUsername("inventory_user")
            .withPassword("inventory_password");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getStock_returnsPaginatedDtoWithoutJpaEntities() throws Exception {
        mockMvc.perform(get("/api/v1/stock").param("size", "2").param("page", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.content[0].productId").exists())
                .andExpect(jsonPath("$.content[0].sku").exists())
                .andExpect(jsonPath("$.content[0].critical").exists())
                .andExpect(jsonPath("$.content[0].category").doesNotExist())
                .andExpect(jsonPath("$.content[0].price").doesNotExist());
    }

    @Test
    void getStock_criticalFilter_returnsOnlyCriticalProducts() throws Exception {
        mockMvc.perform(get("/api/v1/stock").param("critical", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.content[0].critical").value(true));
    }

    @Test
    void getStock_searchFilter_returnsMatchingProduct() throws Exception {
        mockMvc.perform(get("/api/v1/stock").param("search", "MOUSE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sku").value("SKU-MOUSE-001"))
                .andExpect(jsonPath("$.content[0].quantity").value(50));
    }

    @Test
    void getMovements_returnsPaginatedDtoWithFlattenedProduct() throws Exception {
        mockMvc.perform(get("/api/v1/stock/movements").param("size", "2").param("page", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(4)))
                .andExpect(jsonPath("$.content[0].productId").exists())
                .andExpect(jsonPath("$.content[0].productSku").exists())
                .andExpect(jsonPath("$.content[0].productName").exists())
                .andExpect(jsonPath("$.content[0].type").exists())
                .andExpect(jsonPath("$.content[0].product").doesNotExist());
    }

    @Test
    void getMovements_filteredByProductId() throws Exception {
        mockMvc.perform(get("/api/v1/stock/movements").param("productId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].productId").value(1))
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(1)));
    }

    @Test
    void getMovements_filteredByType() throws Exception {
        mockMvc.perform(get("/api/v1/stock/movements").param("type", "IN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].type").value("IN"));
    }
}
