package org.example.util;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.example.model.User;
import org.example.service.UserService;

import java.io.FileReader;
import java.lang.reflect.Type;
import java.util.List;

public class DataMigration {
    public static void migrateUsers() {
        try {
            // Read JSON file
            Gson gson = new Gson();
            Type userListType = new TypeToken<List<User>>(){}.getType();
            List<User> users = gson.fromJson(
                new FileReader("users.json"),
                userListType
            );

            // Save users to database
            UserService userService = new UserService();
            for (User user : users) {
                if (userService.findUserByEmail(user.getEmail()) == null) {
                    userService.saveUser(user);
                    System.out.println("Migrated user: " + user.getEmail());
                } else {
                    System.out.println("User already exists: " + user.getEmail());
                }
            }

            System.out.println("Migration completed successfully!");
        } catch (Exception e) {
            System.err.println("Error during migration: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
