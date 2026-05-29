package com.company.inventory.stock.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "inventory.security.enabled=false")
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class StockApiIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("inventory_test")
            .withUsername("inventory_user")
            .withPassword("inventory_password");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listStockLevels_returnsSeededProducts() throws Exception {
        mockMvc.perform(get("/api/v1/stock").param("search", "MOUSE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sku").value("SKU-MOUSE-001"))
                .andExpect(jsonPath("$.content[0].quantity").value(50));
    }

    @Test
    void listStockLevels_criticalFilter_returnsOnlyCriticalProducts() throws Exception {
        mockMvc.perform(get("/api/v1/stock").param("critical", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.content[0].critical").value(true));

        mockMvc.perform(get("/api/v1/stock").param("critical", "true").param("search", "HUB"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sku").value("SKU-HUB-002"));
    }

    @Test
    void registerIn_increasesQuantityAndCreatesMovement() throws Exception {
        String body = """
                {
                  "productId": 1,
                  "type": "IN",
                  "quantity": 10,
                  "observations": "Integration test IN",
                  "userId": "test-user"
                }
                """;

        mockMvc.perform(post("/api/v1/stock/movements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("IN"))
                .andExpect(jsonPath("$.previousQty").value(50))
                .andExpect(jsonPath("$.newQty").value(60))
                .andExpect(jsonPath("$.delta").value(10))
                .andExpect(jsonPath("$.productSku").value("SKU-MOUSE-001"));

        mockMvc.perform(get("/api/v1/stock").param("search", "SKU-MOUSE-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].quantity").value(60));
    }

    @Test
    void registerOut_decreasesQuantityAndCreatesMovement() throws Exception {
        String body = """
                {
                  "productId": 3,
                  "type": "OUT",
                  "quantity": 20,
                  "observations": "Integration test OUT"
                }
                """;

        mockMvc.perform(post("/api/v1/stock/movements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("OUT"))
                .andExpect(jsonPath("$.previousQty").value(120))
                .andExpect(jsonPath("$.newQty").value(100))
                .andExpect(jsonPath("$.delta").value(-20));
    }

    @Test
    void registerOut_insufficientStock_returns409() throws Exception {
        String body = """
                {
                  "productId": 2,
                  "type": "OUT",
                  "quantity": 100,
                  "observations": "Should fail"
                }
                """;

        mockMvc.perform(post("/api/v1/stock/movements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Insufficient stock")));
    }

    @Test
    void registerAdjustment_setsNewQuantityAndCreatesMovement() throws Exception {
        String body = """
                {
                  "productId": 4,
                  "type": "ADJUSTMENT",
                  "newQuantity": 12,
                  "observations": "Physical count adjustment"
                }
                """;

        mockMvc.perform(post("/api/v1/stock/movements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("ADJUSTMENT"))
                .andExpect(jsonPath("$.previousQty").value(5))
                .andExpect(jsonPath("$.newQty").value(12))
                .andExpect(jsonPath("$.delta").value(7));
    }

    @Test
    void listMovements_filteredByProductId() throws Exception {
        mockMvc.perform(get("/api/v1/stock/movements").param("productId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.content[0].productId").value(1));
    }
}
