package com.chukchukgo.servlets;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import org.json.JSONObject;

/**
 * Servlet for handling payment processing
 */
@WebServlet("/payment")
public class PaymentServlet extends HttpServlet {
    
    @Override
    public void init() throws ServletException {
        // Initialization code if needed
    }
    
    /**
     * Handles GET requests for payment page
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        // Check if there's booking data in session
        if (request.getSession().getAttribute("bookingData") == null) {
            response.sendRedirect("index.html");
            return;
        }
        
        // Forward to payment page
        request.getRequestDispatcher("/WEB-INF/jsp/payment.jsp").forward(request, response);
    }
    
    /**
     * Handles POST requests for processing payments
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        try (PrintWriter out = response.getWriter()) {
            JSONObject result = new JSONObject();
            
            try {
                // Parse payment data from request
                JSONObject paymentData = parseRequestJSON(request);
                
                // Validate payment data
                if (!validatePaymentData(paymentData)) {
                    result.put("success", false);
                    result.put("error", "Invalid payment data");
                    out.print(result.toString());
                    return;
                }
                
                // Process payment (in a real application, this would interact with a payment gateway)
                JSONObject paymentResult = processPayment(paymentData);
                
                if (paymentResult.getBoolean("success")) {
                    // Payment successful
                    result.put("success", true);
                    result.put("paymentId", paymentResult.getString("paymentId"));
                    result.put("txnId", paymentResult.getString("txnId"));
                    
                    // Store payment details in session for booking process
                    request.getSession().setAttribute("paymentResult", paymentResult.toString());
                } else {
                    // Payment failed
                    result.put("success", false);
                    result.put("error", paymentResult.getString("error"));
                }
                
            } catch (Exception e) {
                // Log the exception
                getServletContext().log("Error in PaymentServlet", e);
                
                result.put("success", false);
                result.put("error", "An error occurred: " + e.getMessage());
            }
            
            out.print(result.toString());
        }
    }
    
    /**
     * Parse JSON data from request body
     */
    private JSONObject parseRequestJSON(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        String line;
        
        while ((line = request.getReader().readLine()) != null) {
            sb.append(line);
        }
        
        return new JSONObject(sb.toString());
    }
    
    /**
     * Validate payment data
     */
    private boolean validatePaymentData(JSONObject paymentData) {
        // Check for required fields
        if (!paymentData.has("paymentMethod") || !paymentData.has("amount")) {
            return false;
        }
        
        String paymentMethod = paymentData.getString("paymentMethod");
        
        // Validate based on payment method
        switch (paymentMethod) {
            case "card":
                if (!paymentData.has("cardNumber") || !paymentData.has("expiryDate") || 
                    !paymentData.has("cvv") || !paymentData.has("cardName")) {
                    return false;
                }
                break;
                
            case "upi":
                if (!paymentData.has("upiId")) {
                    return false;
                }
                break;
                
            case "netbanking":
                if (!paymentData.has("bank")) {
                    return false;
                }
                break;
                
            case "wallet":
                if (!paymentData.has("walletType")) {
                    return false;
                }
                break;
                
            default:
                return false;
        }
        
        return true;
    }
    
    /**
     * Process payment (mock implementation)
     */
    private JSONObject processPayment(JSONObject paymentData) {
        JSONObject result = new JSONObject();
        
        // In a real application, this would call a payment gateway API
        // For demonstration, create a simulated response
        
        // Random success/failure (95% success rate for demo)
        boolean isSuccessful = Math.random() < 0.95;
        
        if (isSuccessful) {
            result.put("success", true);
            result.put("paymentId", "pay_" + generateRandomId(16));
            result.put("txnId", "txn_" + generateRandomId(14));
            result.put("paymentMethod", paymentData.getString("paymentMethod"));
            result.put("amount", paymentData.getDouble("amount"));
            result.put("currency", "INR");
            result.put("timestamp", System.currentTimeMillis());
        } else {
            result.put("success", false);
            
            // Generate a realistic error message based on payment method
            String paymentMethod = paymentData.getString("paymentMethod");
            String errorMessage;
            
            switch (paymentMethod) {
                case "card":
                    errorMessage = "Card payment declined. Please check your card details or try another card.";
                    break;
                case "upi":
                    errorMessage = "UPI transaction failed. Please check your UPI ID or try another payment method.";
                    break;
                case "netbanking":
                    errorMessage = "Netbanking transaction could not be completed. Bank server might be busy.";
                    break;
                case "wallet":
                    errorMessage = "Wallet payment failed. Insufficient balance or service unavailable.";
                    break;
                default:
                    errorMessage = "Payment processing failed. Please try again later.";
            }
            
            result.put("error", errorMessage);
        }
        
        return result;
    }
    
    /**
     * Generate a random alphanumeric ID of specified length
     */
    private String generateRandomId(int length) {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        
        for (int i = 0; i < length; i++) {
            int index = (int) (Math.random() * characters.length());
            sb.append(characters.charAt(index));
        }
        
        return sb.toString();
    }
}
