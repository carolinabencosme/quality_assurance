package com.company.inventory.observability;

import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.product.repository.ProductRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BusinessMetricsRegistrarTest {

    @Test
    void registersBusinessGaugesFromProductRepository() {
        ProductRepository productRepository = mock(ProductRepository.class);
        when(productRepository.countByStatus(ProductStatus.ACTIVE)).thenReturn(4L);
        when(productRepository.count(any(Specification.class))).thenReturn(2L);
        when(productRepository.findAll(any(Specification.class))).thenReturn(List.of(product(5, "10.50"), product(3, "2.00")));
        SimpleMeterRegistry registry = new SimpleMeterRegistry();

        new BusinessMetricsRegistrar(registry, productRepository);

        assertThat(registry.find("inventory.products.active").gauge().value()).isEqualTo(4);
        assertThat(registry.find("inventory.products.critical").gauge().value()).isEqualTo(2);
        assertThat(registry.find("inventory.stock.total_units").gauge().value()).isEqualTo(8);
        assertThat(registry.find("inventory.inventory.value").gauge().value()).isEqualTo(58.5);
    }

    private Product product(int quantity, String price) {
        Product product = new Product();
        product.setQuantity(quantity);
        product.setPrice(new BigDecimal(price));
        return product;
    }
}
