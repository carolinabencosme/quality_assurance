package com.company.inventory.observability;

import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.product.repository.ProductRepository;
import com.company.inventory.product.repository.ProductSpecifications;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class BusinessMetricsRegistrar {

    public BusinessMetricsRegistrar(MeterRegistry registry, ProductRepository productRepository) {
        Gauge.builder("inventory.products.active", productRepository,
                        repository -> repository.countByStatus(ProductStatus.ACTIVE))
                .description("Active products")
                .register(registry);

        Gauge.builder("inventory.products.critical", productRepository,
                        repository -> repository.count(criticalActiveProducts()))
                .description("Active products at or below minimum stock")
                .register(registry);

        Gauge.builder("inventory.stock.total_units", productRepository, this::sumActiveStockUnits)
                .description("Total stock units for active products")
                .register(registry);

        Gauge.builder("inventory.inventory.value", productRepository,
                        repository -> calculateInventoryValue(repository).doubleValue())
                .description("Inventory value for active products")
                .register(registry);
    }

    private Specification<Product> criticalActiveProducts() {
        return Specification.where(ProductSpecifications.criticalOnly(true))
                .and((root, query, cb) -> cb.equal(root.get("status"), ProductStatus.ACTIVE));
    }

    private double sumActiveStockUnits(ProductRepository repository) {
        return repository.findAll(activeProducts())
                .stream()
                .mapToDouble(product -> product.getQuantity() != null ? product.getQuantity() : 0)
                .sum();
    }

    private BigDecimal calculateInventoryValue(ProductRepository repository) {
        return repository.findAll(activeProducts())
                .stream()
                .map(product -> product.getPrice().multiply(BigDecimal.valueOf(product.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Specification<Product> activeProducts() {
        return (root, query, cb) -> cb.equal(root.get("status"), ProductStatus.ACTIVE);
    }
}
