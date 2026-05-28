package com.company.inventory.stock.controller;

import com.company.inventory.stock.dto.StockLevelResponse;
import com.company.inventory.stock.dto.StockMovementRequest;
import com.company.inventory.stock.dto.StockMovementResponse;
import com.company.inventory.stock.entity.StockMovementType;
import com.company.inventory.security.Permission;
import com.company.inventory.stock.service.StockService;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stock")
@Tag(name = "Stock", description = "Existencias e historial — permisos granulares JWT")
@SecurityRequirement(name = "bearerAuth")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('" + Permission.STOCK_VIEW + "')")
    @Operation(summary = "Consultar existencias", description = "Lista productos activos con cantidad y alerta critica")
    public Page<StockLevelResponse> findStockLevels(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean critical,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return stockService.findStockLevels(search, critical, pageable);
    }

    @GetMapping("/movements")
    @PreAuthorize("hasAuthority('" + Permission.STOCK_VIEW + "')")
    @Operation(summary = "Historial de movimientos", description = "Entradas, salidas y ajustes con paginacion")
    public Page<StockMovementResponse> findMovements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) StockMovementType type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return stockService.findMovements(productId, type, pageable);
    }

    @PostMapping("/movements")
    @PreAuthorize("hasAuthority('" + Permission.STOCK_MANAGE + "')")
    @Operation(summary = "Registrar movimiento", description = "IN suma, OUT resta (sin negativo), ADJUSTMENT fija cantidad")
    public ResponseEntity<StockMovementResponse> registerMovement(
            @Valid @RequestBody StockMovementRequest request) {
        StockMovementResponse response = stockService.registerMovement(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
