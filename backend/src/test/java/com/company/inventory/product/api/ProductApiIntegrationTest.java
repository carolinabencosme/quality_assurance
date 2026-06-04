package com.company.inventory.product.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "inventory.security.enabled=false")
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@Transactional
class ProductApiIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("inventory_test")
            .withUsername("inventory_user")
            .withPassword("inventory_password");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listProducts_returnsSeededCatalogWithPagination() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("page", "0")
                        .param("size", "2")
                        .param("sort", "name,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(4)));
    }

    @Test
    void listProducts_filterBySearch() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("search", "mouse"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sku").value("SKU-MOUSE-001"));
    }

    @Test
    void listProducts_filterCritical() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("critical", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(greaterThanOrEqualTo(1)));
    }

    @Test
    void getProductById_returnsDetail() throws Exception {
        mockMvc.perform(get("/api/v1/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.sku").value("SKU-MOUSE-001"))
                .andExpect(jsonPath("$.categoryName").exists());
    }

    @Test
    void createProduct_returns201() throws Exception {
        String body = """
                {
                  "name": "QA-21 New Product",
                  "sku": "QA21-CREATE-001",
                  "description": "integration test",
                  "categoryId": 1,
                  "price": 19.99,
                  "quantity": 3,
                  "minStock": 1,
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value("QA21-CREATE-001"))
                .andExpect(jsonPath("$.quantity").value(3));
    }

    @Test
    void createProduct_withDuplicateSku_returns409() throws Exception {
        String body = """
                {
                  "name": "Duplicado Test",
                  "sku": "SKU-MOUSE-001",
                  "categoryId": 1,
                  "price": 10.00,
                  "quantity": 1,
                  "minStock": 0,
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.correlationId").exists());
    }

    @Test
    void createProduct_withNegativePrice_returns400() throws Exception {
        String body = """
                {
                  "name": "Bad Price",
                  "sku": "QA21-BAD-PRICE",
                  "categoryId": 1,
                  "price": -1,
                  "quantity": 0,
                  "minStock": 0,
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createProduct_withNegativeQuantity_returns400() throws Exception {
        String body = """
                {
                  "name": "Bad Qty",
                  "sku": "QA21-BAD-QTY",
                  "categoryId": 1,
                  "price": 1.00,
                  "quantity": -5,
                  "minStock": 0,
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateProduct_returns200() throws Exception {
        String create = """
                {
                  "name": "QA-21 Update Me",
                  "sku": "QA21-UPDATE-001",
                  "categoryId": 1,
                  "price": 5.00,
                  "quantity": 0,
                  "minStock": 0,
                  "status": "ACTIVE"
                }
                """;

        String created = mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(create))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long id = com.jayway.jsonpath.JsonPath.read(created, "$.id");

        String update = """
                {
                  "name": "QA-21 Updated Name",
                  "sku": "QA21-UPDATE-001",
                  "categoryId": 1,
                  "price": 6.50,
                  "minStock": 2,
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(put("/api/v1/products/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(update))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("QA-21 Updated Name"))
                .andExpect(jsonPath("$.price").value(6.5));
    }

    @Test
    void deleteProduct_returns204AndInactivates() throws Exception {
        String create = """
                {
                  "name": "QA-21 Delete Me",
                  "sku": "QA21-DELETE-001",
                  "categoryId": 1,
                  "price": 1.00,
                  "quantity": 0,
                  "minStock": 0,
                  "status": "ACTIVE"
                }
                """;

        String created = mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(create))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long id = com.jayway.jsonpath.JsonPath.read(created, "$.id");

        mockMvc.perform(delete("/api/v1/products/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/products/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }
}
