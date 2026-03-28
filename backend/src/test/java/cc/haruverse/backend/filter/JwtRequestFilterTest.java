package cc.haruverse.backend.filter;

import cc.haruverse.backend.service.UserDetailsServiceImpl;
import cc.haruverse.backend.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtRequestFilterTest {

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    @Mock
    private JwtUtil jwtUtil;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void invalidTokenDoesNotAuthenticateAndContinues() throws Exception {
        JwtRequestFilter filter = buildFilter();
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        request.addHeader("Authorization", "Bearer invalid.token");

        when(jwtUtil.extractUsername("invalid.token")).thenThrow(new RuntimeException("bad token"));

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertNotNull(chain.getRequest());
    }

    @Test
    void cookieTokenAuthenticatesUser() throws Exception {
        JwtRequestFilter filter = buildFilter();
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        request.setCookies(new Cookie("GLIMPSE_AUTH", "signed.jwt"));

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "admin",
                "encoded",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        when(jwtUtil.extractUsername("signed.jwt")).thenReturn("admin");
        when(userDetailsService.loadUserByUsername("admin")).thenReturn(userDetails);
        when(jwtUtil.validateToken("signed.jwt", userDetails)).thenReturn(true);

        filter.doFilter(request, response, chain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("admin", SecurityContextHolder.getContext().getAuthentication().getName());
        verify(userDetailsService).loadUserByUsername("admin");
    }

    private JwtRequestFilter buildFilter() {
        JwtRequestFilter filter = new JwtRequestFilter();
        ReflectionTestUtils.setField(filter, "userDetailsService", userDetailsService);
        ReflectionTestUtils.setField(filter, "jwtUtil", jwtUtil);
        ReflectionTestUtils.setField(filter, "authCookieName", "GLIMPSE_AUTH");
        return filter;
    }
}
