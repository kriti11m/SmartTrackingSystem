package org.example;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.example.controller.ParcelController;
import org.example.controller.UserController;
import org.example.service.ParcelService;
import org.example.service.UserService;

import java.io.IOException;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws IOException {
        try {
            // Initialize components
            UserService userService = new UserService();
            ParcelService parcelService = new ParcelService();
            UserController userController = new UserController(userService);
            ParcelController parcelController = new ParcelController(parcelService);

            // Create and configure server
            HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

            // Register user endpoints with CORS support
            server.createContext("/api/users/register", exchange -> {
                addCorsHeaders(exchange);
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    handleOptionsRequest(exchange);
                } else {
                    userController.handleRegister().handle(exchange);
                }
            });

            server.createContext("/api/users/login", exchange -> {
                addCorsHeaders(exchange);
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    handleOptionsRequest(exchange);
                } else {
                    userController.handleLogin().handle(exchange);
                }
            });

            server.createContext("/api/users", exchange -> {
                addCorsHeaders(exchange);
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    handleOptionsRequest(exchange);
                } else {
                    userController.handleGetUser().handle(exchange);
                }
            });

            // Register parcel endpoints with CORS support
            server.createContext("/api/parcels/create", exchange -> {
                addCorsHeaders(exchange);
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    handleOptionsRequest(exchange);
                } else {
                    parcelController.handleCreateParcel().handle(exchange);
                }
            });

            server.createContext("/api/parcels/user", exchange -> {
                addCorsHeaders(exchange);
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    handleOptionsRequest(exchange);
                } else {
                    parcelController.handleGetUserParcels().handle(exchange);
                }
            });

            server.createContext("/api/parcels/track", exchange -> {
                addCorsHeaders(exchange);
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    handleOptionsRequest(exchange);
                } else {
                    parcelController.handleGetParcelByTracking().handle(exchange);
                }
            });

            server.createContext("/api/parcels/status", exchange -> {
                addCorsHeaders(exchange);
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    handleOptionsRequest(exchange);
                } else {
                    parcelController.handleUpdateParcelStatus().handle(exchange);
                }
            });

            // Admin endpoint to get all parcels
            server.createContext("/api/parcels/all", exchange -> {
                addCorsHeaders(exchange);
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    handleOptionsRequest(exchange);
                } else {
                    parcelController.handleGetAllParcels().handle(exchange);
                }
            });

            // Start the server
            server.setExecutor(null);
            server.start();

            System.out.println("Server is running on port 8080");
            System.out.println("Available endpoints:");
            System.out.println("POST /api/users/register - Register a new user");
            System.out.println("POST /api/users/login - Login user");
            System.out.println("GET /api/users?email={email} - Get user by email");
            System.out.println("POST /api/parcels/create - Create a new parcel");
            System.out.println("GET /api/parcels/user?senderId={senderId} - Get parcels by sender ID");
            System.out.println("GET /api/parcels/track?trackingId={trackingId} - Get parcel by tracking ID");
            System.out.println("PUT /api/parcels/status - Update parcel status");
            System.out.println("GET /api/parcels/all - Get all parcels (admin)");
        } catch (Exception e) {
            System.err.println("Error starting server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static void handleOptionsRequest(HttpExchange exchange) throws IOException {
        exchange.sendResponseHeaders(204, -1); // No Content
    }
}