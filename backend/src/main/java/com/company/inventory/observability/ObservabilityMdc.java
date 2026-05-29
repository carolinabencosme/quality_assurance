package com.company.inventory.observability;

import org.slf4j.MDC;

/**
 * Claves MDC para logs estructurados y correlación con trazas OTEL (QA-19).
 */
public final class ObservabilityMdc {

    public static final String CORRELATION_ID = "correlationId";
    public static final String TRACE_ID = "traceId";
    public static final String SPAN_ID = "spanId";

    private ObservabilityMdc() {
    }

    public static void putCorrelationId(String correlationId) {
        if (correlationId != null && !correlationId.isBlank()) {
            MDC.put(CORRELATION_ID, correlationId);
        }
    }

    public static void putTraceContext(String traceId, String spanId) {
        if (traceId != null && !traceId.isBlank()) {
            MDC.put(TRACE_ID, traceId);
        }
        if (spanId != null && !spanId.isBlank()) {
            MDC.put(SPAN_ID, spanId);
        }
    }

    public static void clear() {
        MDC.remove(CORRELATION_ID);
        MDC.remove(TRACE_ID);
        MDC.remove(SPAN_ID);
    }

    public static String correlationIdOrUnknown() {
        String id = MDC.get(CORRELATION_ID);
        return id != null ? id : "unknown";
    }
}
