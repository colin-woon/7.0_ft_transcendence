package com.example.api;

import java.util.List;

public record AuthResult(String sub, List<String> roles) {
}
