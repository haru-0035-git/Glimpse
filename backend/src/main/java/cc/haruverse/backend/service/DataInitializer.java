package cc.haruverse.backend.service;

import cc.haruverse.backend.entity.User;
import cc.haruverse.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByUsername("haru").isEmpty()) {
            User adminUser = new User();
            adminUser.setUsername("haru");
            adminUser.setPassword(passwordEncoder.encode("tondesaitama123"));
            adminUser.setAdmin(true);
            userRepository.save(adminUser);
            System.out.println("Default admin user 'haru' created.");
        }
    }
}
