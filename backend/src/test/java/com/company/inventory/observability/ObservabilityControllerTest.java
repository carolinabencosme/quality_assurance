package com.company.inventory.observability;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;

class ObservabilityControllerTest {

    @Test
    void systemMetrics_readsJvmHttpProcessAndDatasourceMeters() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        registerGauge(registry, "jvm.memory.used", 128 * 1024 * 1024, "area", "heap");
        registerGauge(registry, "jvm.memory.max", 512 * 1024 * 1024, "area", "heap");
        registerGauge(registry, "jvm.threads.live", 42);
        registerGauge(registry, "process.cpu.usage", 0.25);
        registerGauge(registry, "process.uptime", 3600);
        registerGauge(registry, "hikaricp.connections.active", 2);
        registerGauge(registry, "hikaricp.connections.idle", 8);
        registerGauge(registry, "hikaricp.connections.max", 10);
        registerGauge(registry, "hikaricp.connections.pending", 1);

        Timer okTimer = Timer.builder("http.server.requests")
                .tag("status", "200")
                .publishPercentiles(0.95)
                .register(registry);
        okTimer.record(120, TimeUnit.MILLISECONDS);
        Timer errorTimer = Timer.builder("http.server.requests")
                .tag("status", "500")
                .register(registry);
        errorTimer.record(250, TimeUnit.MILLISECONDS);

        ObservabilityController.SystemMetricsResponse response =
                new ObservabilityController(registry).systemMetrics();

        assertThat(response.jvm().heapUsedMb()).isEqualTo(128);
        assertThat(response.jvm().heapMaxMb()).isEqualTo(512);
        assertThat(response.jvm().threads()).isEqualTo(42);
        assertThat(response.process().cpuUsage()).isEqualTo(0.25);
        assertThat(response.process().uptimeSeconds()).isEqualTo(3600);
        assertThat(response.http().requestsLast5m()).isEqualTo(2);
        assertThat(response.http().errorRate5m()).isEqualTo(0.5);
        assertThat(response.datasource().active()).isEqualTo(2);
        assertThat(response.datasource().idle()).isEqualTo(8);
        assertThat(response.datasource().max()).isEqualTo(10);
        assertThat(response.datasource().pending()).isEqualTo(1);
    }

    @Test
    void systemMetrics_returnsZeroWhenMetersAreMissing() {
        ObservabilityController.SystemMetricsResponse response =
                new ObservabilityController(new SimpleMeterRegistry()).systemMetrics();

        assertThat(response.jvm().heapUsedMb()).isZero();
        assertThat(response.http().requestsLast5m()).isZero();
        assertThat(response.datasource().active()).isZero();
    }

    private void registerGauge(SimpleMeterRegistry registry, String name, double value, String... tags) {
        AtomicLong holder = new AtomicLong(Double.doubleToLongBits(value));
        Gauge.builder(name, holder, current -> Double.longBitsToDouble(current.get()))
                .tags(tags)
                .strongReference(true)
                .register(registry);
    }
}
