package com.chukchukgo.models;

import java.util.Date;
import java.util.ArrayList;
import java.util.List;

/**
 * Model class for User object.
 * Represents a user in the system with personal details and account information.
 */
public class User {
    private int userId;
    private String username;
    private String password; // Stored as hashed value
    private String fullName;
    private String email;
    private String phone;
    private Date dateOfBirth;
    private String gender;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private Date registrationDate;
    private boolean isActive;
    private String role; // user, admin
    private List<String> savedPassengers;
    private List<String> recentSearches;
    private List<String> bookingHistory;

    /**
     * Default constructor
     */
    public User() {
        this.registrationDate = new Date();
        this.isActive = true;
        this.role = "user";
        this.savedPassengers = new ArrayList<>();
        this.recentSearches = new ArrayList<>();
        this.bookingHistory = new ArrayList<>();
    }

    /**
     * Constructor with basic parameters
     */
    public User(String username, String password, String fullName, String email, String phone) {
        this();
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
    }

    /**
     * Add a saved passenger
     */
    public void addSavedPassenger(String passengerDetails) {
        if (this.savedPassengers == null) {
            this.savedPassengers = new ArrayList<>();
        }
        this.savedPassengers.add(passengerDetails);
    }

    /**
     * Add a recent search
     */
    public void addRecentSearch(String searchDetails) {
        if (this.recentSearches == null) {
            this.recentSearches = new ArrayList<>();
        }
        // Maintain a limited number of recent searches (e.g., 5)
        if (this.recentSearches.size() >= 5) {
            this.recentSearches.remove(0);
        }
        this.recentSearches.add(searchDetails);
    }

    /**
     * Add a booking to history
     */
    public void addBookingToHistory(String pnrNumber) {
        if (this.bookingHistory == null) {
            this.bookingHistory = new ArrayList<>();
        }
        this.bookingHistory.add(pnrNumber);
    }

    // Getters and Setters
    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Date getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(Date dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public Date getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(Date registrationDate) {
        this.registrationDate = registrationDate;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<String> getSavedPassengers() {
        return savedPassengers;
    }

    public void setSavedPassengers(List<String> savedPassengers) {
        this.savedPassengers = savedPassengers;
    }

    public List<String> getRecentSearches() {
        return recentSearches;
    }

    public void setRecentSearches(List<String> recentSearches) {
        this.recentSearches = recentSearches;
    }

    public List<String> getBookingHistory() {
        return bookingHistory;
    }

    public void setBookingHistory(List<String> bookingHistory) {
        this.bookingHistory = bookingHistory;
    }

    @Override
    public String toString() {
        return "User{" +
                "userId=" + userId +
                ", username='" + username + '\'' +
                ", fullName='" + fullName + '\'' +
                ", email='" + email + '\'' +
                ", phone='" + phone + '\'' +
                ", isActive=" + isActive +
                ", role='" + role + '\'' +
                '}';
    }
}
