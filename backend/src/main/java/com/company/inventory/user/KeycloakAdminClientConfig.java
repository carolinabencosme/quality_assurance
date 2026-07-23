package com.company.inventory.user;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeycloakAdminClientConfig {

    @Bean
    KeycloakAdminClientFactory keycloakAdminClientFactory(KeycloakAdminProperties properties) {
        return new KeycloakAdminClientFactory(properties);
    }

    public static class KeycloakAdminClientFactory {
        private final KeycloakAdminProperties properties;

        KeycloakAdminClientFactory(KeycloakAdminProperties properties) {
            this.properties = properties;
        }

        public boolean isConfigured() {
            return properties.isConfigured();
        }

        public String realm() {
            return properties.getRealm();
        }

        public Keycloak create() {
            return KeycloakBuilder.builder()
                    .serverUrl(properties.getServerUrl())
                    .realm(properties.getRealm())
                    .clientId(properties.getClientId())
                    .clientSecret(properties.getClientSecret())
                    .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
                    .build();
        }
    }
}
