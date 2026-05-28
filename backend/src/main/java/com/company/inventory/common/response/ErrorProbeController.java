package com.company.inventory.common.response;

import com.company.inventory.common.exception.ApiException;
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
public class ErrorProbeController {

    @GetMapping("/not-found")
    public void notFound() {
        throw ApiException.notFound("Resource not found for probe");
    }

    @GetMapping("/unexpected")
    public void unexpected() {
        throw new IllegalStateException("probe unexpected failure");
    }

    @PostMapping("/validation")
    public void validation(@Valid @RequestBody ProbeRequest body) {
        // validated by @Valid
    }

    public record ProbeRequest(@NotBlank String name) {
    }
}
