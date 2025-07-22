package com.chukchukgo.dao;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Database connection utility class.
 * Provides methods to get and close database connections.
 */
public class DBConnection {
    private static final Logger LOGGER = Logger.getLogger(DBConnection.class.getName());
    private static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";
    private static final String DB_URL = "jdbc:mysql://localhost:3306/chukchukgo_db";
    private static final String USER = "chukchukgo_user";
    private static final String PASS = "chukchukgo_pass";

    private static Connection connection = null;

    /**
     * Private constructor to prevent instantiation
     */
    private DBConnection() {
        // Private constructor to hide the implicit public one
    }

    /**
     * Gets a connection to the database
     * @return Connection object
     * @throws SQLException if a database access error occurs
     */
    public static Connection getConnection() throws SQLException {
        try {
            // Register JDBC driver
            Class.forName(JDBC_DRIVER);
            
            // If connection doesn't exist or is closed, create a new one
            if (connection == null || connection.isClosed()) {
                LOGGER.log(Level.INFO, "Creating a new database connection");
                connection = DriverManager.getConnection(DB_URL, USER, PASS);
            }
            
            return connection;
        } catch (ClassNotFoundException e) {
            LOGGER.log(Level.SEVERE, "JDBC Driver not found", e);
            throw new SQLException("JDBC Driver not found: " + e.getMessage());
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Failed to connect to database", e);
            throw e;
        }
    }

    /**
     * Closes the database connection
     */
    public static void closeConnection() {
        if (connection != null) {
            try {
                connection.close();
                LOGGER.log(Level.INFO, "Database connection closed");
            } catch (SQLException e) {
                LOGGER.log(Level.WARNING, "Failed to close database connection", e);
            }
        }
    }
}
