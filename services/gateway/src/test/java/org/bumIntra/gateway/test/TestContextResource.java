package org.bumIntra.gateway.test;

import java.util.LinkedHashMap;
import java.util.Map;

import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/__test/ctx")
@Produces(MediaType.APPLICATION_JSON)
public class TestContextResource {

	@Inject
	GatewayRequestContext ctx;

	@GET
	public Map<String, Object> get() {
		Map<String, Object> out = new LinkedHashMap<>();
		out.put("requestId", ctx.getRequestId());
		out.put("authLevel", String.valueOf(ctx.getAuthLevel()));
		out.put("userId", ctx.getUserId()); // null for GUEST
		out.put("roles", ctx.getRoles()); // null/empty for GUEST
		out.put("auth", ctx.getAuth()); // opaque token if present
		return out;
	}
}
