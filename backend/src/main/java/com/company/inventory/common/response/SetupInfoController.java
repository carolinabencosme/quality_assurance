package com.company.inventory.common.response;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Endpoint temporal de Fase 0 para validar que la API responde.
 * Sera reemplazado por modulos de dominio en Fase 1.
 */
@RestController
@RequestMapping("/api/v1")
public class SetupInfoController {

    @Value("${spring.application.name}")
    private String applicationName;

    @GetMapping("/setup/info")
    public Map<String, Object> setupInfo() {
        return Map.of(
                "application", applicationName,
                "phase", "0",
                "status", "running",
                "message", "Monorepo y entorno local listos. Siguiente: Fase 1 - Core funcional.",
                "timestamp", Instant.now().toString()
        );
    }
}
