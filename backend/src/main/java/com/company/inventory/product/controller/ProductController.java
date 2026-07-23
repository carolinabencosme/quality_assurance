package com.company.inventory.product.controller;

import com.company.inventory.product.dto.ProductRequest;
import com.company.inventory.product.dto.ProductResponse;
import com.company.inventory.product.dto.ProductUpdateRequest;
import com.company.inventory.product.entity.ProductStatus;
import com.company.inventory.product.service.ProductService;
import com.company.inventory.security.Permission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "CRUD de productos — permisos granulares JWT")
@SecurityRequirement(name = "bearerAuth")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('" + Permission.PRODUCT_VIEW + "') or hasAuthority('SCOPE_" + Permission.PRODUCT_VIEW + "')")
    @Operation(summary = "Listar productos", description = "Paginación, búsqueda por nombre/SKU, filtros y ordenamiento")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Página de productos"),
            @ApiResponse(responseCode = "401", description = "JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Sin permiso product:view")
    })
    public Page<ProductResponse> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) Boolean critical,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return productService.findAll(search, categoryId, status, critical, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('" + Permission.PRODUCT_VIEW + "') or hasAuthority('SCOPE_" + Permission.PRODUCT_VIEW + "')")
    @Operation(summary = "Detalle de producto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Producto encontrado"),
            @ApiResponse(responseCode = "401", description = "JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Sin permiso product:view"),
            @ApiResponse(responseCode = "404", description = "Producto no existe")
    })
    public ProductResponse findById(@PathVariable Long id) {
        return productService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('" + Permission.PRODUCT_MANAGE + "') or hasAuthority('SCOPE_" + Permission.PRODUCT_MANAGE + "')")
    @Operation(summary = "Crear producto", description = "Valida SKU único, precio y stock inicial no negativos")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Producto creado"),
            @ApiResponse(responseCode = "400", description = "Validación Bean Validation o negocio"),
            @ApiResponse(responseCode = "401", description = "JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Sin permiso product:manage"),
            @ApiResponse(responseCode = "409", description = "SKU duplicado")
    })
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse created = productService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('" + Permission.PRODUCT_MANAGE + "') or hasAuthority('SCOPE_" + Permission.PRODUCT_MANAGE + "')")
    @Operation(summary = "Actualizar producto", description = "No modifica cantidad; usar movimientos de stock")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Producto actualizado"),
            @ApiResponse(responseCode = "400", description = "Validación"),
            @ApiResponse(responseCode = "401", description = "JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Sin permiso product:manage"),
            @ApiResponse(responseCode = "404", description = "Producto no existe"),
            @ApiResponse(responseCode = "409", description = "SKU duplicado")
    })
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductUpdateRequest request) {
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('" + Permission.PRODUCT_MANAGE + "') or hasAuthority('SCOPE_" + Permission.PRODUCT_MANAGE + "')")
    @Operation(summary = "Inactivar producto", description = "Soft delete: status INACTIVE")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Producto inactivado"),
            @ApiResponse(responseCode = "401", description = "JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Sin permiso product:manage"),
            @ApiResponse(responseCode = "404", description = "Producto no existe")
    })
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
