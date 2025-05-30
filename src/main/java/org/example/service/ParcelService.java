package org.example.service;

import com.google.gson.*;
import com.google.gson.reflect.TypeToken;
import org.example.model.Parcel;

import java.io.*;
import java.lang.reflect.Type;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class ParcelService {
    private static final String PARCELS_FILE = "parcels.json";
    private static final String QR_CODE_DIRECTORY = "qrcodes";
    private final Gson gson;

    public ParcelService() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder.setPrettyPrinting();
        this.gson = gsonBuilder.create();

        // Create the file if it doesn't exist
        File file = new File(PARCELS_FILE);
        if (!file.exists()) {
            try {
                file.createNewFile();
                FileWriter writer = new FileWriter(PARCELS_FILE);
                writer.write("[]");
                writer.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        // Create QR code directory if it doesn't exist
        File qrDir = new File(QR_CODE_DIRECTORY);
        if (!qrDir.exists()) {
            qrDir.mkdirs();
        }
    }

    private String getCurrentTimestamp() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        return sdf.format(new Date());
    }

    public List<Parcel> getAllParcels() {
        try (FileReader reader = new FileReader(PARCELS_FILE)) {
            Type parcelListType = new TypeToken<ArrayList<Parcel>>(){}.getType();
            List<Parcel> parcels = gson.fromJson(reader, parcelListType);
            return parcels != null ? parcels : new ArrayList<>();
        } catch (IOException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public Parcel createParcel(Parcel parcel) {
        List<Parcel> parcels = getAllParcels();

        // Generate QR code for tracking
        String qrCodePath = generateQRCode(parcel.getTrackingId());
        parcel.setQrCodePath(qrCodePath);

        parcels.add(parcel);
        saveParcels(parcels);

        return parcel;
    }

    public Parcel getParcelById(String id) {
        return getAllParcels().stream()
                .filter(p -> p.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public Parcel getParcelByTrackingId(String trackingId) {
        return getAllParcels().stream()
                .filter(p -> p.getTrackingId().equals(trackingId))
                .findFirst()
                .orElse(null);
    }

    public List<Parcel> getParcelsBySenderId(String senderId) {
        return getAllParcels().stream()
                .filter(p -> p.getSenderId().equals(senderId))
                .collect(Collectors.toList());
    }

    public Parcel updateParcelStatus(String trackingId, String newStatus) {
        List<Parcel> parcels = getAllParcels();

        for (Parcel parcel : parcels) {
            if (parcel.getTrackingId().equals(trackingId)) {
                parcel.setStatus(newStatus);
                saveParcels(parcels);
                return parcel;
            }
        }

        return null;
    }

    public String generateQRCode(String trackingId) {
        try {
            // For this implementation, we'll create a placeholder file
            String fileName = trackingId + ".png";
            Path filePath = Paths.get(QR_CODE_DIRECTORY, fileName);

            // Create a dummy file for demonstration
            if (!Files.exists(filePath)) {
                Files.createFile(filePath);
            }

            return filePath.toString();
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    private void saveParcels(List<Parcel> parcels) {
        try (FileWriter writer = new FileWriter(PARCELS_FILE)) {
            gson.toJson(parcels, writer);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
