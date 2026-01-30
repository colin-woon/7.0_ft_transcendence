package org.bumIntra.gateway.test;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;

@Path("__test/headers")
@Produces(MediaType.APPLICATION_JSON)
public class TestHeadersResource {

	@GET
	public Response headers(@Context HttpHeaders headers) {
		MultivaluedMap<String, String> headerMap = headers.getRequestHeaders();

		Map<String, List<String>> result = new TreeMap<>();
		for (var e : headerMap.entrySet()) {
			result.put(e.getKey().toLowerCase(Locale.ROOT),
					e.getValue() == null ? List.of() : new ArrayList<>(e.getValue()));
		}

		return Response.ok(result).build();
	}
}
