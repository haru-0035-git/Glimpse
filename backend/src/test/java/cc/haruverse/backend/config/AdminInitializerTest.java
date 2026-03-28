package cc.haruverse.backend.config;

import cc.haruverse.backend.entity.User;
import cc.haruverse.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void weakDefaultCredentialsAreRejected() {
        AdminInitializer initializer = new AdminInitializer(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(initializer, "adminUsername", "admin");
        ReflectionTestUtils.setField(initializer, "adminPassword", "change_me");

        assertThrows(IllegalStateException.class, () -> initializer.run());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void strongCredentialsCreateAdminIfMissing() {
        AdminInitializer initializer = new AdminInitializer(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(initializer, "adminUsername", "admin");
        ReflectionTestUtils.setField(initializer, "adminPassword", "StrongPassword2026!");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("StrongPassword2026!")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> initializer.run());
        verify(userRepository).save(any(User.class));
    }
}
