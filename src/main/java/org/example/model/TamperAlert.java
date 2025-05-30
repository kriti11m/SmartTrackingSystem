package org.example.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class  TamperAlert {
    private String id;
    private String parcelId;
    private String handlerId;
    private String location;
    private String alertType;
    private String description;
    private boolean resolved;
    private LocalDateTime timestamp;

    public TamperAlert() {
        this.id = UUID.randomUUID().toString();
        this.timestamp = LocalDateTime.now();
        this.resolved = false;
    }

    public TamperAlert(String parcelId, String handlerId, String location, String alertType, String description) {
        this();
        this.parcelId = parcelId;
        this.handlerId = handlerId;
        this.location = location;
        this.alertType = alertType;
        this.description = description;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getParcelId() {
        return parcelId;
    }

    public void setParcelId(String parcelId) {
        this.parcelId = parcelId;
    }

    public String getHandlerId() {
        return handlerId;
    }

    public void setHandlerId(String handlerId) {
        this.handlerId = handlerId;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isResolved() {
        return resolved;
    }

    public void setResolved(boolean resolved) {
        this.resolved = resolved;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
