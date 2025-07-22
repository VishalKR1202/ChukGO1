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
import java.text.SimpleDateFormat;
import org.json.JSONObject;
import org.json.JSONArray;

/**
 * Servlet for handling PNR status check
 */
@WebServlet("/pnr")
public class PNRServlet extends HttpServlet {
    
    private BookingDAO bookingDAO;
    
    @Override
    public void init() throws ServletException {
        bookingDAO = new BookingDAO();
    }
    
    /**
     * Handles GET requests for PNR status
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        String pnrNumber = request.getParameter("pnr");
        String outputFormat = request.getParameter("format");
        
        // Check if PNR is provided
        if (pnrNumber == null || pnrNumber.isEmpty()) {
            if ("json".equals(outputFormat)) {
                sendJSONError(response, "PNR number is required", HttpServletResponse.SC_BAD_REQUEST);
            } else {
                // Forward to PNR status page without data
                request.getRequestDispatcher("/WEB-INF/jsp/pnr_status.jsp").forward(request, response);
            }
            return;
        }
        
        // Validate PNR format
        if (!PNRGenerator.isValidPNR(pnrNumber)) {
            if ("json".equals(outputFormat)) {
                sendJSONError(response, "Invalid PNR format. PNR should be a 10-digit number.", 
                        HttpServletResponse.SC_BAD_REQUEST);
            } else {
                request.setAttribute("error", "Invalid PNR format. PNR should be a 10-digit number.");
                request.getRequestDispatcher("/WEB-INF/jsp/pnr_status.jsp").forward(request, response);
            }
            return;
        }
        
        // Get booking details by PNR
        Booking booking = bookingDAO.getBookingByPNR(pnrNumber);
        
        if (booking == null) {
            if ("json".equals(outputFormat)) {
                sendJSONError(response, "PNR not found in the system", HttpServletResponse.SC_NOT_FOUND);
            } else {
                request.setAttribute("error", "PNR not found in the system");
                request.getRequestDispatcher("/WEB-INF/jsp/pnr_status.jsp").forward(request, response);
            }
            return;
        }
        
        // Return booking details based on requested format
        if ("json".equals(outputFormat)) {
            sendJSONResponse(response, booking);
        } else {
            // Set booking in request and forward to JSP
            request.setAttribute("booking", booking);
            request.getRequestDispatcher("/WEB-INF/jsp/pnr_status.jsp").forward(request, response);
        }
    }
    
    /**
     * Send JSON error response
     */
    private void sendJSONError(HttpServletResponse response, String message, int statusCode) 
            throws IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setStatus(statusCode);
        
        JSONObject error = new JSONObject();
        error.put("error", message);
        
        PrintWriter out = response.getWriter();
        out.print(error.toString());
        out.flush();
    }
    
    /**
     * Send booking details as JSON response
     */
    private void sendJSONResponse(HttpServletResponse response, Booking booking) 
            throws IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        JSONObject result = new JSONObject();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        
        // Add booking details
        result.put("pnrNumber", booking.getPnrNumber());
        result.put("trainNumber", booking.getTrainNumber());
        result.put("trainName", booking.getTrainName());
        result.put("fromStation", booking.getFromStation());
        result.put("toStation", booking.getToStation());
        result.put("journeyDate", dateFormat.format(booking.getJourneyDate()));
        result.put("bookingDate", dateFormat.format(booking.getBookingDate()));
        result.put("departureTime", booking.getDepartureTime());
        result.put("arrivalTime", booking.getArrivalTime());
        result.put("travelClass", booking.getTravelClass());
        result.put("bookingStatus", booking.getBookingStatus());
        result.put("chartStatus", booking.getChartStatus());
        result.put("canCancel", booking.isCanCancel());
        
        // Add passengers
        JSONArray passengersArray = new JSONArray();
        for (Booking.Passenger passenger : booking.getPassengers()) {
            JSONObject passengerObj = new JSONObject();
            
            passengerObj.put("name", passenger.getName());
            passengerObj.put("age", passenger.getAge());
            passengerObj.put("gender", passenger.getGender());
            passengerObj.put("bookingStatus", passenger.getBookingStatus());
            passengerObj.put("status", passenger.getCurrentStatus());
            
            if (passenger.getCoach() != null) {
                passengerObj.put("coach", passenger.getCoach());
            }
            
            if (passenger.getBerth() != null) {
                passengerObj.put("berth", passenger.getBerth());
            }
            
            passengersArray.put(passengerObj);
        }
        
        result.put("passengers", passengersArray);
        
        PrintWriter out = response.getWriter();
        out.print(result.toString());
        out.flush();
    }
}
