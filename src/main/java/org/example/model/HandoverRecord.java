package org.example.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class HandoverRecord {
    private String id;
    private String parcelId;
    private String fromHandlerId;
    private String toHandlerId;
    private String location;
    private String notes;
    private LocalDateTime timestamp;

    public HandoverRecord() {
        this.id = UUID.randomUUID().toString();
        this.timestamp = LocalDateTime.now();
    }

    public HandoverRecord(String parcelId, String fromHandlerId, String toHandlerId, String location, String notes) {
        this();
        this.parcelId = parcelId;
        this.fromHandlerId = fromHandlerId;
        this.toHandlerId = toHandlerId;
        this.location = location;
        this.notes = notes;
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

    public String getFromHandlerId() {
        return fromHandlerId;
    }

    public void setFromHandlerId(String fromHandlerId) {
        this.fromHandlerId = fromHandlerId;
    }

    public String getToHandlerId() {
        return toHandlerId;
    }

    public void setToHandlerId(String toHandlerId) {
        this.toHandlerId = toHandlerId;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
