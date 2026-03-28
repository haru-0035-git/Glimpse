package cc.haruverse.backend.config;

import cc.haruverse.backend.entity.User;
import cc.haruverse.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@Configuration
public class AdminInitializer implements CommandLineRunner {

    private static final Set<String> WEAK_DEFAULT_PASSWORDS = Set.of(
            "change_me",
            "password",
            "admin",
            "12345678"
    );

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:}")
    private String adminUsername;

    @Value("${app.admin.password:}")
    private String adminPassword;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (adminUsername == null || adminUsername.isBlank()
                || adminPassword == null || adminPassword.isBlank()) {
            return;
        }

        if (isWeakBootstrapCredential(adminUsername, adminPassword)) {
            throw new IllegalStateException("Refusing to bootstrap admin with weak default credentials.");
        }

        userRepository.findByUsername(adminUsername).orElseGet(() -> {
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setAdmin(true);
            return userRepository.save(admin);
        });
    }

    private boolean isWeakBootstrapCredential(String username, String password) {
        String normalizedPassword = password.trim().toLowerCase();
        if (password.length() < 12) {
            return true;
        }
        if ("admin".equalsIgnoreCase(username) && WEAK_DEFAULT_PASSWORDS.contains(normalizedPassword)) {
            return true;
        }
        return WEAK_DEFAULT_PASSWORDS.contains(normalizedPassword);
    }
}
