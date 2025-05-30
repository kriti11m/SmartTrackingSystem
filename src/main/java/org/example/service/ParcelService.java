package org.example.service;

import com.google.gson.*;
import org.example.model.Parcel;
import org.example.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.io.*;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class ParcelService {
    private static final String QR_CODE_DIRECTORY = "qrcodes";
    private final Gson gson;

    public ParcelService() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder.setPrettyPrinting();
        this.gson = gsonBuilder.create();

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
        Session session = HibernateUtil.getSessionFactory().openSession();
        List<Parcel> parcels = null;

        try {
            parcels = session.createQuery("FROM Parcel", Parcel.class).list();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            session.close();
        }

        return parcels != null ? parcels : new ArrayList<>();
    }

    public Parcel createParcel(Parcel parcel) {
        Session session = HibernateUtil.getSessionFactory().openSession();
        Transaction transaction = null;

        try {
            transaction = session.beginTransaction();

            // Ensure created and updated timestamps are set
            if (parcel.getCreatedAt() == null) {
                parcel.setCreatedAt(getCurrentTimestamp());
            }
            if (parcel.getUpdatedAt() == null) {
                parcel.setUpdatedAt(getCurrentTimestamp());
            }

            // If status is not set, set it to "Created"
            if (parcel.getStatus() == null) {
                parcel.setStatus("Created");
            }

            // Save the parcel to database
            session.save(parcel);

            // Generate QR code for the parcel
            generateQRCode(parcel);

            transaction.commit();
            return parcel;
        } catch (Exception e) {
            if (transaction != null) {
                transaction.rollback();
            }
            e.printStackTrace();
            return null;
        } finally {
            session.close();
        }
    }

    public Parcel getParcelById(String id) {
        Session session = HibernateUtil.getSessionFactory().openSession();
        Parcel parcel = null;

        try {
            parcel = session.get(Parcel.class, id);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            session.close();
        }
        return parcel;
    }

    public Parcel getParcelByTrackingId(String trackingId) {
        Session session = HibernateUtil.getSessionFactory().openSession();
        Parcel parcel = null;

        try {
            parcel = session.createQuery(
                "FROM Parcel WHERE trackingId = :trackingId", Parcel.class)
                .setParameter("trackingId", trackingId)
                .uniqueResult();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            session.close();
        }

        return parcel;
    }

    public List<Parcel> getParcelsBySenderId(String senderId) {
        Session session = HibernateUtil.getSessionFactory().openSession();
        List<Parcel> parcels = null;

        try {
            parcels = session.createQuery(
                "FROM Parcel WHERE senderId = :senderId", Parcel.class)
                .setParameter("senderId", senderId)
                .list();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            session.close();
        }

        return parcels != null ? parcels : new ArrayList<>();
    }

    public Parcel updateParcelStatus(String trackingId, String newStatus) {
        Session session = HibernateUtil.getSessionFactory().openSession();
        Transaction transaction = null;
        Parcel parcel = null;

        try {
            transaction = session.beginTransaction();

            parcel = session.createQuery(
                "FROM Parcel WHERE trackingId = :trackingId", Parcel.class)
                .setParameter("trackingId", trackingId)
                .uniqueResult();

            if (parcel != null) {
                parcel.setStatus(newStatus);
                parcel.setUpdatedAt(getCurrentTimestamp());
                session.update(parcel);
                transaction.commit();
            }
        } catch (Exception e) {
            if (transaction != null) {
                transaction.rollback();
            }
            e.printStackTrace();
        } finally {
            session.close();
        }

        return parcel;
    }

    // Generate QR code for a parcel
    private void generateQRCode(Parcel parcel) {
        try {
            // Generate QR code based on tracking ID
            String qrPath = QR_CODE_DIRECTORY + "/" + parcel.getTrackingId() + ".png";

            // TODO: Implement actual QR code generation here
            // For demonstration purposes, just setting the path
            parcel.setQrCodePath(qrPath);

        } catch (Exception e) {
            System.err.println("Error generating QR code: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
