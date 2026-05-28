package com.company.inventory.audit.service;

import com.company.inventory.audit.InventoryRevisionEntity;
import com.company.inventory.audit.dto.AuditEventResponse;
import com.company.inventory.product.entity.Product;
import jakarta.persistence.EntityManager;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AuditService {

    private final EntityManager entityManager;

    public AuditService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Page<AuditEventResponse> findAuditEvents(Pageable pageable) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(Product.class, false, true)
                .addOrder(AuditEntity.revisionNumber().desc())
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        List<AuditEventResponse> content = new ArrayList<>();
        for (Object[] row : rows) {
            Product product = (Product) row[0];
            InventoryRevisionEntity revision = (InventoryRevisionEntity) row[1];
            RevisionType revisionType = (RevisionType) row[2];
            content.add(toResponse(product, revision, revisionType));
        }

        long total = countProductRevisions(reader);
        return new PageImpl<>(content, pageable, total);
    }

    private long countProductRevisions(AuditReader reader) {
        Number count = (Number) reader.createQuery()
                .forRevisionsOfEntity(Product.class, false, true)
                .addProjection(AuditEntity.revisionNumber().count())
                .getSingleResult();
        return count.longValue();
    }

    private AuditEventResponse toResponse(Product product,
                                          InventoryRevisionEntity revision,
                                          RevisionType revisionType) {
        return new AuditEventResponse(
                (long) revision.getRev(),
                "Product",
                product.getId(),
                mapAction(revisionType),
                revision.getModifiedBy() != null ? revision.getModifiedBy() : "system",
                Instant.ofEpochMilli(revision.getTimestamp()),
                buildSummary(product, revisionType)
        );
    }

    private String mapAction(RevisionType revisionType) {
        return switch (revisionType) {
            case ADD -> "CREATE";
            case MOD -> "UPDATE";
            case DEL -> "DELETE";
        };
    }

    private String buildSummary(Product product, RevisionType revisionType) {
        return switch (revisionType) {
            case ADD -> "Product created: " + product.getSku();
            case MOD -> "Product updated: " + product.getSku() + " (qty=" + product.getQuantity() + ")";
            case DEL -> "Product removed: " + product.getSku();
        };
    }
}
