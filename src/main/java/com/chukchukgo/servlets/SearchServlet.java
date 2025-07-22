package com.chukchukgo.servlets;

import com.chukchukgo.dao.TrainDAO;
import com.chukchukgo.models.Train;
import java.io.IOException;
import java.io.PrintWriter;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Servlet for handling train search requests
 */
@WebServlet("/search")
public class SearchServlet extends HttpServlet {
    
    private TrainDAO trainDAO;
    
    @Override
    public void init() throws ServletException {
        trainDAO = new TrainDAO();
    }
    
    /**
     * Handles GET requests for train search
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        // Set the response content type to JSON
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        try (PrintWriter out = response.getWriter()) {
            try {
                // Extract search parameters
                String fromStation = request.getParameter("from");
                String toStation = request.getParameter("to");
                String journeyDate = request.getParameter("date");
                String travelClass = request.getParameter("class");
                String quota = request.getParameter("quota");
                
                // Validate required parameters
                if (fromStation == null || toStation == null || journeyDate == null) {
                    respondWithError(out, "Missing required parameters", HttpServletResponse.SC_BAD_REQUEST);
                    return;
                }
                
                // Validate date format
                SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                dateFormat.setLenient(false);
                Date parsedDate;
                
                try {
                    parsedDate = dateFormat.parse(journeyDate);
                    
                    // Check if date is in the past
                    if (parsedDate.before(new Date())) {
                        respondWithError(out, "Journey date cannot be in the past", HttpServletResponse.SC_BAD_REQUEST);
                        return;
                    }
                } catch (ParseException e) {
                    respondWithError(out, "Invalid date format. Use yyyy-MM-dd", HttpServletResponse.SC_BAD_REQUEST);
                    return;
                }
                
                // Search for trains using DAO
                List<Train> trains = trainDAO.searchTrains(fromStation, toStation, journeyDate, travelClass, quota);
                
                // Convert trains to JSON and return
                JSONArray trainsArray = convertTrainsToJSON(trains, journeyDate);
                out.print(trainsArray.toString());
                
            } catch (Exception e) {
                // Log the exception
                getServletContext().log("Error in SearchServlet", e);
                respondWithError(out, "An error occurred during search: " + e.getMessage(), 
                        HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }
    
    /**
     * Handles POST requests (could be used for advanced search features)
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        // For now, just redirect to GET method
        doGet(request, response);
    }
    
    /**
     * Converts a list of Train objects to a JSON array
     */
    private JSONArray convertTrainsToJSON(List<Train> trains, String journeyDate) {
        JSONArray trainsArray = new JSONArray();
        
        for (Train train : trains) {
            JSONObject trainObj = new JSONObject();
            
            trainObj.put("number", train.getNumber());
            trainObj.put("name", train.getName());
            trainObj.put("fromStation", train.getFromStation());
            trainObj.put("toStation", train.getToStation());
            trainObj.put("departureTime", train.getDepartureTime());
            trainObj.put("arrivalTime", train.getArrivalTime());
            trainObj.put("journeyDate", journeyDate);
            
            // Calculate arrival date if it spans to next day
            String depTime = train.getDepartureTime();
            String arrTime = train.getArrivalTime();
            if (isNextDayArrival(depTime, arrTime)) {
                // Add 1 day to journey date for arrival date
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                try {
                    Date date = sdf.parse(journeyDate);
                    Date nextDay = new Date(date.getTime() + 86400000); // Add 24 hours in milliseconds
                    trainObj.put("arrivalDate", sdf.format(nextDay));
                } catch (ParseException e) {
                    // Default to journey date if parsing fails
                    trainObj.put("arrivalDate", journeyDate);
                }
            } else {
                trainObj.put("arrivalDate", journeyDate);
            }
            
            trainObj.put("duration", train.getDuration());
            trainObj.put("runningDays", new JSONArray(train.getRunningDays()));
            trainObj.put("distance", train.getDistance());
            
            // Add travel classes with availability
            JSONObject classesObj = new JSONObject();
            train.getClasses().forEach((classType, classInfo) -> {
                classesObj.put(classType, new JSONObject(classInfo));
            });
            trainObj.put("classes", classesObj);
            
            trainsArray.put(trainObj);
        }
        
        return trainsArray;
    }
    
    /**
     * Determines if the arrival time is on the next day
     */
    private boolean isNextDayArrival(String departureTime, String arrivalTime) {
        try {
            SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm");
            Date depTime = timeFormat.parse(departureTime);
            Date arrTime = timeFormat.parse(arrivalTime);
            
            // If arrival time is earlier than departure time, it's likely the next day
            return arrTime.before(depTime);
        } catch (ParseException e) {
            return false;
        }
    }
    
    /**
     * Responds with an error message in JSON format
     */
    private void respondWithError(PrintWriter out, String message, int statusCode) {
        JSONObject errorObj = new JSONObject();
        errorObj.put("error", message);
        
        out.print(errorObj.toString());
    }
}
