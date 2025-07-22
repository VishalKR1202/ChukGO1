package com.chukchukgo.utils;

import java.util.Random;

/**
 * Utility class for generating unique PNR (Passenger Name Record) numbers.
 */
public class PNRGenerator {
    private static final Random RANDOM = new Random();
    
    /**
     * Private constructor to prevent instantiation
     */
    private PNRGenerator() {
        // Private constructor to hide the implicit public one
    }
    
    /**
     * Generates a unique 10-digit PNR number
     * @return A randomly generated PNR number
     */
    public static String generatePNR() {
        // PNR numbers are typically 10 digits
        // In a real system, this would ensure uniqueness against existing PNRs
        
        // To ensure 10 digits, start with a minimum 10-digit number
        long min = 1000000000L;
        long max = 9999999999L;
        
        // Generate random number between min and max (inclusive)
        long pnrNumber = min + ((long) (RANDOM.nextDouble() * (max - min)));
        
        return String.valueOf(pnrNumber);
    }
    
    /**
     * Validates if a PNR number format is correct
     * @param pnr The PNR number to validate
     * @return true if the PNR is valid, false otherwise
     */
    public static boolean isValidPNR(String pnr) {
        // Check if PNR is null or empty
        if (pnr == null || pnr.isEmpty()) {
            return false;
        }
        
        // Check if PNR is 10 digits
        if (pnr.length() != 10) {
            return false;
        }
        
        // Check if PNR contains only digits
        try {
            Long.parseLong(pnr);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
