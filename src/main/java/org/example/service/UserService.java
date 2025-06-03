package org.example.service;

import org.example.model.User;
import org.example.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.ArrayList;
import java.util.List;

public class UserService {
    public User getUserById(String userId) {
        Session session = HibernateUtil.getSessionFactory().openSession();
        User user = null;

        try {
            // Cast the string ID to long since User uses Long as ID type
            Long id = Long.parseLong(userId);
            user = session.get(User.class, id);
        } catch (NumberFormatException e) {
            System.err.println("Invalid user ID format: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error fetching user: " + e.getMessage());
            e.printStackTrace();
        } finally {
            session.close();
        }

        return user;
    }

    public User findUserByEmail(String email) {
        Session session = HibernateUtil.getSessionFactory().openSession();
        User user = null;

        try {
            user = session.createQuery(
                "FROM User WHERE email = :email", User.class)
                .setParameter("email", email)
                .uniqueResult();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            session.close();
        }

        return user;
    }

    public User saveUser(User user) {
        Session session = HibernateUtil.getSessionFactory().openSession();
        Transaction transaction = null;

        try {
            transaction = session.beginTransaction();
            session.save(user);
            transaction.commit();
            return user;
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

    public User authenticateUser(String email, String password) {
        User user = findUserByEmail(email);

        if (user != null && password.equals(user.getPassword())) {
            return user;
        }

        return null;
    }

    public List<User> getAllUsers() {
        Session session = HibernateUtil.getSessionFactory().openSession();
        List<User> users = null;

        try {
            users = session.createQuery("FROM User", User.class).list();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            session.close();
        }

        return users != null ? users : new ArrayList<>();
    }
}

