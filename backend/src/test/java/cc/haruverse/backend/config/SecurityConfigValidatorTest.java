package cc.haruverse.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SecurityConfigValidatorTest {

    @Test
    void missingSecretIsRejected() {
        SecurityConfigValidator validator = new SecurityConfigValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "");

        assertThrows(IllegalStateException.class, () -> validator.run());
    }

    @Test
    void weakSecretIsRejected() {
        SecurityConfigValidator validator = new SecurityConfigValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "short-secret");

        assertThrows(IllegalStateException.class, () -> validator.run());
    }

    @Test
    void strongSecretPasses() {
        SecurityConfigValidator validator = new SecurityConfigValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "0123456789abcdef0123456789abcdef");

        assertDoesNotThrow(() -> validator.run());
    }
}
