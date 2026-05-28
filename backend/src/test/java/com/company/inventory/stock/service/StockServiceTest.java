package com.company.inventory.stock.service;

import com.company.inventory.common.exception.ApiException;
import com.company.inventory.product.entity.Category;
import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.product.repository.ProductRepository;
import com.company.inventory.stock.dto.StockMovementRequest;
import com.company.inventory.stock.entity.StockMovementType;
import com.company.inventory.stock.repository.StockMovementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock
    private StockMovementRepository stockMovementRepository;
    @Mock
    private ProductRepository productRepository;
    @InjectMocks
    private StockService stockService;

    @Test
    void registerMovement_outRejectsNegativeStock() {
        Product product = activeProduct(20);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        StockMovementRequest request = new StockMovementRequest(
                1L, StockMovementType.OUT, 25, null, null, null);

        assertThatThrownBy(() -> stockService.registerMovement(request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Insufficient stock");

        verify(stockMovementRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void registerMovement_inIncreasesQuantity() {
        Product product = activeProduct(10);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        when(stockMovementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        StockMovementRequest request = new StockMovementRequest(
                1L, StockMovementType.IN, 5, null, "restock", "user-1");

        stockService.registerMovement(request);

        org.assertj.core.api.Assertions.assertThat(product.getQuantity()).isEqualTo(15);
        verify(stockMovementRepository).save(any());
    }

    private Product activeProduct(int quantity) {
        Category category = new Category();
        category.setId(1L);
        Product product = new Product();
        product.setId(1L);
        product.setName("Item");
        product.setSku("SKU-X");
        product.setCategory(category);
        product.setPrice(BigDecimal.ONE);
        product.setQuantity(quantity);
        product.setMinStock(2);
        product.setStatus(ProductStatus.ACTIVE);
        return product;
    }
}
