package com.company.inventory.report.service;

import com.company.inventory.product.entity.Category;
import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.product.repository.CategoryRepository;
import com.company.inventory.product.repository.ProductRepository;
import com.company.inventory.stock.repository.StockMovementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private StockMovementRepository stockMovementRepository;
    @InjectMocks
    private ReportService reportService;

    @Test
    void getDashboard_calculatesKpis() {
        when(productRepository.countByStatus(ProductStatus.ACTIVE)).thenReturn(3L);
        when(productRepository.countByStatus(ProductStatus.INACTIVE)).thenReturn(1L);
        when(productRepository.count(any(Specification.class))).thenReturn(1L);
        when(categoryRepository.count()).thenReturn(3L);
        when(stockMovementRepository.countByCreatedAtAfter(any())).thenReturn(4L);
        when(stockMovementRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of());

        Category category = new Category();
        category.setId(1L);
        category.setName("Electronics");

        Product active = new Product();
        active.setId(1L);
        active.setSku("SKU-T");
        active.setName("Test Product");
        active.setCategory(category);
        active.setStatus(ProductStatus.ACTIVE);
        active.setQuantity(10);
        active.setMinStock(2);
        active.setPrice(BigDecimal.valueOf(5));
        when(productRepository.findAll(any(Specification.class))).thenReturn(List.of(active));

        var dashboard = reportService.getDashboard();

        assertThat(dashboard.kpis().totalActiveProducts()).isEqualTo(3);
        assertThat(dashboard.kpis().criticalProductsCount()).isEqualTo(1);
        assertThat(dashboard.kpis().categoriesCount()).isEqualTo(3);
    }
}
