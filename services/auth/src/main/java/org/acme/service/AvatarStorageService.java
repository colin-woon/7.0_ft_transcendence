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
import java.util.stream.Collectors;

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
import net.coobird.thumbnailator.Thumbnails;

@ApplicationScoped
public class AvatarStorageService {

    private static final Logger LOG = Logger.getLogger(AvatarStorageService.class);
    private static final Pattern SAFE_FILE_NAME = Pattern.compile("^[a-f0-9\\-]{36}(?:_thumbnail)?\\.png$");
    private static final Pattern ALLOWED_DATA_URL_PREFIX = Pattern.compile("^data:image/(png|jpeg|jpg|webp|gif);base64,", Pattern.CASE_INSENSITIVE);
    private static final int MAX_IMAGE_WIDTH = 40960;
    private static final int MAX_IMAGE_HEIGHT = 40960;
    private static final long MAX_IMAGE_PIXELS = 16_000_000_000L;
    private static final int THUMBNAIL_WIDTH = 150;
    private static final float THUMBNAIL_QUALITY = 0.8f;
    private static final String THUMBNAIL_SUFFIX = "_thumbnail";

    @ConfigProperty(name = "app.avatar.storage.path", defaultValue = "/var/lib/auth/avatars")
    String storagePathValue;

    @ConfigProperty(name = "app.avatar.max-bytes", defaultValue = "1048576")
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
        String storedAvatarPath = writeAvatarVariants(image);
        deleteManagedVariants(currentAvatarPath);
        return storedAvatarPath;
    }

    /**
     * Replaces the current managed avatar with the supplied payload, or clears the avatar when the
     * payload is blank.
     *
     * @param avatarFile the raw base64 avatar payload
     * @param currentAvatarPath the currently stored managed avatar path, if any
     * @return the new managed avatar path, or {@code null} when the avatar was cleared
     */
    public String replaceManagedAvatar(String avatarFile, String currentAvatarPath) {
        if (avatarFile == null || avatarFile.isBlank()) {
            deleteManagedVariants(currentAvatarPath);
            return null;
        }

        return storeBase64Avatar(avatarFile.trim(), currentAvatarPath);
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
            String localPath = writeAvatarVariants(image);
            deleteManagedVariants(currentAvatarPath);
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
        Path filePath = resolveManagedAvatarPath(avatarPath, false);
        if (filePath == null) {
            return null;
        }
        return readImageDataUrl(filePath);
    }

    public String toThumbnailImageDataUrl(String avatarPath) {
        Path filePath = resolveManagedAvatarPath(avatarPath, true);
        if (filePath == null) {
            return null;
        }
        return readImageDataUrl(filePath);
    }

    public void deleteManagedAvatar(String avatarPath) {
        deleteManagedVariants(avatarPath);
    }

    public UserInfoDTO toUserInfoDTO(User user, IntraInfoDTO intraInfo) {
        UserInfoDTO dto = new UserInfoDTO(user, intraInfo);
        String managedImage = toImageDataUrl(user.avatarUrl);
        String fallbackRemote = extractIntraImageLink(user);
        dto.avatarImage = managedImage != null
            ? managedImage
            : firstNonBlank(user.avatarUrl, fallbackRemote);
        return dto;
    }

    public List<UserSummaryDTO> toUserSummaryDTOs(List<UserSummaryDTO> summaries) {
        if (summaries == null || summaries.isEmpty()) {
            return summaries;
        }

        List<Long> userIds = summaries.stream().map(s -> s.id).toList();
        List<User> users = userRepository.findByIdsWithIntra(userIds);
        Map<Long, User> userMap = users.stream().collect(Collectors.toMap(u -> u.id, u -> u));

        Map<Long, String> fallbackByUserId = loadIntraFallbacksForSummaries(summaries);
        for (UserSummaryDTO summary : summaries) {
            User user = userMap.get(summary.id);
            if (user != null && user.avatarUrl != null) {
                summary.avatarPath = user.avatarUrl;
            }
            String managedImage = toThumbnailImageDataUrl(summary.avatarPath);
            if (managedImage == null) {
                managedImage = toImageDataUrl(summary.avatarPath);
            }
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

    private String extractIntraImageLink(User user) {
        if (user == null || user.intra == null) {
            return null;
        }
        Intra intra = user.intra;
        return intra.originalImageUrl == null || intra.originalImageUrl.isBlank()
            ? null
            : intra.originalImageUrl;
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
            if (intra == null) {
                continue;
            }
            String link = intra.originalImageUrl;
            if (link != null && !link.isBlank()) {
                fallbackByUserId.put(user.id, link);
            }
        }
        return fallbackByUserId;
    }

    private String writeAvatarVariants(BufferedImage image) {
        String fileName = UUID.randomUUID() + ".png";
        String thumbnailFileName = thumbnailFileName(fileName);
        Path targetPath = storagePath.resolve(fileName).normalize();
        Path thumbnailTargetPath = storagePath.resolve(thumbnailFileName).normalize();
        if (!targetPath.startsWith(storagePath)) {
            throw new WebApplicationException("Invalid avatar path", 500);
        }
        if (!thumbnailTargetPath.startsWith(storagePath)) {
            throw new WebApplicationException("Invalid avatar thumbnail path", 500);
        }

        Path tempPath = null;
        Path thumbnailTempPath = null;
        try {
            tempPath = Files.createTempFile(storagePath, "avatar-", ".png");
            thumbnailTempPath = Files.createTempFile(storagePath, "avatar-thumb-", ".png");
            boolean written = ImageIO.write(image, "png", tempPath.toFile());
            if (!written) {
                throw new WebApplicationException("Failed to encode avatar image", 400);
            }
            Thumbnails.of(image)
                .size(THUMBNAIL_WIDTH, THUMBNAIL_WIDTH)
                .keepAspectRatio(true)
                .outputQuality(THUMBNAIL_QUALITY)
                .outputFormat("png")
                .toFile(thumbnailTempPath.toFile());
            Files.move(tempPath, targetPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            Files.move(thumbnailTempPath, thumbnailTargetPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
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
            if (thumbnailTempPath != null) {
                try {
                    Files.deleteIfExists(thumbnailTempPath);
                } catch (IOException ignored) {
                    // Ignore temp file cleanup failures
                }
            }
        }
    }

    private String thumbnailFileName(String avatarFileName) {
        int extensionIndex = avatarFileName.lastIndexOf('.');
        if (extensionIndex < 0) {
            return avatarFileName + THUMBNAIL_SUFFIX;
        }
        return avatarFileName.substring(0, extensionIndex) + THUMBNAIL_SUFFIX + avatarFileName.substring(extensionIndex);
    }

    private Path resolveManagedAvatarPath(String avatarPath, boolean thumbnail) {
        if (!isManagedPath(avatarPath)) {
            return null;
        }

        String fileName = baseAvatarFileName(Path.of(avatarPath).getFileName().toString());
        String resolvedFileName = thumbnail ? thumbnailFileName(fileName) : fileName;
        Path filePath = storagePath.resolve(resolvedFileName).normalize();
        if (!filePath.startsWith(storagePath) || !Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return null;
        }
        return filePath;
    }

    private String readImageDataUrl(Path filePath) {
        try {
            byte[] bytes = Files.readAllBytes(filePath);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (IOException e) {
            LOG.warnf("Failed to read avatar file %s: %s", filePath.getFileName(), e.getMessage());
            return null;
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

    private void deleteManagedVariants(String avatarPath) {
        if (!isManagedPath(avatarPath)) {
            return;
        }

        String fileName = baseAvatarFileName(Path.of(avatarPath).getFileName().toString());
        deleteManagedFile(fileName);
        deleteManagedFile(thumbnailFileName(fileName));
    }

    private void deleteManagedFile(String fileName) {
        Path filePath = storagePath.resolve(fileName).normalize();
        if (!filePath.startsWith(storagePath)) {
            return;
        }

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            LOG.warnf("Failed to delete previous avatar %s", fileName);
        }
    }

    private boolean isManagedPath(String avatarPath) {
        if (avatarPath == null || avatarPath.isBlank()) {
            return false;
        }
        return SAFE_FILE_NAME.matcher(avatarPath).matches();
    }

    private String baseAvatarFileName(String avatarFileName) {
        int extensionIndex = avatarFileName.lastIndexOf('.');
        if (extensionIndex < 0) {
            return avatarFileName;
        }

        String baseName = avatarFileName.substring(0, extensionIndex);
        if (baseName.endsWith(THUMBNAIL_SUFFIX)) {
            baseName = baseName.substring(0, baseName.length() - THUMBNAIL_SUFFIX.length());
        }
        return baseName + avatarFileName.substring(extensionIndex);
    }
}