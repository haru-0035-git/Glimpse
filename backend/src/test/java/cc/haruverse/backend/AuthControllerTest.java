package cc.haruverse.backend;

import cc.haruverse.backend.entity.User;
import cc.haruverse.backend.model.AuthenticationRequest;
import cc.haruverse.backend.repository.UserRepository;
import cc.haruverse.backend.security.LoginAttemptService;
import cc.haruverse.backend.service.UserDetailsServiceImpl;
import cc.haruverse.backend.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoginAttemptService loginAttemptService;

    @Mock
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        AuthController controller = new AuthController();
        ReflectionTestUtils.setField(controller, "authenticationManager", authenticationManager);
        ReflectionTestUtils.setField(controller, "userDetailsService", userDetailsService);
        ReflectionTestUtils.setField(controller, "jwtUtil", jwtUtil);
        ReflectionTestUtils.setField(controller, "userRepository", userRepository);
        ReflectionTestUtils.setField(controller, "loginAttemptService", loginAttemptService);
        ReflectionTestUtils.setField(controller, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(controller, "authCookieName", "GLIMPSE_AUTH");
        ReflectionTestUtils.setField(controller, "authCookieSecure", false);
        ReflectionTestUtils.setField(controller, "authCookieSameSite", "Lax");
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticateSetsHttpOnlyCookieOnSuccess() throws Exception {
        AuthenticationRequest request = new AuthenticationRequest();
        request.setUsername("admin");
        request.setPassword("secret");

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "admin",
                "secret",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        when(loginAttemptService.isBlocked("admin", "127.0.0.1")).thenReturn(false);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(org.mockito.Mockito.mock(Authentication.class));
        when(userDetailsService.loadUserByUsername("admin")).thenReturn(userDetails);
        when(jwtUtil.generateToken(userDetails)).thenReturn("signed.jwt.token");
        when(jwtUtil.getExpirationMs()).thenReturn(900_000L);

        mockMvc.perform(post("/api/authenticate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("ログインしました。"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("GLIMPSE_AUTH=signed.jwt.token")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("SameSite=Lax")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=900")));

        verify(loginAttemptService).recordSuccess("admin", "127.0.0.1");
    }

    @Test
    void authenticateReturnsTooManyRequestsWhenBlocked() throws Exception {
        AuthenticationRequest request = new AuthenticationRequest();
        request.setUsername("admin");
        request.setPassword("secret");

        when(loginAttemptService.isBlocked("admin", "127.0.0.1")).thenReturn(true);

        mockMvc.perform(post("/api/authenticate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("ログイン失敗が続いたため一時的に制限されています。しばらく待ってから再試行してください。"));

        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void authenticateReturnsUnauthorizedAndRecordsFailure() throws Exception {
        AuthenticationRequest request = new AuthenticationRequest();
        request.setUsername("admin");
        request.setPassword("wrong");

        when(loginAttemptService.isBlocked("admin", "127.0.0.1")).thenReturn(false);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("bad credentials"));

        mockMvc.perform(post("/api/authenticate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("ユーザー名またはパスワードが正しくありません。"));

        verify(loginAttemptService).recordFailure("admin", "127.0.0.1");
    }

    @Test
    void logoutClearsCookie() throws Exception {
        mockMvc.perform(post("/api/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("ログアウトしました。"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("GLIMPSE_AUTH=")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=0")));
    }

    @Test
    void meReturnsCurrentUser() throws Exception {
        User user = new User();
        UUID id = UUID.randomUUID();
        user.setId(id);
        user.setUsername("admin");
        user.setAdmin(true);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", null, List.of())
        );

        mockMvc.perform(get("/api/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.admin").value(true));
    }

    @Test
    void deleteUserRejectsSelfDeletion() throws Exception {
        User user = new User();
        UUID id = UUID.randomUUID();
        user.setId(id);
        user.setUsername("admin");
        user.setAdmin(true);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", null, List.of())
        );

        mockMvc.perform(delete("/api/users/{id}", id))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("自分自身のアカウントは削除できません。"));

        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void createUserCreatesNonAdminUserForAdmin() throws Exception {
        User admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setUsername("admin");
        admin.setAdmin(true);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findByUsername("member")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("member-password-2026")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", null, List.of())
        );

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"member\",\"password\":\"member-password-2026\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("member"))
                .andExpect(jsonPath("$.admin").value(false));

        verify(passwordEncoder).encode("member-password-2026");
        verify(userRepository).save(org.mockito.ArgumentMatchers.argThat(user ->
                "member".equals(user.getUsername()) && !user.isAdmin()
        ));
    }

    @Test
    void createUserRejectsDuplicateUsername() throws Exception {
        User admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setUsername("admin");
        admin.setAdmin(true);

        User existing = new User();
        existing.setId(UUID.randomUUID());
        existing.setUsername("member");
        existing.setAdmin(false);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findByUsername("member")).thenReturn(Optional.of(existing));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", null, List.of())
        );

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"member\",\"password\":\"member-password-2026\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("同じユーザー名が既に存在します。"));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changeUserPasswordUpdatesSelectedUserForAdmin() throws Exception {
        User admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setUsername("admin");
        admin.setAdmin(true);

        User target = new User();
        UUID targetId = UUID.randomUUID();
        target.setId(targetId);
        target.setUsername("member");
        target.setAdmin(false);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));
        when(passwordEncoder.encode("new-strong-password")).thenReturn("encoded-password");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", null, List.of())
        );

        mockMvc.perform(put("/api/users/{id}/password", targetId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"new-strong-password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("パスワードを変更しました。"));

        org.junit.jupiter.api.Assertions.assertEquals("encoded-password", target.getPassword());
        verify(userRepository).save(target);
        verify(passwordEncoder).encode(eq("new-strong-password"));
    }

    @Test
    void changeUserPasswordRejectsShortPassword() throws Exception {
        User admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setUsername("admin");
        admin.setAdmin(true);

        UUID targetId = UUID.randomUUID();
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", null, List.of())
        );

        mockMvc.perform(put("/api/users/{id}/password", targetId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("パスワードは12文字以上100文字以下で入力してください。"));

        verify(userRepository, never()).findById(targetId);
        verify(userRepository, never()).save(any(User.class));
    }
}
