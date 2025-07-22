package com.chukchukgo.servlets;

import com.chukchukgo.dao.BookingDAO;
import com.chukchukgo.models.Booking;
import com.chukchukgo.utils.PNRGenerator;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;
import org.json.JSONObject;

/**
 * Servlet for handling ticket cancellations
 */
@WebServlet("/cancel")
public class CancellationServlet extends HttpServlet {
    
    private BookingDAO bookingDAO;
    
    @Override
    public void init() throws ServletException {
        bookingDAO = new BookingDAO();
    }
    
    /**
     * Handles GET requests for cancellation page
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        String pnrNumber = request.getParameter("pnr");
        
        // If no PNR is provided, show the cancellation policy page
        if (pnrNumber == null || pnrNumber.isEmpty()) {
            request.getRequestDispatcher("/WEB-INF/jsp/cancellation_policy.jsp").forward(request, response);
            return;
        }
        
        // Validate PNR format
        if (!PNRGenerator.isValidPNR(pnrNumber)) {
            request.setAttribute("error", "Invalid PNR format. PNR should be a 10-digit number.");
            request.getRequestDispatcher("/WEB-INF/jsp/cancellation_policy.jsp").forward(request, response);
            return;
        }
        
        // Get booking details for the provided PNR
        Booking booking = bookingDAO.getBookingByPNR(pnrNumber);
        
        if (booking == null) {
            request.setAttribute("error", "PNR not found in the system");
            request.getRequestDispatcher("/WEB-INF/jsp/cancellation_policy.jsp").forward(request, response);
            return;
        }
        
        // Check if the booking can be cancelled
        if (!booking.isCanCancel()) {
            request.setAttribute("error", "This ticket cannot be cancelled");
            request.setAttribute("booking", booking);
            request.getRequestDispatcher("/WEB-INF/jsp/cancellation_policy.jsp").forward(request, response);
            return;
        }
        
        // Calculate refund amount based on cancellation policy
        double refundAmount = calculateRefundAmount(booking);
        request.setAttribute("refundAmount", refundAmount);
        
        // Set booking in request for JSP
        request.setAttribute("booking", booking);
        request.getRequestDispatcher("/WEB-INF/jsp/manage_booking.jsp").forward(request, response);
    }
    
    /**
     * Handles POST requests for processing cancellations
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        String pnrNumber = request.getParameter("pnr");
        String email = request.getParameter("email");
        
        try (PrintWriter out = response.getWriter()) {
            JSONObject result = new JSONObject();
            
            // Validate input
            if (pnrNumber == null || pnrNumber.isEmpty() || email == null || email.isEmpty()) {
                result.put("success", false);
                result.put("error", "PNR number and email are required");
                out.print(result.toString());
                return;
            }
            
            // Validate PNR format
            if (!PNRGenerator.isValidPNR(pnrNumber)) {
                result.put("success", false);
                result.put("error", "Invalid PNR format");
                out.print(result.toString());
                return;
            }
            
            // Get booking details
            Booking booking = bookingDAO.getBookingByPNR(pnrNumber);
            
            if (booking == null) {
                result.put("success", false);
                result.put("error", "PNR not found in the system");
                out.print(result.toString());
                return;
            }
            
            // Verify email matches the booking
            if (!email.equals(booking.getContactDetails().getEmail())) {
                result.put("success", false);
                result.put("error", "Email does not match the booking details");
                out.print(result.toString());
                return;
            }
            
            // Check if the booking can be cancelled
            if (!booking.isCanCancel()) {
                result.put("success", false);
                result.put("error", "This ticket cannot be cancelled");
                out.print(result.toString());
                return;
            }
            
            // Calculate refund amount
            double refundAmount = calculateRefundAmount(booking);
            
            // Process cancellation
            boolean cancelled = bookingDAO.cancelBooking(pnrNumber, email);
            
            if (cancelled) {
                result.put("success", true);
                result.put("refundAmount", refundAmount);
                result.put("message", "Your ticket has been successfully cancelled. Refund of ₹" + 
                        refundAmount + " will be processed to your original payment method within 5-7 working days.");
            } else {
                result.put("success", false);
                result.put("error", "Failed to cancel the ticket. Please try again later.");
            }
            
            out.print(result.toString());
        } catch (Exception e) {
            // Log the exception
            getServletContext().log("Error in CancellationServlet", e);
            
            JSONObject result = new JSONObject();
            result.put("success", false);
            result.put("error", "An error occurred: " + e.getMessage());
            
            response.getWriter().print(result.toString());
        }
    }
    
    /**
     * Calculate refund amount based on cancellation policy
     */
    private double calculateRefundAmount(Booking booking) {
        double totalFare = booking.getTotalFare();
        Date journeyDate = booking.getJourneyDate();
        Date currentDate = new Date();
        
        // Calculate hours before departure
        long diffInMillies = journeyDate.getTime() - currentDate.getTime();
        long diffInHours = diffInMillies / (60 * 60 * 1000);
        
        // Determine cancellation charges based on time before departure
        double refundPercentage;
        
        if (diffInHours > 48) {
            // More than 48 hours before departure - 100% refund minus cancellation fee
            refundPercentage = 1.0;
        } else if (diffInHours > 12) {
            // Between 48 and 12 hours before departure - 75% refund minus cancellation fee
            refundPercentage = 0.75;
        } else if (diffInHours > 6) {
            // Between 12 and 6 hours before departure - 50% refund minus cancellation fee
            refundPercentage = 0.5;
        } else {
            // Less than 6 hours before departure - no refund
            refundPercentage = 0.0;
        }
        
        // Apply cancellation fee based on class
        double cancellationFee = 0;
        String travelClass = booking.getTravelClass();
        
        if (travelClass.equals("SL")) {
            cancellationFee = 120 * booking.getPassengers().size();
        } else if (travelClass.equals("3A") || travelClass.equals("2A") || travelClass.equals("1A")) {
            cancellationFee = 240 * booking.getPassengers().size();
        } else {
            cancellationFee = 60 * booking.getPassengers().size(); // For other classes like CC, 2S, etc.
        }
        
        // Calculate refund amount
        double refundAmount = totalFare * refundPercentage;
        if (refundPercentage > 0) {
            refundAmount = Math.max(0, refundAmount - cancellationFee);
        }
        
        return Math.round(refundAmount * 100.0) / 100.0; // Round to 2 decimal places
    }
}
