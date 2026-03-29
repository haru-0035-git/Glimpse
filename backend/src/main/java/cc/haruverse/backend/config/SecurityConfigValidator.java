package cc.haruverse.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SecurityConfigValidator implements CommandLineRunner {

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Override
    public void run(String... args) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("JWT secret must be configured.");
        }

        if (jwtSecret.length() < 32 || "change_me".equalsIgnoreCase(jwtSecret.trim())) {
            throw new IllegalStateException("JWT secret is too weak. Use at least 32 characters.");
        }
    }
}
