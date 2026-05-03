package cc.haruverse.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Map<String, Set<String>> ALLOWED_CONTENT_TYPES = Map.of(
            "jpg", Set.of("image/jpeg"),
            "jpeg", Set.of("image/jpeg"),
            "png", Set.of("image/png"),
            "webp", Set.of("image/webp")
    );

    private final Path uploadRoot;
    private final String publicPath;
    private final long maxFileSizeBytes;

    public ImageStorageService(
            @Value("${app.upload.dir:uploads}") String uploadDir,
            @Value("${app.upload.public-path:/uploads}") String publicPath,
            @Value("${app.upload.max-file-size-bytes:5242880}") long maxFileSizeBytes
    ) {
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        this.publicPath = normalizePublicPath(publicPath);
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    @PostConstruct
    public void initializeStorage() {
        try {
            Files.createDirectories(uploadRoot.resolve("articles"));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to initialize upload directory", e);
        }
    }

    public String store(MultipartFile file) {
        validateFile(file);

        String extension = getExtension(file);
        String filename = UUID.randomUUID() + "." + extension;
        Path destination = uploadRoot.resolve("articles").resolve(filename).normalize();

        if (!destination.startsWith(uploadRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid upload path");
        }

        try {
            file.transferTo(destination);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store image");
        }

        return publicPath + "/articles/" + filename;
    }

    public Path getUploadRoot() {
        return uploadRoot;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file is required");
        }

        if (file.getSize() > maxFileSizeBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image file is too large");
        }

        String extension = getExtension(file);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image extension");
        }

        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType)
                || !ALLOWED_CONTENT_TYPES.get(extension).contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image content type");
        }

        if (!hasAllowedImageSignature(file, extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image file");
        }
    }

    private String getExtension(MultipartFile file) {
        String filename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < filename.length() - 1) {
            return filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        }

        return extensionFromContentType(file.getContentType());
    }

    private String extensionFromContentType(String contentType) {
        if (contentType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image extension is required");
        }

        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image extension is required");
        };
    }

    private boolean hasAllowedImageSignature(MultipartFile file, String extension) {
        try {
            byte[] header = file.getInputStream().readNBytes(12);
            return switch (extension) {
                case "jpg", "jpeg" -> header.length >= 3
                        && (header[0] & 0xFF) == 0xFF
                        && (header[1] & 0xFF) == 0xD8
                        && (header[2] & 0xFF) == 0xFF;
                case "png" -> header.length >= 8
                        && (header[0] & 0xFF) == 0x89
                        && header[1] == 0x50
                        && header[2] == 0x4E
                        && header[3] == 0x47
                        && header[4] == 0x0D
                        && header[5] == 0x0A
                        && header[6] == 0x1A
                        && header[7] == 0x0A;
                case "webp" -> header.length >= 12
                        && header[0] == 0x52
                        && header[1] == 0x49
                        && header[2] == 0x46
                        && header[3] == 0x46
                        && header[8] == 0x57
                        && header[9] == 0x45
                        && header[10] == 0x42
                        && header[11] == 0x50;
                default -> false;
            };
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read image file");
        }
    }

    private String normalizePublicPath(String rawPublicPath) {
        String normalized = rawPublicPath == null || rawPublicPath.isBlank() ? "/uploads" : rawPublicPath.trim();
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }
}
