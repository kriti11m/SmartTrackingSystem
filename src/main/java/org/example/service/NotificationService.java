package org.example.service;

import org.example.model.Parcel;

/**
 * Simple notification service that just logs events.
 * In a real implementation, this would send emails or other notifications.
 */
public class NotificationService {

    public void sendParcelCreatedNotification(Parcel parcel) {
        System.out.println("NOTIFICATION: New parcel created with tracking ID: " + parcel.getTrackingId());
    }

    public void sendStatusUpdateNotification(Parcel parcel) {
        System.out.println("NOTIFICATION: Parcel " + parcel.getTrackingId() +
                           " status updated to: " + parcel.getStatus());
    }
}
