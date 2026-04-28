package org.bumIntra.gateway.config;

import java.util.Comparator;
import java.util.Map;

import io.quarkus.runtime.annotations.StaticInitSafe;
import io.quarkus.runtime.configuration.MemorySize;
import io.smallrye.config.ConfigMapping;

@StaticInitSafe
@ConfigMapping(prefix = "gateway.config.body")
public interface GatewayRequestBodyConfig {
    // .path-max-size."/api/chat/message"=5kb

    Map<String, MemorySize> pathMaxSize();

    default MemorySize getMaxSizeForPath(String path) {
        String normalizedPath = normalizePath(path);
        if (normalizedPath == null) {
            return null;
        }

        return pathMaxSize().entrySet().stream()
                .map(entry -> Map.entry(normalizePath(entry.getKey()), entry.getValue()))
                .filter(entry -> entry.getKey() != null && normalizedPath.startsWith(entry.getKey()))
                .max(Comparator.comparingInt(entry -> entry.getKey().length()))
                .map(Map.Entry::getValue)
                .orElse(null);
    }

    private static String normalizePath(String path) {
        if (path == null || path.isBlank()) {
            return null;
        }

        String p = path.trim().toLowerCase().replaceAll("/+", "/");

        if (!p.startsWith("/")) {
            p = "/" + p;
        }

        if (p.length() > 1 && p.endsWith("/")) {
            p = p.substring(0, p.length() - 1);
        }

        return p;
    }
}
