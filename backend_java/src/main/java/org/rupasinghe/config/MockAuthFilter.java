package org.rupasinghe.config;

import org.springframework.stereotype.Component;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class MockAuthFilter implements Filter {

    public static final ThreadLocal<Map<String, String>> securityContext = new ThreadLocal<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        String path = req.getRequestURI();

        // Skip CORS pre-flight or unauthenticated routes like login
        if (req.getMethod().equals("OPTIONS") || path.startsWith("/auth")) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = req.getHeader("Authorization");
        Map<String, String> user = new HashMap<>();

        if (authHeader != null && authHeader.contains("java-mock-token-admin")) {
            user.put("id", "HQ-001");
            user.put("role", "ADMIN");
            user.put("branchId", "HQ");
        } else if (authHeader != null && authHeader.contains("java-mock-token-teller")) {
            user.put("id", "TELLER-002");
            user.put("role", "TELLER");
            // Assuming default branch for teller, or we could extract dynamically
            user.put("branchId", "KOT");
        } else {
            // Unauthorized fallback, but let's just populate a default for rapid prototyping
            // In a real scenario, we would throw a 401 error here.
            user.put("id", "UNKNOWN");
            user.put("role", "TELLER");
            user.put("branchId", "BRL");
        }

        securityContext.set(user);
        try {
            chain.doFilter(request, response);
        } finally {
            securityContext.remove();
        }
    }
}
