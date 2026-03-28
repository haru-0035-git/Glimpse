package cc.haruverse.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private final int maxFailures;
    private final long windowMs;
    private final long lockoutMs;
    private final Map<String, Deque<Long>> failures = new ConcurrentHashMap<>();

    public LoginAttemptService(
            @Value("${app.security.login.max-failures:5}") int maxFailures,
            @Value("${app.security.login.window-ms:900000}") long windowMs,
            @Value("${app.security.login.lockout-ms:900000}") long lockoutMs
    ) {
        this.maxFailures = maxFailures;
        this.windowMs = windowMs;
        this.lockoutMs = lockoutMs;
    }

    public boolean isBlocked(String username, String clientIp) {
        long now = System.currentTimeMillis();
        return isBlocked(keyForUser(username), now) || isBlocked(keyForIp(clientIp), now);
    }

    public void recordFailure(String username, String clientIp) {
        long now = System.currentTimeMillis();
        addFailure(keyForUser(username), now);
        addFailure(keyForIp(clientIp), now);
    }

    public void recordSuccess(String username, String clientIp) {
        failures.remove(keyForUser(username));
        failures.remove(keyForIp(clientIp));
    }

    private boolean isBlocked(String key, long now) {
        Deque<Long> queue = failures.get(key);
        if (queue == null) {
            return false;
        }

        synchronized (queue) {
            evictOldEntries(queue, now);
            if (queue.size() < maxFailures) {
                return false;
            }
            Long oldest = queue.peekFirst();
            if (oldest == null) {
                return false;
            }
            return now - oldest < lockoutMs;
        }
    }

    private void addFailure(String key, long now) {
        Deque<Long> queue = failures.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (queue) {
            evictOldEntries(queue, now);
            queue.addLast(now);
        }
    }

    private void evictOldEntries(Deque<Long> queue, long now) {
        while (!queue.isEmpty() && now - queue.peekFirst() > windowMs) {
            queue.removeFirst();
        }
    }

    private String keyForUser(String username) {
        return "user:" + normalize(username);
    }

    private String keyForIp(String clientIp) {
        return "ip:" + normalize(clientIp);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        return value.trim().toLowerCase();
    }
}
