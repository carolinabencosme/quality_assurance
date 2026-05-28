package com.company.inventory.audit;

import org.hibernate.envers.RevisionListener;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public class InventoryRevisionListener implements RevisionListener {

    @Override
    public void newRevision(Object revisionEntity) {
        InventoryRevisionEntity revision = (InventoryRevisionEntity) revisionEntity;
        revision.setModifiedBy(resolveCurrentUser());
    }

    private String resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "system";
        }
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String preferred = jwt.getClaimAsString("preferred_username");
            if (preferred != null && !preferred.isBlank()) {
                return preferred;
            }
            return jwt.getSubject();
        }
        return authentication.getName();
    }
}
