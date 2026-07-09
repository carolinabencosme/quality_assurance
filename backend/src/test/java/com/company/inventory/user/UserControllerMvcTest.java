package com.company.inventory.user;

import com.company.inventory.common.exception.GlobalExceptionHandler;
import com.company.inventory.observability.CorrelationIdFilter;
import com.company.inventory.security.MethodSecurityConfig;
import com.company.inventory.security.Permission;
import com.company.inventory.security.SecurityConfig;
import com.company.inventory.user.dto.KeycloakUserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class)
@Import({
        SecurityConfig.class,
        MethodSecurityConfig.class,
        GlobalExceptionHandler.class,
        CorrelationIdFilter.class
})
class UserControllerMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtDecoder jwtDecoder;

    @MockBean
    private UserService userService;

    @Test
    void listUsers_withUserManage_returns200() throws Exception {
        when(userService.listUsers(null, null, null)).thenReturn(List.of(sampleUser()));

        mockMvc.perform(get("/api/v1/users")
                        .with(jwt().authorities(new SimpleGrantedAuthority(Permission.USER_MANAGE))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[0].roles[0]").value("inventory-admin"));
    }

    @Test
    void listUsers_withoutUserManage_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .with(jwt().authorities(new SimpleGrantedAuthority(Permission.REPORT_VIEW))))
                .andExpect(status().isForbidden());
    }

    @Test
    void setRoles_withScopeAlias_returns200() throws Exception {
        when(userService.setRealmRoles(eq("user-1"), anySet())).thenReturn(sampleUser());

        mockMvc.perform(put("/api/v1/users/user-1/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roles\":[\"inventory-admin\"]}")
                        .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_" + Permission.USER_MANAGE))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-1"));
    }

    private static KeycloakUserResponse sampleUser() {
        return new KeycloakUserResponse(
                "user-1",
                "admin",
                "admin@inventory.local",
                "Admin",
                "Inventory",
                true,
                Set.of("inventory-admin")
        );
    }
}
