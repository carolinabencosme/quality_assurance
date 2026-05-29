package com.company.inventory.common.exception;

import com.company.inventory.common.response.ErrorProbeController;
import com.company.inventory.observability.CorrelationIdFilter;
import com.company.inventory.security.SecurityDisabledConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ErrorProbeController.class)
@Import({GlobalExceptionHandler.class, CorrelationIdFilter.class, SecurityDisabledConfig.class})
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("dev")
@TestPropertySource(properties = "inventory.security.enabled=false")
class GlobalExceptionHandlerTest {

  private static final String CORRELATION_ID = "test-corr-qa18";

  @Autowired
  private MockMvc mockMvc;

  @Test
  void apiException_returnsStandardErrorBody() throws Exception {
    mockMvc.perform(get("/api/v1/demo/errors/not-found")
            .header(CorrelationIdFilter.HEADER, CORRELATION_ID))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.timestamp").value(notNullValue()))
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.error").value("Not Found"))
        .andExpect(jsonPath("$.message").value("Resource not found for probe"))
        .andExpect(jsonPath("$.path").value("/api/v1/demo/errors/not-found"))
        .andExpect(jsonPath("$.correlationId").value(CORRELATION_ID));
  }

  @Test
  void validation_returnsBadRequestWithFieldMessages() throws Exception {
    mockMvc.perform(post("/api/v1/demo/errors/validation")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}")
            .header(CorrelationIdFilter.HEADER, CORRELATION_ID))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.error").value("Bad Request"))
        .andExpect(jsonPath("$.message").value(notNullValue()))
        .andExpect(jsonPath("$.correlationId").value(CORRELATION_ID));
  }

  @Test
  void unexpected_returnsInternalServerErrorWithoutLeakingDetails() throws Exception {
    mockMvc.perform(get("/api/v1/demo/errors/unexpected")
            .header(CorrelationIdFilter.HEADER, CORRELATION_ID))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.status").value(500))
        .andExpect(jsonPath("$.error").value("Internal Server Error"))
        .andExpect(jsonPath("$.message").value("An unexpected error occurred"))
        .andExpect(jsonPath("$.correlationId").value(CORRELATION_ID));
  }

  @Test
  void correlationId_generatedWhenHeaderMissing() throws Exception {
    mockMvc.perform(get("/api/v1/demo/errors/not-found"))
        .andExpect(status().isNotFound())
        .andExpect(header().exists(CorrelationIdFilter.HEADER))
        .andExpect(jsonPath("$.correlationId").value(notNullValue()));
  }
}
