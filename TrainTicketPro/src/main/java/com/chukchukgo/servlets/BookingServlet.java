package com.chukchukgo.servlets;

import com.chukchukgo.dao.BookingDAO;
import com.chukchukgo.dao.TrainDAO;
import com.chukchukgo.models.Booking;
import com.chukchukgo.models.Train;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import org.json.JSONObject;
import org.json.JSONArray;

/**
 * Servlet for handling ticket booking requests
 */
@WebServlet("/booking")
public class BookingServlet extends HttpServlet {
    
    private TrainDAO trainDAO;
    private BookingDAO bookingDAO;
    
    @Override
    public void init() throws ServletException {
        trainDAO = new TrainDAO();
        bookingDAO = new BookingDAO();
    }
    
    /**
     * Handles GET requests for booking page
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        String trainNumber = request.getParameter("train");
        String journeyDate = request.getParameter("date");
        String travelClass = request.getParameter("class");
        String fromStation = request.getParameter("from");
        String toStation = request.getParameter("to");
        
        // Validate required parameters
        if (trainNumber == null || journeyDate == null || travelClass == null || 
            fromStation == null || toStation == null) {
            response.sendRedirect("index.html");
            return;
        }
        
        // Get train details
        Train train = trainDAO.getTrainByNumber(trainNumber);
        
        if (train == null) {
            response.sendRedirect("index.html");
            return;
        }
        
        // Store details in request for JSP
        request.setAttribute("train", train);
        request.setAttribute("journeyDate", journeyDate);
        request.setAttribute("travelClass", travelClass);
        request.setAttribute("fromStation", fromStation);
        request.setAttribute("toStation", toStation);
        
        // Forward to booking form JSP
        request.getRequestDispatcher("/WEB-INF/jsp/booking_form.jsp").forward(request, response);
    }
    
    /**
     * Handles POST requests for submitting booking
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        try (PrintWriter out = response.getWriter()) {
            JSONObject result = new JSONObject();
            
            try {
                // Parse booking data from request
                JSONObject bookingData = parseRequestJSON(request);
                
                // Validate booking data
                if (!validateBookingData(bookingData)) {
                    result.put("success", false);
                    result.put("error", "Invalid booking data");
                    out.print(result.toString());
                    return;
                }
                
                // Create booking object
                Booking booking = createBookingFromJSON(bookingData);
                
                // Save booking to database
                String pnrNumber = bookingDAO.createBooking(booking);
                
                if (pnrNumber != null) {
                    // Booking successful
                    result.put("success", true);
                    result.put("pnr", pnrNumber);
                    
                    // Store PNR in session for confirmation page
                    HttpSession session = request.getSession();
                    session.setAttribute("lastBookingPNR", pnrNumber);
                } else {
                    // Booking failed
                    result.put("success", false);
                    result.put("error", "Failed to create booking");
                }
                
            } catch (Exception e) {
                // Log the exception
                getServletContext().log("Error in BookingServlet", e);
                
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
     * Validate booking data
     */
    private boolean validateBookingData(JSONObject bookingData) {
        // Check for required fields
        if (!bookingData.has("trainNumber") || !bookingData.has("trainName") ||
            !bookingData.has("fromStation") || !bookingData.has("toStation") ||
            !bookingData.has("journeyDate") || !bookingData.has("travelClass") ||
            !bookingData.has("passengers") || !bookingData.has("contactDetails")) {
            return false;
        }
        
        // Validate passengers
        JSONArray passengers = bookingData.getJSONArray("passengers");
        if (passengers.length() == 0 || passengers.length() > 6) {
            return false;
        }
        
        for (int i = 0; i < passengers.length(); i++) {
            JSONObject passenger = passengers.getJSONObject(i);
            if (!passenger.has("name") || !passenger.has("age") || !passenger.has("gender")) {
                return false;
            }
        }
        
        // Validate contact details
        JSONObject contactDetails = bookingData.getJSONObject("contactDetails");
        if (!contactDetails.has("email") || !contactDetails.has("phone")) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Create Booking object from JSON data
     */
    private Booking createBookingFromJSON(JSONObject bookingData) throws ParseException {
        Booking booking = new Booking();
        
        booking.setTrainNumber(bookingData.getString("trainNumber"));
        booking.setTrainName(bookingData.getString("trainName"));
        booking.setFromStation(bookingData.getString("fromStation"));
        booking.setToStation(bookingData.getString("toStation"));
        
        // Parse journey date
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        booking.setJourneyDate(dateFormat.parse(bookingData.getString("journeyDate")));
        
        booking.setDepartureTime(bookingData.getString("departureTime"));
        booking.setArrivalTime(bookingData.getString("arrivalTime"));
        booking.setTravelClass(bookingData.getString("travelClass"));
        
        // Set quota (default to General if not provided)
        booking.setQuota(bookingData.has("quota") ? bookingData.getString("quota") : "GN");
        
        booking.setTotalFare(bookingData.getDouble("totalFare"));
        booking.setBookingStatus("Confirmed"); // Initial status
        booking.setChartStatus("Chart Not Prepared");
        booking.setCanCancel(true);
        
        // Set payment details
        booking.setPaymentMethod(bookingData.getString("paymentMethod"));
        if (bookingData.has("paymentId")) {
            booking.setPaymentId(bookingData.getString("paymentId"));
        }
        if (bookingData.has("txnId")) {
            booking.setTxnId(bookingData.getString("txnId"));
        }
        
        // Set contact details
        JSONObject contactData = bookingData.getJSONObject("contactDetails");
        Booking.ContactDetails contactDetails = new Booking.ContactDetails();
        contactDetails.setEmail(contactData.getString("email"));
        contactDetails.setPhone(contactData.getString("phone"));
        booking.setContactDetails(contactDetails);
        
        // Add passengers
        JSONArray passengersData = bookingData.getJSONArray("passengers");
        for (int i = 0; i < passengersData.length(); i++) {
            JSONObject passengerData = passengersData.getJSONObject(i);
            
            Booking.Passenger passenger = new Booking.Passenger();
            passenger.setName(passengerData.getString("name"));
            passenger.setAge(passengerData.getInt("age"));
            passenger.setGender(passengerData.getString("gender"));
            
            if (passengerData.has("berthPreference")) {
                passenger.setBerthPreference(passengerData.getString("berthPreference"));
            }
            
            if (passengerData.has("concession")) {
                passenger.setConcession(passengerData.getString("concession"));
                
                if (!passengerData.getString("concession").equals("NONE") && 
                    passengerData.has("idProofType") && passengerData.has("idProofNumber")) {
                    passenger.setIdProofType(passengerData.getString("idProofType"));
                    passenger.setIdProofNumber(passengerData.getString("idProofNumber"));
                }
            } else {
                passenger.setConcession("NONE");
            }
            
            // Set initial status
            // In a real system, this would be determined based on availability
            if (i < 2) {
                // First 2 passengers confirmed with coach and berth
                passenger.setBookingStatus("CNF/B4/" + (32 + i));
                passenger.setCurrentStatus("CNF/B4/" + (32 + i));
                passenger.setCoach("B4");
                passenger.setBerth((32 + i) + (i % 2 == 0 ? " LB" : " MB"));
            } else {
                // Other passengers in RAC/WL
                passenger.setBookingStatus("RAC " + (i - 1));
                passenger.setCurrentStatus("RAC " + (i - 1));
            }
            
            booking.addPassenger(passenger);
        }
        
        return booking;
    }
}
