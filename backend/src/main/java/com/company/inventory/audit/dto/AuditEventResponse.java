package com.company.inventory.audit.dto;

import java.time.Instant;

public record AuditEventResponse(
        Long revisionId,
        String entityName,
        Long entityId,
        String action,
        String modifiedBy,
        Instant modifiedAt,
        String summary
) {
}
