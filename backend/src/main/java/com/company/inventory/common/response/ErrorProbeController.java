package com.company.inventory.common.response;

import com.company.inventory.common.exception.ApiException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de prueba para validar el formato de error estándar (solo perfil dev).
 */
@RestController
@Profile("dev")
@RequestMapping("/api/v1/demo/errors")
@Tag(name = "Demo / Errors", description = "Sondas de error (solo perfil dev) — OpenAPI QA")
public class ErrorProbeController {

    @GetMapping("/not-found")
    @Operation(summary = "Sonda 404", description = "Devuelve ApiException NOT_FOUND con cuerpo estándar")
    public void notFound() {
        throw ApiException.notFound("Resource not found for probe");
    }

    @GetMapping("/unexpected")
    @Operation(summary = "Sonda 500", description = "Provoca fallo no controlado → 500 genérico")
    public void unexpected() {
        throw new IllegalStateException("probe unexpected failure");
    }

    @PostMapping("/validation")
    @Operation(summary = "Sonda 400 validación", description = "Bean Validation → 400 con detalle de campos")
    public void validation(@Valid @RequestBody ProbeRequest body) {
        // validated by @Valid
    }

    public record ProbeRequest(@NotBlank String name) {
    }
}
