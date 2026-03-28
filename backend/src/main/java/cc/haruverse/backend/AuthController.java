package cc.haruverse.backend;

import cc.haruverse.backend.entity.User;
import cc.haruverse.backend.model.AuthenticationRequest;
import cc.haruverse.backend.model.RegisterRequest;
import cc.haruverse.backend.model.UserInfoDto;
import cc.haruverse.backend.repository.UserRepository;
import cc.haruverse.backend.security.LoginAttemptService;
import cc.haruverse.backend.service.UserDetailsServiceImpl;
import cc.haruverse.backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Value("${app.auth.cookie-name:GLIMPSE_AUTH}")
    private String authCookieName;

    @Value("${app.auth.cookie-secure:true}")
    private boolean authCookieSecure;

    @Value("${app.auth.cookie-same-site:Lax}")
    private String authCookieSameSite;

    @PostMapping("/authenticate")
    public ResponseEntity<?> createAuthenticationToken(
            @RequestBody AuthenticationRequest authenticationRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String username = authenticationRequest.getUsername();
        String clientIp = extractClientIp(request);

        if (loginAttemptService.isBlocked(username, clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "Too many failed login attempts. Please try again later."));
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, authenticationRequest.getPassword())
            );
        } catch (BadCredentialsException e) {
            loginAttemptService.recordFailure(username, clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Incorrect username or password"));
        }

        loginAttemptService.recordSuccess(username, clientIp);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String jwt = jwtUtil.generateToken(userDetails);

        ResponseCookie authCookie = ResponseCookie.from(authCookieName, jwt)
                .httpOnly(true)
                .secure(authCookieSecure)
                .sameSite(authCookieSameSite)
                .path("/")
                .maxAge(Duration.ofMillis(jwtUtil.getExpirationMs()))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, authCookie.toString());

        return ResponseEntity.ok(Map.of("message", "Authenticated"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie clearCookie = ResponseCookie.from(authCookieName, "")
                .httpOnly(true)
                .secure(authCookieSecure)
                .sameSite(authCookieSameSite)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Registration is disabled for this site."));
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoDto> me() {
        User user = getCurrentUser();
        return ResponseEntity.ok(new UserInfoDto(user));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        User currentUser = getCurrentUser();
        if (!currentUser.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserInfoDto> users = userRepository.findAll()
                .stream()
                .map(UserInfoDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        User currentUser = getCurrentUser();
        if (!currentUser.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (currentUser.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Administrators cannot delete themselves."));
        }

        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    return ResponseEntity.noContent().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return request.getRemoteAddr();
        }
        return forwardedFor.split(",")[0].trim();
    }
}
