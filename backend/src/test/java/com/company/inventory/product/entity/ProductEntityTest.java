package com.company.inventory.product.entity;

import org.hibernate.envers.Audited;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProductEntityTest {

    @Test
    void productIsAuditedForRfAud() {
        assertThat(Product.class.isAnnotationPresent(Audited.class)).isTrue();
    }

    @Test
    void deactivate_setsInactiveStatus() {
        Product product = new Product();
        product.setStatus(ProductStatus.ACTIVE);
        assertThat(product.isActive()).isTrue();

        product.deactivate();

        assertThat(product.getStatus()).isEqualTo(ProductStatus.INACTIVE);
        assertThat(product.isActive()).isFalse();
    }

    @Test
    void isCritical_whenQuantityAtOrBelowMinStock() {
        Product product = new Product();
        product.setQuantity(5);
        product.setMinStock(5);
        assertThat(product.isCritical()).isTrue();

        product.setQuantity(6);
        assertThat(product.isCritical()).isFalse();
    }
}
