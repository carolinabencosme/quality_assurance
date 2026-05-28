package com.company.inventory.stock.repository;

import com.company.inventory.stock.entity.StockMovement;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long>, JpaSpecificationExecutor<StockMovement> {

    boolean existsByProductId(Long productId);

    long countByCreatedAtAfter(Instant createdAt);

    @EntityGraph(attributePaths = "product")
    List<StockMovement> findTop5ByOrderByCreatedAtDesc();
}
