package com.company.inventory.product.controller;

import com.company.inventory.product.dto.CategoryResponse;
import com.company.inventory.product.service.CategoryService;
import com.company.inventory.security.Permission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "Categories", description = "Categorias para filtros y formularios de producto")
@SecurityRequirement(name = "bearerAuth")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('" + Permission.PRODUCT_VIEW + "')")
    @Operation(summary = "Listar categorías", description = "Catálogo completo para filtros y formularios de producto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de categorías"),
            @ApiResponse(responseCode = "401", description = "JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Sin permiso product:view")
    })
    public List<CategoryResponse> findAll() {
        return categoryService.findAll();
    }
}
