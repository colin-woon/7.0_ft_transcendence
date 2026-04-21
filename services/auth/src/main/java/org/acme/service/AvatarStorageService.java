package org.acme.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;

import org.acme.dto.IntraInfoDTO;
import org.acme.dto.UserInfoDTO;
import org.acme.dto.UserSummaryDTO;
import org.acme.model.Intra;
import org.acme.model.User;
import org.acme.repository.UserRepository;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class AvatarStorageService {

    private static final Logger LOG = Logger.getLogger(AvatarStorageService.class);
    private static final Pattern SAFE_FILE_NAME = Pattern.compile("^[a-f0-9\\-]{36}\\.png$");
    private static final Pattern ALLOWED_DATA_URL_PREFIX = Pattern.compile("^data:image/(png|jpeg|jpg|webp|gif);base64,", Pattern.CASE_INSENSITIVE);
    private static final int MAX_IMAGE_WIDTH = 4096;
    private static final int MAX_IMAGE_HEIGHT = 4096;
    private static final long MAX_IMAGE_PIXELS = 16_000_000L;

    @ConfigProperty(name = "app.avatar.storage.path", defaultValue = "/var/lib/auth/avatars")
    String storagePathValue;

    @ConfigProperty(name = "app.avatar.max-bytes", defaultValue = "2097152")
    long maxAvatarBytes;

    @jakarta.inject.Inject
    UserRepository userRepository;

    private Path storagePath;

    @PostConstruct
    @SuppressWarnings("unused")
    void init() {
        try {
            storagePath = Path.of(storagePathValue).normalize();
            Files.createDirectories(storagePath);
            if (!Files.isWritable(storagePath)) {
                throw new IllegalStateException("Avatar storage path is not writable: " + storagePath);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to initialize avatar storage directory", e);
        }
    }

    public String storeBase64Avatar(String avatarFile, String currentAvatarPath) {
        if (avatarFile == null || avatarFile.isBlank()) {
            throw new WebApplicationException("Avatar file is required", 400);
        }

        validateEncodedPayloadSize(avatarFile);
        byte[] bytes = decodeBase64Avatar(avatarFile);
        validateFileSize(bytes.length);

        BufferedImage image = readImage(bytes);
        validateImageDimensions(image);
        String storedAvatarPath = writeAsPng(image);
        deleteIfManaged(currentAvatarPath);
        return storedAvatarPath;
    }

    public String mirrorRemoteAvatar(String remoteUrl, String currentAvatarPath) {
        if (remoteUrl == null || remoteUrl.isBlank()) {
            return null;
        }

        String trimmedUrl = remoteUrl.trim();
        if (isManagedPath(trimmedUrl)) {
            return trimmedUrl;
        }

        Path tempFile = null;
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .build();

            HttpRequest request = HttpRequest.newBuilder(URI.create(trimmedUrl))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            tempFile = Files.createTempFile("avatar-mirror-", ".tmp");
            HttpResponse<Path> response = client.send(request, HttpResponse.BodyHandlers.ofFile(tempFile));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                LOG.warnf("Avatar mirror skipped, HTTP %d for %s", response.statusCode(), trimmedUrl);
                return trimmedUrl;
            }

            validateFileSize(tempFile);
            BufferedImage image = readImage(tempFile);
            validateImageDimensions(image);
            String localPath = writeAsPng(image);
            deleteIfManaged(currentAvatarPath);
            return localPath;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            LOG.warnf("Avatar mirror interrupted for %s", trimmedUrl);
            return trimmedUrl;
        } catch (IOException | IllegalArgumentException | WebApplicationException e) {
            LOG.warnf("Avatar mirror failed for %s: %s", trimmedUrl, e.getMessage());
            return trimmedUrl;
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {
                    // Ignore temp file cleanup failures
                }
            }
        }
    }

    public String toImageDataUrl(String avatarPath) {
        if (!isManagedPath(avatarPath)) {
            return null;
        }

        Path filePath = storagePath.resolve(avatarPath).normalize();
        if (!filePath.startsWith(storagePath) || !Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return null;
        }

        try {
            byte[] bytes = Files.readAllBytes(filePath);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (IOException e) {
            LOG.warnf("Failed to read avatar file %s: %s", avatarPath, e.getMessage());
            return null;
        }
    }

    public void deleteManagedAvatar(String avatarPath) {
        deleteIfManaged(avatarPath);
    }

    public UserInfoDTO toUserInfoDTO(User user, IntraInfoDTO intraInfo) {
        UserInfoDTO dto = new UserInfoDTO(user, intraInfo);
        String managedImage = toImageDataUrl(user.avatarUrl);
        String fallbackRemote = extractIntraImageLink(intraInfo);
        dto.avatarImage = managedImage != null
            ? managedImage
            : firstNonBlank(user.avatarUrl, fallbackRemote);
        return dto;
    }

    public List<UserSummaryDTO> toUserSummaryDTOs(List<UserSummaryDTO> summaries) {
        Map<Long, String> fallbackByUserId = loadIntraFallbacksForSummaries(summaries);
        for (UserSummaryDTO summary : summaries) {
            String managedImage = toImageDataUrl(summary.avatarPath);
            String remoteFallback = fallbackByUserId.get(summary.id);
            summary.avatarImage = managedImage != null
                ? managedImage
                : firstNonBlank(summary.avatarPath, remoteFallback);
        }
        return summaries;
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }
        return null;
    }

    private String extractIntraImageLink(IntraInfoDTO intraInfo) {
        if (intraInfo == null || intraInfo.image == null) {
            return null;
        }
        String link = intraInfo.image.link;
        if (link == null || link.isBlank()) {
            return null;
        }
        return link;
    }

    private Map<Long, String> loadIntraFallbacksForSummaries(List<UserSummaryDTO> summaries) {
        if (summaries == null || summaries.isEmpty()) {
            return Map.of();
        }

        List<Long> unresolvedUserIds = summaries.stream()
            .filter(summary -> summary.avatarPath == null || summary.avatarPath.isBlank())
            .map(summary -> summary.id)
            .toList();

        if (unresolvedUserIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, String> fallbackByUserId = new HashMap<>();
        for (User user : userRepository.findByIdsWithIntra(unresolvedUserIds)) {
            Intra intra = user.intra;
            if (intra == null || intra.image == null) {
                continue;
            }
            String link = intra.image.link;
            if (link != null && !link.isBlank()) {
                fallbackByUserId.put(user.id, link);
            }
        }
        return fallbackByUserId;
    }

    private String writeAsPng(BufferedImage image) {
        String fileName = UUID.randomUUID() + ".png";
        Path targetPath = storagePath.resolve(fileName).normalize();
        if (!targetPath.startsWith(storagePath)) {
            throw new WebApplicationException("Invalid avatar path", 500);
        }

        Path tempPath = null;
        try {
            tempPath = Files.createTempFile(storagePath, "avatar-", ".png");
            boolean written = ImageIO.write(image, "png", tempPath.toFile());
            if (!written) {
                throw new WebApplicationException("Failed to encode avatar image", 400);
            }
            Files.move(tempPath, targetPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            return fileName;
        } catch (IOException e) {
            throw new WebApplicationException("Failed to store avatar", 500);
        } finally {
            if (tempPath != null) {
                try {
                    Files.deleteIfExists(tempPath);
                } catch (IOException ignored) {
                    // Ignore temp file cleanup failures
                }
            }
        }
    }

    private BufferedImage readImage(Path filePath) {
        try {
            BufferedImage image = ImageIO.read(filePath.toFile());
            if (image == null) {
                throw new WebApplicationException("Uploaded file is not a valid image", 400);
            }
            return image;
        } catch (IOException e) {
            throw new WebApplicationException("Failed to process avatar image", 400);
        }
    }

    private BufferedImage readImage(byte[] fileBytes) {
        try (ByteArrayInputStream input = new ByteArrayInputStream(fileBytes)) {
            BufferedImage image = ImageIO.read(input);
            if (image == null) {
                throw new WebApplicationException("Uploaded file is not a valid image", 400);
            }
            return image;
        } catch (IOException e) {
            throw new WebApplicationException("Failed to process avatar image", 400);
        }
    }

    private void validateFileSize(Path filePath) {
        try {
            long size = Files.size(filePath);
            validateFileSize(size);
        } catch (IOException e) {
            throw new WebApplicationException("Unable to read avatar file", 400);
        }
    }

    private void validateFileSize(long size) {
        if (size <= 0) {
            throw new WebApplicationException("Avatar file is empty", 400);
        }
        if (size > maxAvatarBytes) {
            throw new WebApplicationException("Avatar file exceeds maximum allowed size", 413);
        }
    }

    private byte[] decodeBase64Avatar(String avatarFile) {
        String trimmed = avatarFile.trim();
        String base64Content = trimmed;

        int commaIndex = trimmed.indexOf(',');
        if (commaIndex > -1) {
            if (!ALLOWED_DATA_URL_PREFIX.matcher(trimmed).find()) {
                throw new WebApplicationException("Avatar must be a base64-encoded image", 400);
            }
            base64Content = trimmed.substring(commaIndex + 1);
        }

        try {
            return Base64.getDecoder().decode(base64Content);
        } catch (IllegalArgumentException e) {
            throw new WebApplicationException("Avatar file is not valid base64 data", 400);
        }
    }

    private void validateEncodedPayloadSize(String avatarFile) {
        // Prevent very large request payloads from being fully decoded in memory.
        long approxDecodedBytes = (long) avatarFile.length() * 3 / 4;
        if (approxDecodedBytes > maxAvatarBytes + 1024) {
            throw new WebApplicationException("Avatar file exceeds maximum allowed size", 413);
        }
    }

    private void validateImageDimensions(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        long pixels = (long) width * height;

        if (width <= 0 || height <= 0) {
            throw new WebApplicationException("Avatar image dimensions are invalid", 400);
        }
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT || pixels > MAX_IMAGE_PIXELS) {
            throw new WebApplicationException("Avatar image dimensions are too large", 413);
        }
    }

    private void deleteIfManaged(String avatarPath) {
        if (!isManagedPath(avatarPath)) {
            return;
        }

        Path filePath = storagePath.resolve(avatarPath).normalize();
        if (!filePath.startsWith(storagePath)) {
            return;
        }

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            LOG.warnf("Failed to delete previous avatar %s", avatarPath);
        }
    }

    private boolean isManagedPath(String avatarPath) {
        if (avatarPath == null || avatarPath.isBlank()) {
            return false;
        }
        return SAFE_FILE_NAME.matcher(avatarPath).matches();
    }
}