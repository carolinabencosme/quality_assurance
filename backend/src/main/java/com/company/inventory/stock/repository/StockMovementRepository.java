package com.company.inventory.stock.repository;

import com.company.inventory.stock.entity.StockMovement;
import com.company.inventory.stock.entity.StockMovementType;
import com.company.inventory.report.dto.TopMovedProductSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long>, JpaSpecificationExecutor<StockMovement> {

    @Override
    @EntityGraph(attributePaths = "product")
    Page<StockMovement> findAll(Specification<StockMovement> spec, Pageable pageable);

    boolean existsByProductId(Long productId);

    long countByCreatedAtAfter(Instant createdAt);

    @EntityGraph(attributePaths = "product")
    List<StockMovement> findTop5ByOrderByCreatedAtDesc();

    @Query("""
            select new com.company.inventory.report.dto.TopMovedProductSummary(
                m.product.id,
                m.product.sku,
                m.product.name,
                sum(abs(m.delta)),
                count(m)
            )
            from StockMovement m
            where m.type = :type
              and m.createdAt >= :from
            group by m.product.id, m.product.sku, m.product.name
            order by sum(abs(m.delta)) desc, count(m) desc, m.product.name asc
            """)
    List<TopMovedProductSummary> findTopMovedProducts(
            @Param("type") StockMovementType type,
            @Param("from") Instant from,
            Pageable pageable);
}
