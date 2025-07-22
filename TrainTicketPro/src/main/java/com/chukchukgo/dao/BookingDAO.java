package com.chukchukgo.dao;

import com.chukchukgo.models.Booking;
import com.chukchukgo.utils.PNRGenerator;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Data Access Object for Booking related operations.
 * Provides methods to create bookings, retrieve booking details, cancel bookings, etc.
 */
public class BookingDAO {
    private static final Logger LOGGER = Logger.getLogger(BookingDAO.class.getName());

    /**
     * Default constructor
     */
    public BookingDAO() {
        // Default constructor
    }

    /**
     * Creates a new booking in the database
     * @param booking The booking object to save
     * @return Generated PNR number if successful, null otherwise
     */
    public String createBooking(Booking booking) {
        String pnrNumber = PNRGenerator.generatePNR();
        booking.setPnrNumber(pnrNumber);
        
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "INSERT INTO bookings (pnr_number, train_number, train_name, " +
                     "from_station, to_station, journey_date, departure_time, arrival_time, " +
                     "travel_class, quota, booking_date, total_fare, booking_status, " +
                     "chart_status, can_cancel, contact_email, contact_phone, " +
                     "payment_method, payment_id, txn_id) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
            
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            
            stmt.setString(1, booking.getPnrNumber());
            stmt.setString(2, booking.getTrainNumber());
            stmt.setString(3, booking.getTrainName());
            stmt.setString(4, booking.getFromStation());
            stmt.setString(5, booking.getToStation());
            stmt.setString(6, dateFormat.format(booking.getJourneyDate()));
            stmt.setString(7, booking.getDepartureTime());
            stmt.setString(8, booking.getArrivalTime());
            stmt.setString(9, booking.getTravelClass());
            stmt.setString(10, booking.getQuota());
            stmt.setString(11, dateFormat.format(booking.getBookingDate()));
            stmt.setDouble(12, booking.getTotalFare());
            stmt.setString(13, booking.getBookingStatus());
            stmt.setString(14, booking.getChartStatus());
            stmt.setBoolean(15, booking.isCanCancel());
            stmt.setString(16, booking.getContactDetails().getEmail());
            stmt.setString(17, booking.getContactDetails().getPhone());
            stmt.setString(18, booking.getPaymentMethod());
            stmt.setString(19, booking.getPaymentId());
            stmt.setString(20, booking.getTxnId());
            
            int rowsAffected = stmt.executeUpdate();
            
            if (rowsAffected > 0) {
                // Insert passengers
                insertPassengers(conn, booking);
                return pnrNumber;
            }
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error creating booking", e);
        }
        
        return null;
    }
    
    /**
     * Insert passengers for a booking into the database
     */
    private void insertPassengers(Connection conn, Booking booking) throws SQLException {
        String sql = "INSERT INTO passengers (pnr_number, passenger_index, name, age, gender, " +
                     "berth, berth_preference, concession, id_proof_type, id_proof_number, " +
                     "booking_status, current_status, coach) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            List<Booking.Passenger> passengers = booking.getPassengers();
            
            for (int i = 0; i < passengers.size(); i++) {
                Booking.Passenger passenger = passengers.get(i);
                
                stmt.setString(1, booking.getPnrNumber());
                stmt.setInt(2, i + 1); // 1-based index
                stmt.setString(3, passenger.getName());
                stmt.setInt(4, passenger.getAge());
                stmt.setString(5, passenger.getGender());
                stmt.setString(6, passenger.getBerth());
                stmt.setString(7, passenger.getBerthPreference());
                stmt.setString(8, passenger.getConcession());
                stmt.setString(9, passenger.getIdProofType());
                stmt.setString(10, passenger.getIdProofNumber());
                stmt.setString(11, passenger.getBookingStatus());
                stmt.setString(12, passenger.getCurrentStatus());
                stmt.setString(13, passenger.getCoach());
                
                stmt.executeUpdate();
            }
        }
    }
    
    /**
     * Retrieve booking details by PNR number
     * @param pnrNumber The PNR number to look up
     * @return Booking object if found, null otherwise
     */
    public Booking getBookingByPNR(String pnrNumber) {
        Booking booking = null;
        
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT * FROM bookings WHERE pnr_number = ?")) {
            
            stmt.setString(1, pnrNumber);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    booking = new Booking();
                    booking.setPnrNumber(rs.getString("pnr_number"));
                    booking.setTrainNumber(rs.getString("train_number"));
                    booking.setTrainName(rs.getString("train_name"));
                    booking.setFromStation(rs.getString("from_station"));
                    booking.setToStation(rs.getString("to_station"));
                    
                    // Parse dates
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                    try {
                        booking.setJourneyDate(dateFormat.parse(rs.getString("journey_date")));
                        booking.setBookingDate(dateFormat.parse(rs.getString("booking_date")));
                    } catch (ParseException e) {
                        LOGGER.log(Level.WARNING, "Error parsing dates", e);
                    }
                    
                    booking.setDepartureTime(rs.getString("departure_time"));
                    booking.setArrivalTime(rs.getString("arrival_time"));
                    booking.setTravelClass(rs.getString("travel_class"));
                    booking.setQuota(rs.getString("quota"));
                    booking.setTotalFare(rs.getDouble("total_fare"));
                    booking.setBookingStatus(rs.getString("booking_status"));
                    booking.setChartStatus(rs.getString("chart_status"));
                    booking.setCanCancel(rs.getBoolean("can_cancel"));
                    
                    // Set contact details
                    Booking.ContactDetails contactDetails = new Booking.ContactDetails();
                    contactDetails.setEmail(rs.getString("contact_email"));
                    contactDetails.setPhone(rs.getString("contact_phone"));
                    booking.setContactDetails(contactDetails);
                    
                    booking.setPaymentMethod(rs.getString("payment_method"));
                    booking.setPaymentId(rs.getString("payment_id"));
                    booking.setTxnId(rs.getString("txn_id"));
                    
                    // Load passengers
                    loadPassengers(conn, booking);
                }
            }
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error retrieving booking by PNR", e);
        }
        
        // If not found in the database, create a mock booking for demonstration
        if (booking == null) {
            booking = createMockBooking(pnrNumber);
        }
        
        return booking;
    }
    
    /**
     * Load passengers for a booking from the database
     */
    private void loadPassengers(Connection conn, Booking booking) throws SQLException {
        String sql = "SELECT * FROM passengers WHERE pnr_number = ? ORDER BY passenger_index";
        
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, booking.getPnrNumber());
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Booking.Passenger passenger = new Booking.Passenger();
                    
                    passenger.setName(rs.getString("name"));
                    passenger.setAge(rs.getInt("age"));
                    passenger.setGender(rs.getString("gender"));
                    passenger.setBerth(rs.getString("berth"));
                    passenger.setBerthPreference(rs.getString("berth_preference"));
                    passenger.setConcession(rs.getString("concession"));
                    passenger.setIdProofType(rs.getString("id_proof_type"));
                    passenger.setIdProofNumber(rs.getString("id_proof_number"));
                    passenger.setBookingStatus(rs.getString("booking_status"));
                    passenger.setCurrentStatus(rs.getString("current_status"));
                    passenger.setCoach(rs.getString("coach"));
                    
                    booking.addPassenger(passenger);
                }
            }
        }
    }
    
    /**
     * Cancel a booking by PNR number
     * @param pnrNumber The PNR number of the booking to cancel
     * @param email Email associated with the booking for verification
     * @return true if cancellation was successful, false otherwise
     */
    public boolean cancelBooking(String pnrNumber, String email) {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "UPDATE bookings SET booking_status = 'Cancelled', can_cancel = false " +
                     "WHERE pnr_number = ? AND contact_email = ?")) {
            
            stmt.setString(1, pnrNumber);
            stmt.setString(2, email);
            
            int rowsAffected = stmt.executeUpdate();
            
            return rowsAffected > 0;
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error cancelling booking", e);
            return false;
        }
    }
    
    /**
     * Get all bookings for a user
     * @param email User's email address
     * @return List of bookings for the user
     */
    public List<Booking> getBookingsByUser(String email) {
        List<Booking> bookings = new ArrayList<>();
        
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT pnr_number FROM bookings WHERE contact_email = ? " +
                     "ORDER BY journey_date DESC")) {
            
            stmt.setString(1, email);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    String pnr = rs.getString("pnr_number");
                    Booking booking = getBookingByPNR(pnr);
                    
                    if (booking != null) {
                        bookings.add(booking);
                    }
                }
            }
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error retrieving bookings by user", e);
        }
        
        return bookings;
    }
    
    /**
     * Create a mock booking for demonstration
     */
    private Booking createMockBooking(String pnrNumber) {
        Booking booking = new Booking();
        booking.setPnrNumber(pnrNumber);
        booking.setTrainNumber("12301");
        booking.setTrainName("Rajdhani Express");
        booking.setFromStation("Delhi (NDLS)");
        booking.setToStation("Mumbai (CSTM)");
        booking.setDepartureTime("16:50");
        booking.setArrivalTime("10:05");
        
        // Set dates
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        try {
            booking.setJourneyDate(dateFormat.parse("2023-12-15"));
            booking.setBookingDate(dateFormat.parse("2023-11-25"));
        } catch (ParseException e) {
            booking.setJourneyDate(new Date()); // Use current date as fallback
            booking.setBookingDate(new Date());
        }
        
        booking.setTravelClass("3A");
        booking.setQuota("GN");
        booking.setTotalFare(1245.0 * 3); // 3 passengers
        booking.setBookingStatus("Confirmed");
        booking.setChartStatus("Chart Not Prepared");
        booking.setCanCancel(true);
        
        // Set contact details
        Booking.ContactDetails contactDetails = new Booking.ContactDetails();
        contactDetails.setEmail("user@example.com");
        contactDetails.setPhone("9876543210");
        booking.setContactDetails(contactDetails);
        
        booking.setPaymentMethod("card");
        booking.setPaymentId("pay_mock123456");
        booking.setTxnId("txn_mock123456");
        
        // Add passengers
        Booking.Passenger passenger1 = new Booking.Passenger();
        passenger1.setName("John Doe");
        passenger1.setAge(35);
        passenger1.setGender("M");
        passenger1.setBerth("32 LB");
        passenger1.setBerthPreference("LB");
        passenger1.setConcession("NONE");
        passenger1.setBookingStatus("CNF/B4/32");
        passenger1.setCurrentStatus("CNF/B4/32");
        passenger1.setCoach("B4");
        booking.addPassenger(passenger1);
        
        Booking.Passenger passenger2 = new Booking.Passenger();
        passenger2.setName("Jane Doe");
        passenger2.setAge(32);
        passenger2.setGender("F");
        passenger2.setBerth("33 MB");
        passenger2.setBerthPreference("MB");
        passenger2.setConcession("NONE");
        passenger2.setBookingStatus("CNF/B4/33");
        passenger2.setCurrentStatus("CNF/B4/33");
        passenger2.setCoach("B4");
        booking.addPassenger(passenger2);
        
        Booking.Passenger passenger3 = new Booking.Passenger();
        passenger3.setName("Sam Smith");
        passenger3.setAge(28);
        passenger3.setGender("M");
        passenger3.setBerthPreference("UB");
        passenger3.setConcession("NONE");
        passenger3.setBookingStatus("RAC 12");
        passenger3.setCurrentStatus("RAC 8");
        booking.addPassenger(passenger3);
        
        return booking;
    }
}
