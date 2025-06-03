package org.example.controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.model.Parcel;
import org.example.service.ParcelService;
import org.example.view.JsonResponseWriter;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class ParcelController {
    private final ParcelService parcelService;
    private final Gson gson;
    private final JsonResponseWriter responseWriter;

    public ParcelController(ParcelService parcelService) {
        this.parcelService = parcelService;
        this.gson = new Gson();
        this.responseWriter = new JsonResponseWriter();
    }

    public HttpHandler handleCreateParcel() {
        return exchange -> {
            if (!"POST".equals(exchange.getRequestMethod())) {
                responseWriter.writeError(exchange, 405, "Method not allowed");
                return;
            }

            try {
                String requestBody = readRequestBody(exchange);
                System.out.println("Received create parcel request: " + requestBody);

                Parcel newParcel = gson.fromJson(requestBody, Parcel.class);

                // Validate required fields
                if (newParcel == null ||
                    isEmpty(newParcel.getSenderId()) ||
                    isEmpty(newParcel.getRecipientName()) ||
                    isEmpty(newParcel.getDestinationAddress()) ||
                    newParcel.getWeight() <= 0 ||
                    isEmpty(newParcel.getDescription())) {
                    responseWriter.writeError(exchange, 400, "All fields are required: sender ID, recipient name, destination address, weight, and description");
                    return;
                }

                Parcel createdParcel = parcelService.createParcel(newParcel);

                if (createdParcel == null) {
                    responseWriter.writeError(exchange, 500, "Failed to create parcel");
                    return;
                }

                System.out.println("Parcel created successfully with tracking ID: " + createdParcel.getTrackingId());
                // Note: Email notification is handled automatically in parcelService.createParcel()

                // Add CORS headers to allow frontend access
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");

                responseWriter.writeJson(exchange, createdParcel);

            } catch (Exception e) {
                System.err.println("Error creating parcel: " + e.getMessage());
                e.printStackTrace();
                responseWriter.writeError(exchange, 500, "Error creating parcel: " + e.getMessage());
            }
        };
    }

    public HttpHandler handleGetUserParcels() {
        return exchange -> {
            if (!"GET".equals(exchange.getRequestMethod())) {
                responseWriter.writeError(exchange, 405, "Method not allowed");
                return;
            }

            String query = exchange.getRequestURI().getQuery();
            if (query == null || !query.startsWith("senderId=")) {
                responseWriter.writeError(exchange, 400, "Invalid request: senderId parameter is required");
                return;
            }

            String senderId = query.substring(9); // after "senderId="
            List<Parcel> parcels = parcelService.getParcelsBySenderId(senderId);

            // Add CORS headers to allow frontend access
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");

            responseWriter.writeJson(exchange, parcels);
        };
    }

    public HttpHandler handleGetParcelByTracking() {
        return exchange -> {
            if (!"GET".equals(exchange.getRequestMethod())) {
                responseWriter.writeError(exchange, 405, "Method not allowed");
                return;
            }

            String query = exchange.getRequestURI().getQuery();
            if (query == null || !query.startsWith("trackingId=")) {
                responseWriter.writeError(exchange, 400, "Invalid request: trackingId parameter is required");
                return;
            }

            String trackingId = query.substring(11); // after "trackingId="
            Parcel parcel = parcelService.getParcelByTrackingId(trackingId);

            // Add CORS headers to allow frontend access
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");

            if (parcel != null) {
                responseWriter.writeJson(exchange, parcel);
            } else {
                responseWriter.writeError(exchange, 404, "Parcel not found");
            }
        };
    }

    public HttpHandler handleUpdateParcelStatus() {
        return exchange -> {
            if (!"PUT".equals(exchange.getRequestMethod())) {
                responseWriter.writeError(exchange, 405, "Method not allowed");
                return;
            }

            try {
                String requestBody = readRequestBody(exchange);
                StatusUpdateRequest updateRequest = gson.fromJson(requestBody, StatusUpdateRequest.class);

                if (updateRequest == null || isEmpty(updateRequest.getTrackingId()) || isEmpty(updateRequest.getNewStatus())) {
                    responseWriter.writeError(exchange, 400, "Both trackingId and newStatus are required");
                    return;
                }

                Parcel parcel = parcelService.getParcelByTrackingId(updateRequest.getTrackingId());

                if (parcel == null) {
                    responseWriter.writeError(exchange, 404, "Parcel not found");
                    return;
                }

                // Add CORS headers to allow frontend access
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");

                parcelService.updateParcelStatus(updateRequest.getTrackingId(), updateRequest.getNewStatus());
                responseWriter.writeSuccess(exchange, "Parcel status updated successfully");

            } catch (Exception e) {
                System.err.println("Error updating parcel status: " + e.getMessage());
                e.printStackTrace();
                responseWriter.writeError(exchange, 500, "Error updating parcel status: " + e.getMessage());
            }
        };
    }

    // Get all parcels (for admin)
    public HttpHandler handleGetAllParcels() {
        return exchange -> {
            if (!"GET".equals(exchange.getRequestMethod())) {
                responseWriter.writeError(exchange, 405, "Method not allowed");
                return;
            }

            try {
                List<Parcel> allParcels = parcelService.getAllParcels();

                // Add CORS headers to allow frontend access
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");

                responseWriter.writeJson(exchange, allParcels);
            } catch (Exception e) {
                e.printStackTrace();
                responseWriter.writeError(exchange, 500, "Internal server error: " + e.getMessage());
            }
        };
    }

    // New handler for OTP verification during delivery
    public HttpHandler handleVerifyDeliveryOtp() {
        return exchange -> {
            if (!"POST".equals(exchange.getRequestMethod())) {
                responseWriter.writeError(exchange, 405, "Method not allowed");
                return;
            }

            try {
                String requestBody = readRequestBody(exchange);
                OtpVerificationRequest verifyRequest = gson.fromJson(requestBody, OtpVerificationRequest.class);

                if (verifyRequest == null || isEmpty(verifyRequest.getTrackingId()) || isEmpty(verifyRequest.getOtp())) {
                    responseWriter.writeError(exchange, 400, "Both trackingId and otp are required");
                    return;
                }

                // Add CORS headers to allow frontend access
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");

                // Verify OTP
                boolean isValidOtp = parcelService.verifyDeliveryOtp(
                    verifyRequest.getTrackingId(),
                    verifyRequest.getOtp()
                );

                if (isValidOtp) {
                    // Update parcel status to "Delivered" after OTP verification
                    parcelService.updateParcelStatus(verifyRequest.getTrackingId(), "Delivered");
                    responseWriter.writeSuccess(exchange, "OTP verified. Parcel marked as delivered.");
                } else {
                    responseWriter.writeError(exchange, 400, "Invalid OTP or parcel not ready for delivery");
                }
            } catch (Exception e) {
                System.err.println("Error verifying OTP: " + e.getMessage());
                e.printStackTrace();
                responseWriter.writeError(exchange, 500, "Error verifying OTP: " + e.getMessage());
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

    private static class StatusUpdateRequest {
        private String trackingId;
        private String newStatus;

        public String getTrackingId() {
            return trackingId;
        }

        public String getNewStatus() {
            return newStatus;
        }
    }

    // New class for OTP verification request
    private static class OtpVerificationRequest {
        private String trackingId;
        private String otp;

        public String getTrackingId() {
            return trackingId;
        }

        public String getOtp() {
            return otp;
        }
    }
}
