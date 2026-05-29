package com.company.inventory.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CorrelationIdFilterTest {

    @AfterEach
    void tearDown() {
        ObservabilityMdc.clear();
    }

    @Test
    void propagatesIncomingCorrelationIdInMdcAndResponse() throws Exception {
        CorrelationIdFilter filter = new CorrelationIdFilter(null);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/products");
        request.addHeader(CorrelationIdFilter.HEADER, "corr-qa19-001");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(response.getHeader(CorrelationIdFilter.HEADER)).isEqualTo("corr-qa19-001");
        assertThat(MDC.get(ObservabilityMdc.CORRELATION_ID)).isNull();
    }

    @Test
    void generatesCorrelationIdWhenHeaderMissing() throws Exception {
        CorrelationIdFilter filter = new CorrelationIdFilter(null);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        String generated = response.getHeader(CorrelationIdFilter.HEADER);
        assertThat(generated).isNotBlank().startsWith("req-");
        assertThat(MDC.get(ObservabilityMdc.CORRELATION_ID)).isNull();
    }

    @Test
    void currentCorrelationId_returnsUnknownOutsideRequest() {
        assertThat(CorrelationIdFilter.currentCorrelationId()).isEqualTo("unknown");
    }
}
