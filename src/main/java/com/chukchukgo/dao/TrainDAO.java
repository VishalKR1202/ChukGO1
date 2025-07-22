package com.chukchukgo.dao;

import com.chukchukgo.models.Train;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Data Access Object for Train related operations.
 * Provides methods to search trains, get train details, etc.
 */
public class TrainDAO {
    private static final Logger LOGGER = Logger.getLogger(TrainDAO.class.getName());

    /**
     * Default constructor
     */
    public TrainDAO() {
        // Default constructor
    }

    /**
     * Searches for trains based on given criteria
     * @param fromStation From station name or code
     * @param toStation To station name or code
     * @param journeyDate Journey date in yyyy-MM-dd format
     * @param travelClass Travel class code (optional)
     * @param quota Quota code (optional)
     * @return List of trains matching the search criteria
     */
    public List<Train> searchTrains(String fromStation, String toStation, String journeyDate, 
                                    String travelClass, String quota) {
        List<Train> trains = new ArrayList<>();
        
        // In a real application, this would query the database
        // For this example, we'll create a mock list of trains
        try {
            // Parse the journey date to determine day of week for running days check
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            Date date = sdf.parse(journeyDate);
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(date);
            int dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK) - 1; // 0 = Sunday, 1 = Monday, etc.
            
            // Create sample trains for demonstration
            trains = createSampleTrains(fromStation, toStation, journeyDate, dayOfWeek, travelClass, quota);
            
        } catch (ParseException e) {
            LOGGER.log(Level.SEVERE, "Error parsing journey date", e);
        }
        
        return trains;
    }
    
    /**
     * Gets train details by train number
     * @param trainNumber The train number
     * @return Train object with details, or null if not found
     */
    public Train getTrainByNumber(String trainNumber) {
        Train train = null;
        
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT * FROM trains WHERE train_number = ?")) {
            
            stmt.setString(1, trainNumber);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    train = new Train();
                    train.setNumber(rs.getString("train_number"));
                    train.setName(rs.getString("train_name"));
                    // Set other train properties from resultset
                    
                    // Load running days
                    List<Integer> runningDays = new ArrayList<>();
                    // Logic to extract running days from database
                    train.setRunningDays(runningDays);
                    
                    // Load classes and availability
                    Map<String, Map<String, Object>> classes = new HashMap<>();
                    // Logic to load class details from database
                    train.setClasses(classes);
                }
            }
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error retrieving train details", e);
        }
        
        // If the train wasn't found in the database, create a mock train for demonstration
        if (train == null) {
            train = createMockTrain(trainNumber);
        }
        
        return train;
    }
    
    /**
     * Creates a list of sample trains for demonstration
     */
    private List<Train> createSampleTrains(String fromStation, String toStation, 
                                          String journeyDate, int dayOfWeek,
                                          String travelClass, String quota) {
        List<Train> trains = new ArrayList<>();
        
        // Rajdhani Express
        Train rajdhani = new Train();
        rajdhani.setNumber("12301");
        rajdhani.setName("Rajdhani Express");
        rajdhani.setFromStation(fromStation);
        rajdhani.setToStation(toStation);
        rajdhani.setDepartureTime("16:50");
        rajdhani.setArrivalTime("10:05");
        rajdhani.setDuration("17h 15m");
        rajdhani.setDistance(1415);
        rajdhani.setRunningDays(Arrays.asList(0, 1, 2, 3, 4, 5, 6)); // All days
        
        // Add classes and availability
        Map<String, Object> ac3Tier = new HashMap<>();
        ac3Tier.put("fare", 1245.0);
        ac3Tier.put("available", "Available");
        ac3Tier.put("seats", 24);
        rajdhani.addClass("3A", ac3Tier);
        
        Map<String, Object> ac2Tier = new HashMap<>();
        ac2Tier.put("fare", 1890.0);
        ac2Tier.put("available", "Available");
        ac2Tier.put("seats", 12);
        rajdhani.addClass("2A", ac2Tier);
        
        Map<String, Object> ac1Tier = new HashMap<>();
        ac1Tier.put("fare", 3120.0);
        ac1Tier.put("available", "Available");
        ac1Tier.put("seats", 5);
        rajdhani.addClass("1A", ac1Tier);
        
        // Add to list if running on the selected day
        if (rajdhani.getRunningDays().contains(dayOfWeek)) {
            trains.add(rajdhani);
        }
        
        // Duronto Express
        Train duronto = new Train();
        duronto.setNumber("12259");
        duronto.setName("Duronto Express");
        duronto.setFromStation(fromStation);
        duronto.setToStation(toStation);
        duronto.setDepartureTime("08:20");
        duronto.setArrivalTime("23:45");
        duronto.setDuration("15h 25m");
        duronto.setDistance(1280);
        duronto.setRunningDays(Arrays.asList(1, 3, 5)); // Mon, Wed, Fri
        
        // Add classes and availability
        Map<String, Object> sleeper = new HashMap<>();
        sleeper.put("fare", 685.0);
        sleeper.put("available", "Available");
        sleeper.put("seats", 45);
        duronto.addClass("SL", sleeper);
        
        Map<String, Object> durontoAc3 = new HashMap<>();
        durontoAc3.put("fare", 1130.0);
        durontoAc3.put("available", "Available");
        durontoAc3.put("seats", 18);
        duronto.addClass("3A", durontoAc3);
        
        Map<String, Object> durontoAc2 = new HashMap<>();
        durontoAc2.put("fare", 1720.0);
        durontoAc2.put("available", "RAC");
        durontoAc2.put("racStatus", "4");
        duronto.addClass("2A", durontoAc2);
        
        // Add to list if running on the selected day
        if (duronto.getRunningDays().contains(dayOfWeek)) {
            trains.add(duronto);
        }
        
        // Mumbai Rajdhani
        Train mumbaiRajdhani = new Train();
        mumbaiRajdhani.setNumber("12951");
        mumbaiRajdhani.setName("Mumbai Rajdhani");
        mumbaiRajdhani.setFromStation(fromStation);
        mumbaiRajdhani.setToStation(toStation);
        mumbaiRajdhani.setDepartureTime("17:00");
        mumbaiRajdhani.setArrivalTime("08:15");
        mumbaiRajdhani.setDuration("15h 15m");
        mumbaiRajdhani.setDistance(1385);
        mumbaiRajdhani.setRunningDays(Arrays.asList(0, 2, 4, 6)); // Sun, Tue, Thu, Sat
        
        // Add classes and availability
        Map<String, Object> mrAc3 = new HashMap<>();
        mrAc3.put("fare", 1345.0);
        mrAc3.put("available", "Available");
        mrAc3.put("seats", 16);
        mumbaiRajdhani.addClass("3A", mrAc3);
        
        Map<String, Object> mrAc2 = new HashMap<>();
        mrAc2.put("fare", 1950.0);
        mrAc2.put("available", "Available");
        mrAc2.put("seats", 8);
        mumbaiRajdhani.addClass("2A", mrAc2);
        
        Map<String, Object> mrAc1 = new HashMap<>();
        mrAc1.put("fare", 3250.0);
        mrAc1.put("available", "RAC");
        mrAc1.put("racStatus", "2");
        mumbaiRajdhani.addClass("1A", mrAc1);
        
        // Add to list if running on the selected day
        if (mumbaiRajdhani.getRunningDays().contains(dayOfWeek)) {
            trains.add(mumbaiRajdhani);
        }
        
        // Garib Rath Express
        Train garibRath = new Train();
        garibRath.setNumber("12909");
        garibRath.setName("Garib Rath Express");
        garibRath.setFromStation(fromStation);
        garibRath.setToStation(toStation);
        garibRath.setDepartureTime("23:45");
        garibRath.setArrivalTime("14:30");
        garibRath.setDuration("14h 45m");
        garibRath.setDistance(1250);
        garibRath.setRunningDays(Arrays.asList(1, 4)); // Mon, Thu
        
        // Add classes and availability
        Map<String, Object> grAc3 = new HashMap<>();
        grAc3.put("fare", 895.0);
        grAc3.put("available", "Available");
        grAc3.put("seats", 68);
        garibRath.addClass("3A", grAc3);
        
        // Add to list if running on the selected day
        if (garibRath.getRunningDays().contains(dayOfWeek)) {
            trains.add(garibRath);
        }
        
        // Pushpak Express
        Train pushpak = new Train();
        pushpak.setNumber("12534");
        pushpak.setName("Pushpak Express");
        pushpak.setFromStation(fromStation);
        pushpak.setToStation(toStation);
        pushpak.setDepartureTime("11:30");
        pushpak.setArrivalTime("05:15");
        pushpak.setDuration("17h 45m");
        pushpak.setDistance(1320);
        pushpak.setRunningDays(Arrays.asList(0, 1, 2, 3, 4, 5, 6)); // All days
        
        // Add classes and availability
        Map<String, Object> pSleeper = new HashMap<>();
        pSleeper.put("fare", 590.0);
        pSleeper.put("available", "Available");
        pSleeper.put("seats", 120);
        pushpak.addClass("SL", pSleeper);
        
        Map<String, Object> pAc3 = new HashMap<>();
        pAc3.put("fare", 1050.0);
        pAc3.put("available", "RAC");
        pAc3.put("racStatus", "18");
        pushpak.addClass("3A", pAc3);
        
        Map<String, Object> pAc2 = new HashMap<>();
        pAc2.put("fare", 1560.0);
        pAc2.put("available", "WL");
        pAc2.put("waitlist", "15");
        pushpak.addClass("2A", pAc2);
        
        // Add to list if running on the selected day
        if (pushpak.getRunningDays().contains(dayOfWeek)) {
            trains.add(pushpak);
        }
        
        // Filter by travel class if specified
        if (travelClass != null && !travelClass.isEmpty() && !travelClass.equals("ALL")) {
            trains = trains.stream()
                    .filter(train -> train.hasClass(travelClass))
                    .toList();
        }
        
        return trains;
    }
    
    /**
     * Creates a mock train for demonstration when a specific train number is requested
     */
    private Train createMockTrain(String trainNumber) {
        Train train = new Train();
        train.setNumber(trainNumber);
        
        switch (trainNumber) {
            case "12301":
                train.setName("Rajdhani Express");
                train.setFromStation("Delhi");
                train.setToStation("Mumbai");
                train.setDepartureTime("16:50");
                train.setArrivalTime("10:05");
                train.setDuration("17h 15m");
                train.setDistance(1415);
                train.setRunningDays(Arrays.asList(0, 1, 2, 3, 4, 5, 6)); // All days
                
                // Add classes and availability
                Map<String, Object> ac3Tier = new HashMap<>();
                ac3Tier.put("fare", 1245.0);
                ac3Tier.put("available", "Available");
                ac3Tier.put("seats", 24);
                train.addClass("3A", ac3Tier);
                
                Map<String, Object> ac2Tier = new HashMap<>();
                ac2Tier.put("fare", 1890.0);
                ac2Tier.put("available", "Available");
                ac2Tier.put("seats", 12);
                train.addClass("2A", ac2Tier);
                
                Map<String, Object> ac1Tier = new HashMap<>();
                ac1Tier.put("fare", 3120.0);
                ac1Tier.put("available", "Available");
                ac1Tier.put("seats", 5);
                train.addClass("1A", ac1Tier);
                break;
                
            case "12259":
                train.setName("Duronto Express");
                train.setFromStation("Delhi");
                train.setToStation("Mumbai");
                train.setDepartureTime("08:20");
                train.setArrivalTime("23:45");
                train.setDuration("15h 25m");
                train.setDistance(1280);
                train.setRunningDays(Arrays.asList(1, 3, 5)); // Mon, Wed, Fri
                
                // Add classes and availability
                Map<String, Object> sleeper = new HashMap<>();
                sleeper.put("fare", 685.0);
                sleeper.put("available", "Available");
                sleeper.put("seats", 45);
                train.addClass("SL", sleeper);
                
                Map<String, Object> durontoAc3 = new HashMap<>();
                durontoAc3.put("fare", 1130.0);
                durontoAc3.put("available", "Available");
                durontoAc3.put("seats", 18);
                train.addClass("3A", durontoAc3);
                
                Map<String, Object> durontoAc2 = new HashMap<>();
                durontoAc2.put("fare", 1720.0);
                durontoAc2.put("available", "RAC");
                durontoAc2.put("racStatus", "4");
                train.addClass("2A", durontoAc2);
                break;
                
            default:
                train.setName("Unknown Train");
                train.setFromStation("Unknown");
                train.setToStation("Unknown");
                train.setDepartureTime("00:00");
                train.setArrivalTime("00:00");
                train.setDuration("0h 0m");
                train.setDistance(0);
                train.setRunningDays(new ArrayList<>());
                break;
        }
        
        return train;
    }
}
