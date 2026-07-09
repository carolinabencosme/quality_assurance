package com.company.inventory.stock.service;

import com.company.inventory.common.exception.ApiException;
import com.company.inventory.observability.CorrelationIdFilter;
import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.product.repository.ProductRepository;
import com.company.inventory.product.repository.ProductSpecifications;
import com.company.inventory.stock.dto.StockLevelResponse;
import com.company.inventory.stock.dto.StockMovementRequest;
import com.company.inventory.stock.dto.StockMovementResponse;
import com.company.inventory.stock.entity.StockMovement;
import com.company.inventory.stock.entity.StockMovementType;
import com.company.inventory.stock.mapper.StockLevelMapper;
import com.company.inventory.stock.mapper.StockMovementMapper;
import com.company.inventory.stock.repository.StockMovementRepository;
import com.company.inventory.stock.repository.StockMovementSpecifications;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);

    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final Counter movementsCounter;

    public StockService(StockMovementRepository stockMovementRepository,
                        ProductRepository productRepository,
                        @Autowired(required = false) MeterRegistry meterRegistry) {
        this.stockMovementRepository = stockMovementRepository;
        this.productRepository = productRepository;
        this.movementsCounter = meterRegistry != null
                ? Counter.builder("inventory.movements")
                .description("Total stock movements")
                .register(meterRegistry)
                : null;
    }

    @Transactional(readOnly = true)
    public Page<StockLevelResponse> findStockLevels(
            String search, Boolean critical, Pageable pageable) {
        Specification<Product> spec = Specification.where(ProductSpecifications.withSearch(search))
                .and(ProductSpecifications.criticalOnly(critical))
                .and((root, query, cb) -> cb.equal(root.get("status"), ProductStatus.ACTIVE));
        return productRepository.findAll(spec, pageable).map(StockLevelMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<StockMovementResponse> findMovements(Long productId, StockMovementType type, Pageable pageable) {
        Specification<StockMovement> spec = Specification
                .where(StockMovementSpecifications.withProductId(productId))
                .and(StockMovementSpecifications.withType(type));
        return stockMovementRepository.findAll(spec, pageable).map(StockMovementMapper::toResponse);
    }

    public StockMovementResponse registerMovement(StockMovementRequest request) {
        Product product = getProductOrThrow(request.productId());
        ensureActive(product);
        return StockMovementMapper.toResponse(applyMovement(
                product,
                request.type(),
                request.quantity(),
                request.newQuantity(),
                request.observations(),
                resolveUserId(request.userId()),
                CorrelationIdFilter.currentCorrelationId()
        ));
    }

    public void registerInitialStock(Product product, int quantity, String userId) {
        applyMovement(product, StockMovementType.IN, quantity, null,
                "Initial stock on product creation", userId,
                CorrelationIdFilter.currentCorrelationId());
    }

    private StockMovement applyMovement(Product product,
                                        StockMovementType type,
                                        Integer quantity,
                                        Integer newQuantity,
                                        String observations,
                                        String userId,
                                        String correlationId) {
        int previousQty = product.getQuantity();
        int newQty = switch (type) {
            case IN -> {
                if (quantity == null || quantity < 1) {
                    throw ApiException.badRequest("IN movement requires quantity >= 1");
                }
                yield previousQty + quantity;
            }
            case OUT -> {
                if (quantity == null || quantity < 1) {
                    throw ApiException.badRequest("OUT movement requires quantity >= 1");
                }
                int result = previousQty - quantity;
                if (result < 0) {
                    throw ApiException.conflict(
                            "Insufficient stock. Current: " + previousQty + ", requested OUT: " + quantity);
                }
                yield result;
            }
            case ADJUSTMENT -> {
                if (newQuantity == null || newQuantity < 0) {
                    throw ApiException.badRequest("ADJUSTMENT requires newQuantity >= 0");
                }
                yield newQuantity;
            }
        };

        int delta = newQty - previousQty;
        product.setQuantity(newQty);
        productRepository.save(product);

        StockMovement movement = new StockMovement();
        movement.setProduct(product);
        movement.setUserId(userId);
        movement.setType(type);
        movement.setPreviousQty(previousQty);
        movement.setNewQty(newQty);
        movement.setDelta(delta);
        movement.setObservations(observations);
        movement.setCorrelationId(correlationId);

        StockMovement saved = stockMovementRepository.save(movement);
        if (movementsCounter != null) {
            movementsCounter.increment();
        }
        log.info("event=stock_movement_registered productId={} type={} previousQty={} newQty={} delta={} correlationId={}",
                product.getId(), type, previousQty, newQty, delta, correlationId);
        return saved;
    }

    private Product getProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Product not found: " + id));
    }

    private void ensureActive(Product product) {
        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw ApiException.badRequest("Cannot modify stock of inactive product");
        }
    }

    private String resolveUserId(String requestUserId) {
        if (requestUserId != null && !requestUserId.isBlank()) {
            return requestUserId;
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "system";
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String preferredUsername = jwt.getClaimAsString("preferred_username");
            if (preferredUsername != null && !preferredUsername.isBlank()) {
                return preferredUsername;
            }
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) {
                return email;
            }
            if (jwt.getSubject() != null && !jwt.getSubject().isBlank()) {
                return jwt.getSubject();
            }
        }
        return authentication.getName();
    }
}
