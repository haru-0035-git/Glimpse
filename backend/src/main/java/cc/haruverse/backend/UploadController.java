package cc.haruverse.backend;

import cc.haruverse.backend.entity.User;
import cc.haruverse.backend.repository.UserRepository;
import cc.haruverse.backend.service.ImageStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class UploadController {

    private final ImageStorageService imageStorageService;
    private final UserRepository userRepository;

    public UploadController(ImageStorageService imageStorageService, UserRepository userRepository) {
        this.imageStorageService = imageStorageService;
        this.userRepository = userRepository;
    }

    @PostMapping({"/api/upload", "/api/uploads/images"})
    public ResponseEntity<ImageUploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        ensureAdmin();
        String url = imageStorageService.store(file);
        return ResponseEntity.ok(new ImageUploadResponse(url));
    }

    private void ensureAdmin() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!user.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
    }

    public record ImageUploadResponse(String url) {
    }
}
