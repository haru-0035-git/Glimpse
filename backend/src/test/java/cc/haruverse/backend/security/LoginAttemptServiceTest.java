package cc.haruverse.backend.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoginAttemptServiceTest {

    @Test
    void blocksAfterConfiguredNumberOfFailures() {
        LoginAttemptService service = new LoginAttemptService(2, 60_000, 60_000);

        assertFalse(service.isBlocked("admin", "127.0.0.1"));
        service.recordFailure("admin", "127.0.0.1");
        assertFalse(service.isBlocked("admin", "127.0.0.1"));
        service.recordFailure("admin", "127.0.0.1");
        assertTrue(service.isBlocked("admin", "127.0.0.1"));
    }

    @Test
    void successClearsRecordedFailures() {
        LoginAttemptService service = new LoginAttemptService(2, 60_000, 60_000);

        service.recordFailure("admin", "127.0.0.1");
        service.recordFailure("admin", "127.0.0.1");
        assertTrue(service.isBlocked("admin", "127.0.0.1"));

        service.recordSuccess("admin", "127.0.0.1");

        assertFalse(service.isBlocked("admin", "127.0.0.1"));
    }
}
