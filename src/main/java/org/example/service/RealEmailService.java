package org.example.service;

import org.example.model.Parcel;
import org.example.model.User;

import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import java.io.File;
import java.io.IOException;
import java.util.Properties;

/**
 * Email service that actually sends emails using SMTP.
 * This is an alternative to the simulated EmailService.
 * To use this class:
 * 1. Add JavaMail dependency to build.gradle
 * 2. Set up email configuration in application.properties
 * 3. Replace EmailService with this implementation in ParcelService
 */
public class RealEmailService {
    private final String username;
    private final String appPassword; // App password (for Gmail) or regular password for other services
    private final String host;
    private final String port;
    private static final String DEFAULT_HANDLER_NAME = "Kriti Maheshwari";

    public RealEmailService(String username, String appPassword, String host, String port) {
        this.username = username;
        this.appPassword = appPassword;
        this.host = host;
        this.port = port;
    }

    /**
     * Static factory method to create an instance from application properties
     */
    public static RealEmailService fromProperties() {
        try {
            java.io.InputStream input = RealEmailService.class.getClassLoader()
                    .getResourceAsStream("application.properties");

            if (input == null) {
                System.err.println("Unable to find application.properties");
                return null;
            }

            Properties props = new Properties();
            props.load(input);

            return new RealEmailService(
                    props.getProperty("mail.username"),
                    props.getProperty("mail.app.password"),
                    props.getProperty("mail.smtp.host", "smtp.gmail.com"),
                    props.getProperty("mail.smtp.port", "587")
            );
        } catch (IOException e) {
            System.err.println("Error loading email configuration: " + e.getMessage());
            return null;
        }
    }

    public boolean sendParcelCreationEmail(User sender, Parcel parcel) {
        String subject = "Parcel Created: " + parcel.getTrackingId();
        String content = createParcelCreationContent(sender, parcel);

        return sendEmail(sender.getEmail(), subject, content);
    }

    public boolean sendDeliveryOtpEmail(User sender, Parcel parcel) {
        String subject = "Delivery OTP for Parcel: " + parcel.getTrackingId();
        String content = createDeliveryOtpContent(sender, parcel);

        return sendEmail(sender.getEmail(), subject, content);
    }

    private boolean sendEmail(String recipient, String subject, String htmlContent) {
        try {
            // Set mail properties
            Properties props = new Properties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.host", host);
            props.put("mail.smtp.port", port);

            // Create session with authenticator
            Session session = Session.getInstance(props, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(username, appPassword);
                }
            });

            // Create message
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(username));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipient));
            message.setSubject(subject);
            message.setContent(htmlContent, "text/html");

            // Send message
            Transport.send(message);
            System.out.println("Email sent successfully to: " + recipient + ", Subject: " + subject);
            return true;
        } catch (MessagingException e) {
            System.err.println("Failed to send email: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private String createParcelCreationContent(User sender, Parcel parcel) {
        return "<html>"
                + "<body>"
                + "<h2>Parcel Created Successfully</h2>"
                + "<p>Dear " + sender.getName() + ",</p>"
                + "<p>Your parcel has been created successfully with the following details:</p>"
                + "<ul>"
                + "<li><strong>Tracking ID:</strong> " + parcel.getTrackingId() + "</li>"
                + "<li><strong>Recipient:</strong> " + parcel.getRecipientName() + "</li>"
                + "<li><strong>Destination:</strong> " + parcel.getDestinationAddress() + "</li>"
                + "<li><strong>Weight:</strong> " + parcel.getWeight() + " kg</li>"
                + "<li><strong>Status:</strong> " + parcel.getStatus() + "</li>"
                + "</ul>"
                + "<p><strong>Important:</strong> Your delivery verification OTP is shown below. Please keep this OTP secure and share it with the delivery handler only when your parcel is being delivered.</p>"
                + "<h3 style='color: #4CAF50; text-align: center; padding: 10px; border: 2px dashed #4CAF50; width: 150px; margin: 20px auto;'>"
                + parcel.getDeliveryOtp()
                + "</h3>"
                + "<p>You can track your parcel using the tracking ID.</p>"
                + "<p>Thank you for using our service!</p>"
                + "<p>Best regards,<br>" + DEFAULT_HANDLER_NAME + "<br>Smart Tracking System</p>"
                + "</body>"
                + "</html>";
    }

    private String createDeliveryOtpContent(User sender, Parcel parcel) {
        return "<html>"
                + "<body>"
                + "<h2>Delivery OTP for Your Parcel</h2>"
                + "<p>Dear " + sender.getName() + ",</p>"
                + "<p>Your parcel with Tracking ID: <strong>" + parcel.getTrackingId() + "</strong> is ready for delivery.</p>"
                + "<p>Please provide the following OTP to the delivery handler:</p>"
                + "<h3 style='color: #4CAF50; text-align: center; padding: 10px; border: 2px dashed #4CAF50; width: 150px; margin: 20px auto;'>"
                + parcel.getDeliveryOtp()
                + "</h3>"
                + "<p>For security reasons, please verify the identity of the delivery person before sharing the OTP.</p>"
                + "<p>Thank you for using our service!</p>"
                + "<p>Best regards,<br>" + DEFAULT_HANDLER_NAME + "<br>Smart Tracking System</p>"
                + "</body>"
                + "</html>";
    }
}
