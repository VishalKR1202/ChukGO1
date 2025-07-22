package com.chukchukgo.models;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Model class for Train object.
 * Represents a train in the system with its details like number, name, stations, timings, etc.
 */
public class Train {
    private String number;
    private String name;
    private String fromStation;
    private String toStation;
    private String departureTime;
    private String arrivalTime;
    private String duration;
    private List<Integer> runningDays; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    private int distance;
    private Map<String, Map<String, Object>> classes; // Class type -> details (fare, availability, etc.)

    /**
     * Default constructor
     */
    public Train() {
        this.runningDays = new ArrayList<>();
        this.classes = new HashMap<>();
    }

    /**
     * Constructor with parameters
     */
    public Train(String number, String name, String fromStation, String toStation, 
                 String departureTime, String arrivalTime, String duration, 
                 List<Integer> runningDays, int distance) {
        this.number = number;
        this.name = name;
        this.fromStation = fromStation;
        this.toStation = toStation;
        this.departureTime = departureTime;
        this.arrivalTime = arrivalTime;
        this.duration = duration;
        this.runningDays = runningDays;
        this.distance = distance;
        this.classes = new HashMap<>();
    }

    /**
     * Add a travel class with its details
     */
    public void addClass(String classType, Map<String, Object> classDetails) {
        this.classes.put(classType, classDetails);
    }

    /**
     * Check if the train has a particular travel class
     */
    public boolean hasClass(String classType) {
        return this.classes.containsKey(classType);
    }

    /**
     * Get the fare for a specific travel class
     */
    public double getFare(String classType) {
        if (hasClass(classType) && this.classes.get(classType).containsKey("fare")) {
            return (double) this.classes.get(classType).get("fare");
        }
        return 0.0;
    }

    // Getters and Setters
    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFromStation() {
        return fromStation;
    }

    public void setFromStation(String fromStation) {
        this.fromStation = fromStation;
    }

    public String getToStation() {
        return toStation;
    }

    public void setToStation(String toStation) {
        this.toStation = toStation;
    }

    public String getDepartureTime() {
        return departureTime;
    }

    public void setDepartureTime(String departureTime) {
        this.departureTime = departureTime;
    }

    public String getArrivalTime() {
        return arrivalTime;
    }

    public void setArrivalTime(String arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public List<Integer> getRunningDays() {
        return runningDays;
    }

    public void setRunningDays(List<Integer> runningDays) {
        this.runningDays = runningDays;
    }

    public int getDistance() {
        return distance;
    }

    public void setDistance(int distance) {
        this.distance = distance;
    }

    public Map<String, Map<String, Object>> getClasses() {
        return classes;
    }

    public void setClasses(Map<String, Map<String, Object>> classes) {
        this.classes = classes;
    }

    @Override
    public String toString() {
        return "Train{" +
                "number='" + number + '\'' +
                ", name='" + name + '\'' +
                ", fromStation='" + fromStation + '\'' +
                ", toStation='" + toStation + '\'' +
                ", departureTime='" + departureTime + '\'' +
                ", arrivalTime='" + arrivalTime + '\'' +
                ", duration='" + duration + '\'' +
                ", runningDays=" + runningDays +
                ", distance=" + distance +
                ", classes=" + classes +
                '}';
    }
}
