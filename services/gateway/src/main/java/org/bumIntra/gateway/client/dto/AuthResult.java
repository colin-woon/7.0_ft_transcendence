package org.bumIntra.gateway.client.dto;

import java.util.List;
import java.util.Set;

// TODO: This is now deprecated
public record AuthResult(String sub, Set<String> roles) {
}
