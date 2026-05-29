package com.company.inventory.observability;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Propaga {@code X-Correlation-Id} en MDC, respuesta HTTP y operaciones de dominio.
 * Alinea con trazas OTEL (traceId/spanId) cuando Micrometer Tracing está activo (QA-19).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Correlation-Id";

    /** @deprecated use {@link ObservabilityMdc#CORRELATION_ID} */
    @Deprecated
    public static final String MDC_KEY = ObservabilityMdc.CORRELATION_ID;

    private final Tracer tracer;

    public CorrelationIdFilter(@Autowired(required = false) Tracer tracer) {
        this.tracer = tracer;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String correlationId = resolveCorrelationId(request);
        ObservabilityMdc.putCorrelationId(correlationId);
        enrichMdcFromTracer();

        response.setHeader(HEADER, correlationId);
        exposeTraceHeaders(response);

        try {
            filterChain.doFilter(request, response);
        } finally {
            ObservabilityMdc.clear();
        }
    }

    private String resolveCorrelationId(HttpServletRequest request) {
        String header = request.getHeader(HEADER);
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        if (tracer != null) {
            Span current = tracer.currentSpan();
            if (current != null) {
                String traceId = current.context().traceId();
                if (traceId != null && !traceId.isBlank()) {
                    return traceId;
                }
            }
        }
        return "req-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private void enrichMdcFromTracer() {
        if (tracer == null) {
            return;
        }
        Span current = tracer.currentSpan();
        if (current != null) {
            ObservabilityMdc.putTraceContext(
                    current.context().traceId(),
                    current.context().spanId()
            );
        }
    }

    private void exposeTraceHeaders(HttpServletResponse response) {
        if (tracer == null) {
            return;
        }
        Span current = tracer.currentSpan();
        if (current != null) {
            response.setHeader("X-Trace-Id", current.context().traceId());
        }
    }

    public static String currentCorrelationId() {
        return ObservabilityMdc.correlationIdOrUnknown();
    }
}
