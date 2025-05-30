package org.example.view;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class JsonResponseWriter {
    private final Gson gson;

    public JsonResponseWriter() {
        this.gson = new Gson();
    }

    private void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With");
        exchange.getResponseHeaders().set("Access-Control-Allow-Credentials", "true");
    }

    public void writeJson(HttpExchange exchange, Object data) throws IOException {
        String response = gson.toJson(data);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        addCorsHeaders(exchange);
        exchange.sendResponseHeaders(200, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }

    public void writeSuccess(HttpExchange exchange, String message) throws IOException {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);

        String jsonResponse = gson.toJson(response);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        addCorsHeaders(exchange);
        exchange.sendResponseHeaders(200, jsonResponse.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(jsonResponse.getBytes());
        }
    }

    public void writeError(HttpExchange exchange, int statusCode, String message) throws IOException {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);

        String jsonResponse = gson.toJson(response);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        addCorsHeaders(exchange);
        exchange.sendResponseHeaders(statusCode, jsonResponse.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(jsonResponse.getBytes());
        }
    }

    public void writeJsonResponse(HttpExchange exchange, int statusCode, Object data) throws IOException {
        String response = gson.toJson(data);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        addCorsHeaders(exchange);
        exchange.sendResponseHeaders(statusCode, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }
}
