package com.chukchukgo.dao;

import com.chukchukgo.models.User;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Data Access Object for User related operations.
 * Provides methods for user registration, authentication, retrieval, etc.
 */
public class UserDAO {
    private static final Logger LOGGER = Logger.getLogger(UserDAO.class.getName());

    /**
     * Default constructor
     */
    public UserDAO() {
        // Default constructor
    }

    /**
     * Register a new user
     * @param user The user object to register
     * @return true if registration successful, false otherwise
     */
    public boolean registerUser(User user) {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "INSERT INTO users (username, password, full_name, email, phone, " +
                     "date_of_birth, gender, address, city, state, pincode, " +
                     "registration_date, is_active, role) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
            
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            
            stmt.setString(1, user.getUsername());
            stmt.setString(2, user.getPassword()); // Should be hashed before calling this method
            stmt.setString(3, user.getFullName());
            stmt.setString(4, user.getEmail());
            stmt.setString(5, user.getPhone());
            
            // Set date of birth if provided
            if (user.getDateOfBirth() != null) {
                stmt.setString(6, dateFormat.format(user.getDateOfBirth()));
            } else {
                stmt.setNull(6, java.sql.Types.DATE);
            }
            
            stmt.setString(7, user.getGender());
            stmt.setString(8, user.getAddress());
            stmt.setString(9, user.getCity());
            stmt.setString(10, user.getState());
            stmt.setString(11, user.getPincode());
            stmt.setString(12, dateFormat.format(user.getRegistrationDate()));
            stmt.setBoolean(13, user.isActive());
            stmt.setString(14, user.getRole());
            
            int rowsAffected = stmt.executeUpdate();
            
            return rowsAffected > 0;
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error registering user", e);
            return false;
        }
    }
    
    /**
     * Authenticate a user
     * @param email User's email address
     * @param password User's password (will be hashed and compared)
     * @return User object if authentication successful, null otherwise
     */
    public User authenticateUser(String email, String password) {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT * FROM users WHERE email = ? AND password = ? AND is_active = true")) {
            
            stmt.setString(1, email);
            stmt.setString(2, password); // Password should be hashed before comparing
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToUser(rs);
                }
            }
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error authenticating user", e);
        }
        
        return null;
    }
    
    /**
     * Get user by ID
     * @param userId The user ID to look up
     * @return User object if found, null otherwise
     */
    public User getUserById(int userId) {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT * FROM users WHERE user_id = ?")) {
            
            stmt.setInt(1, userId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToUser(rs);
                }
            }
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error retrieving user by ID", e);
        }
        
        return null;
    }
    
    /**
     * Get user by email
     * @param email The email address to look up
     * @return User object if found, null otherwise
     */
    public User getUserByEmail(String email) {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT * FROM users WHERE email = ?")) {
            
            stmt.setString(1, email);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToUser(rs);
                }
            }
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error retrieving user by email", e);
        }
        
        return null;
    }
    
    /**
     * Check if a username is already taken
     * @param username The username to check
     * @return true if username is taken, false otherwise
     */
    public boolean isUsernameTaken(String username) {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT COUNT(*) FROM users WHERE username = ?")) {
            
            stmt.setString(1, username);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error checking if username is taken", e);
        }
        
        return false;
    }
    
    /**
     * Check if an email is already registered
     * @param email The email to check
     * @return true if email is registered, false otherwise
     */
    public boolean isEmailRegistered(String email) {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT COUNT(*) FROM users WHERE email = ?")) {
            
            stmt.setString(1, email);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error checking if email is registered", e);
        }
        
        return false;
    }
    
    /**
     * Update user profile
     * @param user The user object with updated details
     * @return true if update successful, false otherwise
     */
    public boolean updateUser(User user) {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "UPDATE users SET full_name = ?, phone = ?, date_of_birth = ?, " +
                     "gender = ?, address = ?, city = ?, state = ?, pincode = ? " +
                     "WHERE user_id = ?")) {
            
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            
            stmt.setString(1, user.getFullName());
            stmt.setString(2, user.getPhone());
            
            // Set date of birth if provided
            if (user.getDateOfBirth() != null) {
                stmt.setString(3, dateFormat.format(user.getDateOfBirth()));
            } else {
                stmt.setNull(3, java.sql.Types.DATE);
            }
            
            stmt.setString(4, user.getGender());
            stmt.setString(5, user.getAddress());
            stmt.setString(6, user.getCity());
            stmt.setString(7, user.getState());
            stmt.setString(8, user.getPincode());
            stmt.setInt(9, user.getUserId());
            
            int rowsAffected = stmt.executeUpdate();
            
            return rowsAffected > 0;
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error updating user", e);
            return false;
        }
    }
    
    /**
     * Reset user password
     * @param email User's email address
     * @param newPassword New password (should be hashed)
     * @return true if reset successful, false otherwise
     */
    public boolean resetPassword(String email, String newPassword) {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "UPDATE users SET password = ? WHERE email = ?")) {
            
            stmt.setString(1, newPassword); // Should be hashed
            stmt.setString(2, email);
            
            int rowsAffected = stmt.executeUpdate();
            
            return rowsAffected > 0;
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error resetting password", e);
            return false;
        }
    }
    
    /**
     * Map ResultSet to User object
     */
    private User mapResultSetToUser(ResultSet rs) throws SQLException {
        User user = new User();
        
        user.setUserId(rs.getInt("user_id"));
        user.setUsername(rs.getString("username"));
        user.setPassword(rs.getString("password"));
        user.setFullName(rs.getString("full_name"));
        user.setEmail(rs.getString("email"));
        user.setPhone(rs.getString("phone"));
        
        // Parse date of birth
        String dobStr = rs.getString("date_of_birth");
        if (dobStr != null) {
            try {
                SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                user.setDateOfBirth(dateFormat.parse(dobStr));
            } catch (ParseException e) {
                LOGGER.log(Level.WARNING, "Error parsing date of birth", e);
            }
        }
        
        user.setGender(rs.getString("gender"));
        user.setAddress(rs.getString("address"));
        user.setCity(rs.getString("city"));
        user.setState(rs.getString("state"));
        user.setPincode(rs.getString("pincode"));
        
        // Parse registration date
        String regDateStr = rs.getString("registration_date");
        if (regDateStr != null) {
            try {
                SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                user.setRegistrationDate(dateFormat.parse(regDateStr));
            } catch (ParseException e) {
                LOGGER.log(Level.WARNING, "Error parsing registration date", e);
            }
        }
        
        user.setActive(rs.getBoolean("is_active"));
        user.setRole(rs.getString("role"));
        
        // Load saved passengers, recent searches, booking history
        // These would typically be loaded from separate tables in a real application
        
        return user;
    }
}
