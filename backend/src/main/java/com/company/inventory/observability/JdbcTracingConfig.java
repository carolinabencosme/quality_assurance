package com.company.inventory.observability;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.instrumentation.jdbc.datasource.OpenTelemetryDataSource;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

/** Adds database client spans only when the observability profile is active. */
@Configuration(proxyBeanMethods = false)
@Profile("observability")
@SuppressWarnings("deprecation") // The explicit wrapper is required to reuse Spring Boot's configured OpenTelemetry SDK.
public class JdbcTracingConfig {

    private final ObjectProvider<OpenTelemetry> openTelemetryProvider;

    public JdbcTracingConfig(ObjectProvider<OpenTelemetry> openTelemetryProvider) {
        this.openTelemetryProvider = openTelemetryProvider;
    }

    @Bean
    BeanPostProcessor tracedDataSourceBeanPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (!(bean instanceof DataSource dataSource)
                        || bean instanceof OpenTelemetryDataSource) {
                    return bean;
                }

                OpenTelemetry openTelemetry = openTelemetryProvider.getIfAvailable();
                return openTelemetry == null
                        ? bean
                        : new OpenTelemetryDataSource(dataSource, openTelemetry);
            }
        };
    }
}
