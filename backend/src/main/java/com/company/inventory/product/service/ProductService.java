package com.company.inventory.product.service;

import com.company.inventory.common.exception.ApiException;
import com.company.inventory.observability.ObservabilityMdc;
import com.company.inventory.product.dto.ProductRequest;
import com.company.inventory.product.dto.ProductResponse;
import com.company.inventory.product.dto.ProductUpdateRequest;
import com.company.inventory.product.entity.Category;
import com.company.inventory.product.entity.Product;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.product.mapper.ProductMapper;
import com.company.inventory.product.repository.CategoryRepository;
import com.company.inventory.product.repository.ProductRepository;
import com.company.inventory.product.repository.ProductSpecifications;
import com.company.inventory.stock.service.StockService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockService stockService;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          StockService stockService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.stockService = stockService;
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> findAll(String search, Long categoryId, ProductStatus status,
                                         Boolean critical, Pageable pageable) {
        Specification<Product> spec = Specification.where(ProductSpecifications.withSearch(search))
                .and(ProductSpecifications.withCategoryId(categoryId))
                .and(ProductSpecifications.withStatus(status))
                .and(ProductSpecifications.criticalOnly(critical));
        return productRepository.findAll(spec, pageable).map(ProductMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        return ProductMapper.toResponse(getProductOrThrow(id));
    }

    public ProductResponse create(ProductRequest request) {
        validateSkuUnique(request.sku(), null);
        validateNonNegative(request.price(), request.quantity(), request.minStock());

        Category category = getCategoryOrThrow(request.categoryId());
        Product product = new Product();
        product.setName(request.name().trim());
        product.setSku(request.sku().trim().toUpperCase());
        product.setDescription(request.description());
        product.setCategory(category);
        product.setPrice(request.price());
        product.setQuantity(0);
        product.setMinStock(request.minStock());
        product.setStatus(request.status());

        Product saved = productRepository.save(product);

        if (request.quantity() > 0) {
            stockService.registerInitialStock(saved, request.quantity(), null);
        }

        log.info("event=product_created productId={} sku={} correlationId={}",
                saved.getId(), saved.getSku(), ObservabilityMdc.correlationIdOrUnknown());
        return ProductMapper.toResponse(getProductOrThrow(saved.getId()));
    }

    public ProductResponse update(Long id, ProductUpdateRequest request) {
        Product product = getProductOrThrow(id);
        validateSkuUnique(request.sku(), id);
        validateNonNegative(request.price(), product.getQuantity(), request.minStock());

        Category category = getCategoryOrThrow(request.categoryId());
        product.setName(request.name().trim());
        product.setSku(request.sku().trim().toUpperCase());
        product.setDescription(request.description());
        product.setCategory(category);
        product.setPrice(request.price());
        product.setMinStock(request.minStock());
        product.setStatus(request.status());

        Product saved = productRepository.save(product);
        log.info("event=product_updated productId={} sku={} correlationId={}",
                saved.getId(), saved.getSku(), ObservabilityMdc.correlationIdOrUnknown());
        return ProductMapper.toResponse(saved);
    }

    public void delete(Long id) {
        Product product = getProductOrThrow(id);
        product.deactivate();
        productRepository.save(product);
        log.info("event=product_deactivated productId={} sku={} correlationId={}",
                product.getId(), product.getSku(), ObservabilityMdc.correlationIdOrUnknown());
    }

    Product getProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Product not found: " + id));
    }

    private Category getCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> ApiException.notFound("Category not found: " + categoryId));
    }

    private void validateSkuUnique(String sku, Long excludeId) {
        boolean exists = excludeId == null
                ? productRepository.existsBySkuIgnoreCase(sku)
                : productRepository.existsBySkuIgnoreCaseAndIdNot(sku, excludeId);
        if (exists) {
            throw ApiException.conflict("SKU already exists: " + sku);
        }
    }

    private void validateNonNegative(java.math.BigDecimal price, Integer quantity, Integer minStock) {
        if (price.signum() < 0) {
            throw ApiException.badRequest("Price cannot be negative");
        }
        if (quantity != null && quantity < 0) {
            throw ApiException.badRequest("Quantity cannot be negative");
        }
        if (minStock < 0) {
            throw ApiException.badRequest("Min stock cannot be negative");
        }
    }
}
