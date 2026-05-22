package com.company.inventory.security;

import com.company.inventory.common.exception.GlobalExceptionHandler;
import com.company.inventory.observability.CorrelationIdFilter;
import com.company.inventory.product.controller.ProductController;
import com.company.inventory.product.dto.ProductResponse;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.product.service.ProductService;
import com.company.inventory.stock.controller.StockController;
import com.company.inventory.stock.service.StockService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {ProductController.class, StockController.class})
@Import({
        SecurityConfig.class,
        MethodSecurityConfig.class,
        GlobalExceptionHandler.class,
        CorrelationIdFilter.class
})
class ApiSecurityMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtDecoder jwtDecoder;

    @MockBean
    private ProductService productService;

    @MockBean
    private StockService stockService;

    @Test
    void products_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void products_withTokenButNoPermission_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/products").with(jwt()))
                .andExpect(status().isForbidden());
    }

    @Test
    void products_withProductView_returns200() throws Exception {
        when(productService.findAll(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleProduct())));

        mockMvc.perform(get("/api/v1/products")
                        .with(jwt().authorities(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                        Permission.PRODUCT_VIEW))))
                .andExpect(status().isOk());
    }

    @Test
    void stockMovements_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/stock/movements"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void stockMovements_withStockView_returns200() throws Exception {
        when(stockService.findMovements(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/stock/movements")
                        .with(jwt().authorities(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                        Permission.STOCK_VIEW))))
                .andExpect(status().isOk());
    }

    @Test
    void stockMovements_postWithoutStockManage_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/stock/movements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": 1,
                                  "type": "IN",
                                  "quantity": 5
                                }
                                """)
                        .with(jwt().authorities(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                        Permission.STOCK_VIEW))))
                .andExpect(status().isForbidden());
    }

    private static ProductResponse sampleProduct() {
        return new ProductResponse(
                1L, "Mouse", "SKU-1", null, 1L, "Electronics",
                BigDecimal.TEN, 10, 2, false, ProductStatus.ACTIVE,
                Instant.now(), Instant.now()
        );
    }
}
