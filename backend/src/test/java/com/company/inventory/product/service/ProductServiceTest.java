package com.company.inventory.product.service;

import com.company.inventory.common.exception.ApiException;
import com.company.inventory.product.dto.ProductRequest;
import com.company.inventory.product.entity.Category;
import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.product.repository.ProductRepository;
import com.company.inventory.stock.service.StockService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryService categoryService;
    @Mock
    private StockService stockService;
    @InjectMocks
    private ProductService productService;

    @Test
    void create_rejectsDuplicateSku() {
        when(productRepository.existsBySkuIgnoreCase("SKU-1")).thenReturn(true);

        ProductRequest request = new ProductRequest(
                "Mouse", "SKU-1", null, 1L,
                BigDecimal.TEN, 5, 2, ProductStatus.ACTIVE);

        assertThatThrownBy(() -> productService.create(request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("SKU already exists");

        verify(productRepository, never()).save(any());
    }

    @Test
    void create_rejectsNegativePrice() {
        ProductRequest request = new ProductRequest(
                "Mouse", "SKU-2", null, 1L,
                BigDecimal.valueOf(-1), 0, 2, ProductStatus.ACTIVE);

        assertThatThrownBy(() -> productService.create(request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Price cannot be negative");
    }

    @Test
    void create_registersInitialStockWhenQuantityPositive() {
        Category category = new Category();
        category.setId(1L);
        category.setName("Electronics");

        when(productRepository.existsBySkuIgnoreCase("SKU-3")).thenReturn(false);
        when(categoryService.getByIdOrThrow(1L)).thenReturn(category);
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> {
            Product p = inv.getArgument(0);
            p.setId(10L);
            return p;
        });
        when(productRepository.findById(10L)).thenAnswer(inv -> {
            Product p = new Product();
            p.setId(10L);
            p.setSku("SKU-3");
            p.setName("Mouse");
            p.setCategory(category);
            p.setPrice(BigDecimal.TEN);
            p.setQuantity(5);
            p.setMinStock(2);
            p.setStatus(ProductStatus.ACTIVE);
            return Optional.of(p);
        });

        ProductRequest request = new ProductRequest(
                "Mouse", "SKU-3", null, 1L,
                BigDecimal.TEN, 5, 2, ProductStatus.ACTIVE);

        productService.create(request);

        verify(stockService).registerInitialStock(any(Product.class), org.mockito.ArgumentMatchers.eq(5),
                org.mockito.ArgumentMatchers.isNull());
    }
}
