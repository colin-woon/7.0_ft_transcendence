package org.bumIntra.gateway.client.dto;

import java.util.List;

public record AuthResult(String sub, List<String> roles) {
}
