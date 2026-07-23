package com.company.inventory.observability;

import com.company.inventory.security.Permission;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.search.Search;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/observability")
@Tag(name = "Observability", description = "Runtime metrics for operational dashboard")
@SecurityRequirement(name = "bearerAuth")
public class ObservabilityController {

    private final MeterRegistry registry;

    public ObservabilityController(MeterRegistry registry) {
        this.registry = registry;
    }

    @GetMapping("/system-metrics")
    @PreAuthorize("hasAuthority('" + Permission.REPORT_VIEW + "') or hasAuthority('SCOPE_" + Permission.REPORT_VIEW + "')")
    @Operation(summary = "System metrics", description = "JVM, process, HTTP and datasource metrics from Micrometer.")
    public SystemMetricsResponse systemMetrics() {
        return new SystemMetricsResponse(
                new JvmMetrics(
                        bytesToMb(gauge("jvm.memory.used", "area", "heap")),
                        bytesToMb(gauge("jvm.memory.max", "area", "heap")),
                        Math.round(gauge("jvm.threads.live"))
                ),
                new ProcessMetrics(
                        gauge("process.cpu.usage"),
                        Math.round(gauge("process.uptime"))
                ),
                httpMetrics(),
                new DatasourceMetrics(
                        Math.round(gauge("hikaricp.connections.active")),
                        Math.round(gauge("hikaricp.connections.idle")),
                        Math.round(gauge("hikaricp.connections.max")),
                        Math.round(gauge("hikaricp.connections.pending"))
                )
        );
    }

    private HttpMetrics httpMetrics() {
        Collection<Timer> timers = Search.in(registry).name("http.server.requests").timers();
        long total = 0;
        long errors = 0;
        double p95Ms = 0;
        for (Timer timer : timers) {
            long count = timer.count();
            total += count;
            String status = timer.getId().getTag("status");
            if (status != null && status.startsWith("5")) {
                errors += count;
            }
            p95Ms = Math.max(p95Ms, timer.takeSnapshot().percentileValues().length == 0
                    ? 0
                    : timer.takeSnapshot().percentileValues()[0].value(TimeUnit.MILLISECONDS));
        }
        double errorRate = total == 0 ? 0 : (double) errors / total;
        return new HttpMetrics(total, errorRate, p95Ms);
    }

    private double gauge(String name) {
        Gauge gauge = registry.find(name).gauge();
        return gauge != null ? gauge.value() : 0;
    }

    private double gauge(String name, String tagKey, String tagValue) {
        Gauge gauge = registry.find(name).tag(tagKey, tagValue).gauge();
        return gauge != null ? gauge.value() : 0;
    }

    private double bytesToMb(double bytes) {
        return bytes <= 0 ? 0 : bytes / 1024 / 1024;
    }

    public record SystemMetricsResponse(
            JvmMetrics jvm,
            ProcessMetrics process,
            HttpMetrics http,
            DatasourceMetrics datasource
    ) {
    }

    public record JvmMetrics(double heapUsedMb, double heapMaxMb, long threads) {
    }

    public record ProcessMetrics(double cpuUsage, long uptimeSeconds) {
    }

    public record HttpMetrics(long requestsLast5m, double errorRate5m, double p95Ms) {
    }

    public record DatasourceMetrics(long active, long idle, long max, long pending) {
    }
}
