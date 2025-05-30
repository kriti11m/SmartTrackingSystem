package org.example.service;

import org.example.model.User;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.cfg.Configuration;
import javax.persistence.NoResultException;

public class UserService {
    private SessionFactory sessionFactory;

    public UserService() {
        try {
            Configuration configuration = new Configuration().configure();
            sessionFactory = configuration.buildSessionFactory();
        } catch (Exception e) {
            System.err.println("Initial SessionFactory creation failed: " + e);
            throw new ExceptionInInitializerError(e);
        }
    }

    public void saveUser(User user) {
        Session session = sessionFactory.openSession();
        Transaction transaction = null;

        try {
            transaction = session.beginTransaction();
            session.save(user);
            transaction.commit();
        } catch (Exception e) {
            if (transaction != null) {
                transaction.rollback();
            }
            throw new RuntimeException("Error saving user: " + e.getMessage());
        } finally {
            session.close();
        }
    }

    public User findByEmail(String email) {
        Session session = sessionFactory.openSession();
        try {
            return session.createQuery("FROM User WHERE email = :email", User.class)
                    .setParameter("email", email)
                    .uniqueResult();
        } catch (Exception e) {
            throw new RuntimeException("Error finding user by email: " + e.getMessage());
        } finally {
            session.close();
        }
    }

    public User findUserByEmail(String email) {
        return findByEmail(email);
    }

    public User authenticateUser(String email, String password) {
        User user = findByEmail(email);
        if (user != null && password != null && password.equals(user.getPassword())) {
            return user;
        }
        return null;
    }
}
