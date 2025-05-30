package org.example.controller;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.model.User;
import org.example.service.UserService;
import org.example.view.JsonResponseWriter;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class UserController {
    private final UserService userService;
    private final Gson gson;
    private final JsonResponseWriter responseWriter;

    public UserController(UserService userService) {
        this.userService = userService;
        this.gson = new Gson();
        this.responseWriter = new JsonResponseWriter();
    }

    public HttpHandler handleRegister() {
        return exchange -> {
            if (!"POST".equals(exchange.getRequestMethod())) {
                responseWriter.writeError(exchange, 405, "Method not allowed");
                return;
            }

            try {
                String requestBody = readRequestBody(exchange);
                System.out.println("Received registration request: " + requestBody);

                exchange.getResponseHeaders().set("Content-Type", "application/json");

                User newUser = gson.fromJson(requestBody, User.class);

                // Validate required fields
                if (newUser == null ||
                    isEmpty(newUser.getName()) ||
                    isEmpty(newUser.getEmail()) ||
                    isEmpty(newUser.getPassword()) ||
                    isEmpty(newUser.getRole()) ||
                    isEmpty(newUser.getAddress()) ||
                    isEmpty(newUser.getPhoneNumber())) {
                    responseWriter.writeError(exchange, 400, "All fields are required: name, email, password, role, address, and phone number");
                    return;
                }

                // Validate email format
                if (!isValidEmail(newUser.getEmail())) {
                    responseWriter.writeError(exchange, 400, "Invalid email format");
                    return;
                }

                // Validate phone number format (assuming basic format)
                if (!isValidPhoneNumber(newUser.getPhoneNumber())) {
                    responseWriter.writeError(exchange, 400, "Invalid phone number format");
                    return;
                }

                // Check if user exists
                if (userService.findUserByEmail(newUser.getEmail()) != null) {
                    responseWriter.writeError(exchange, 409, "User with this email already exists");
                    return;
                }

                userService.saveUser(newUser);
                responseWriter.writeSuccess(exchange, "User registered successfully");

            } catch (Exception e) {
                System.err.println("Error in registration: " + e.getMessage());
                e.printStackTrace();
                responseWriter.writeError(exchange, 500, "Error registering user: " + e.getMessage());
            }
        };
    }

    public HttpHandler handleGetUser() {
        return new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if (!"GET".equals(exchange.getRequestMethod())) {
                    responseWriter.writeError(exchange, 405, "Method not allowed");
                    return;
                }

                String query = exchange.getRequestURI().getQuery();
                if (query == null || !query.startsWith("email=")) {
                    responseWriter.writeError(exchange, 400, "Invalid request: email parameter is required");
                    return;
                }

                String email = query.substring(6); // after "email="
                User user = userService.findUserByEmail(email);

                if (user != null) {
                    responseWriter.writeJson(exchange, user);
                } else {
                    responseWriter.writeError(exchange, 404, "User not found");
                }
            }
        };
    }

    public HttpHandler handleLogin() {
        return new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if (!"POST".equals(exchange.getRequestMethod())) {
                    responseWriter.writeError(exchange, 405, "Method not allowed");
                    return;
                }

                try {
                    // Read the request body
                    String requestBody = readRequestBody(exchange);
                    LoginRequest loginRequest = gson.fromJson(requestBody, LoginRequest.class);

                    // Authenticate user
                    User user = userService.authenticateUser(loginRequest.getEmail(), loginRequest.getPassword());

                    if (user != null) {
                        // Login successful - Create a proper response with the user object
                        Map<String, Object> responseData = new HashMap<>();
                        responseData.put("success", true);
                        responseData.put("message", "Login successful");
                        responseData.put("id", user.getId());
                        responseData.put("name", user.getName());
                        responseData.put("email", user.getEmail());
                        responseData.put("role", user.getRole());
                        responseData.put("user", user); // Include the full user object

                        // Add CORS headers to response
                        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");

                        // Write the complete response
                        responseWriter.writeJson(exchange, responseData);
                    } else {
                        // Login failed
                        responseWriter.writeError(exchange, 401, "Invalid email or password");
                    }
                } catch (Exception e) {
                    responseWriter.writeError(exchange, 500, "Internal server error: " + e.getMessage());
                }
            }
        };
    }

    private String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream input = exchange.getRequestBody()) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] data = new byte[1024];
            int nRead;
            while ((nRead = input.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, nRead);
            }
            return new String(buffer.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    private boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }

    private boolean isValidPhoneNumber(String phone) {
        return phone != null && phone.matches("^\\+?[0-9()-]{10,15}$");
    }

    private static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public String getPassword() { return password; }
    }

    private static class LoginResponse {
        private final boolean success;
        private final String message;
        private final Long userId;
        private final String email;
        private final String role;

        public LoginResponse(boolean success, String message, Long userId, String email, String role) {
            this.success = success;
            this.message = message;
            this.userId = userId;
            this.email = email;
            this.role = role;
        }
    }
}

