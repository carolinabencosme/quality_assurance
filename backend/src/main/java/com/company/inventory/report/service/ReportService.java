package com.company.inventory.report.service;

import com.company.inventory.product.dto.ProductResponse;
import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.product.mapper.ProductMapper;
import com.company.inventory.product.repository.CategoryRepository;
import com.company.inventory.product.repository.ProductRepository;
import com.company.inventory.product.repository.ProductSpecifications;
import com.company.inventory.report.dto.DashboardKpiResponse;
import com.company.inventory.report.dto.DashboardResponse;
import com.company.inventory.report.dto.RecentMovementSummary;
import com.company.inventory.report.dto.TopMovedProductSummary;
import com.company.inventory.stock.entity.StockMovement;
import com.company.inventory.stock.entity.StockMovementType;
import com.company.inventory.stock.repository.StockMovementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockMovementRepository stockMovementRepository;

    public ReportService(ProductRepository productRepository,
                         CategoryRepository categoryRepository,
                         StockMovementRepository stockMovementRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    public DashboardResponse getDashboard() {
        long active = productRepository.countByStatus(ProductStatus.ACTIVE);
        long inactive = productRepository.countByStatus(ProductStatus.INACTIVE);
        long critical = countCriticalProducts();
        long totalUnits = sumActiveStockUnits();
        BigDecimal inventoryValue = calculateInventoryValue();
        long movements7d = stockMovementRepository.countByCreatedAtAfter(
                Instant.now().minus(7, ChronoUnit.DAYS));
        long categories = categoryRepository.count();

        DashboardKpiResponse kpis = new DashboardKpiResponse(
                active,
                inactive,
                critical,
                totalUnits,
                inventoryValue,
                movements7d,
                categories
        );

        List<ProductResponse> criticalProducts = productRepository
                .findAll(Specification.where(ProductSpecifications.criticalOnly(true))
                        .and((root, query, cb) -> cb.equal(root.get("status"), ProductStatus.ACTIVE)))
                .stream()
                .map(ProductMapper::toResponse)
                .limit(10)
                .toList();

        List<RecentMovementSummary> recentMovements = stockMovementRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toMovementSummary)
                .toList();

        List<TopMovedProductSummary> topSoldProducts = stockMovementRepository.findTopMovedProducts(
                StockMovementType.OUT,
                Instant.now().minus(30, ChronoUnit.DAYS),
                PageRequest.of(0, 10)
        );

        return new DashboardResponse(kpis, criticalProducts, topSoldProducts, recentMovements);
    }

    public Page<ProductResponse> getCriticalProducts(Pageable pageable) {
        Specification<Product> spec = Specification
                .where(ProductSpecifications.criticalOnly(true))
                .and((root, query, cb) -> cb.equal(root.get("status"), ProductStatus.ACTIVE));
        return productRepository.findAll(spec, pageable).map(ProductMapper::toResponse);
    }

    private long countCriticalProducts() {
        Specification<Product> spec = Specification
                .where(ProductSpecifications.criticalOnly(true))
                .and((root, query, cb) -> cb.equal(root.get("status"), ProductStatus.ACTIVE));
        return productRepository.count(spec);
    }

    private long sumActiveStockUnits() {
        return productRepository.findAll((root, query, cb) ->
                        cb.equal(root.get("status"), ProductStatus.ACTIVE))
                .stream()
                .mapToLong(p -> p.getQuantity() != null ? p.getQuantity() : 0)
                .sum();
    }

    private BigDecimal calculateInventoryValue() {
        return productRepository.findAll((root, query, cb) ->
                        cb.equal(root.get("status"), ProductStatus.ACTIVE))
                .stream()
                .map(p -> p.getPrice().multiply(BigDecimal.valueOf(p.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private RecentMovementSummary toMovementSummary(StockMovement movement) {
        return new RecentMovementSummary(
                movement.getId(),
                movement.getProduct().getId(),
                movement.getProduct().getSku(),
                movement.getProduct().getName(),
                movement.getType(),
                movement.getDelta(),
                movement.getNewQty(),
                movement.getCreatedAt()
        );
    }
}
