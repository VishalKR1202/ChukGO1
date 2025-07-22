package com.chukchukgo.models;

/**
 * Model class for Station object.
 * Represents a railway station in the system with details.
 */
public class Station {
    private String code;
    private String name;
    private String city;
    private String state;
    private double latitude;
    private double longitude;
    private int platformCount;
    private boolean hasClockRoom;
    private boolean hasWaitingRoom;
    private boolean hasRefreshmentRoom;
    private String zone; // NR, SR, ER, WR, etc.

    /**
     * Default constructor
     */
    public Station() {
    }

    /**
     * Constructor with basic parameters
     */
    public Station(String code, String name, String city, String state) {
        this.code = code;
        this.name = name;
        this.city = city;
        this.state = state;
    }

    /**
     * Constructor with all parameters
     */
    public Station(String code, String name, String city, String state, 
                  double latitude, double longitude, int platformCount, 
                  boolean hasClockRoom, boolean hasWaitingRoom, 
                  boolean hasRefreshmentRoom, String zone) {
        this.code = code;
        this.name = name;
        this.city = city;
        this.state = state;
        this.latitude = latitude;
        this.longitude = longitude;
        this.platformCount = platformCount;
        this.hasClockRoom = hasClockRoom;
        this.hasWaitingRoom = hasWaitingRoom;
        this.hasRefreshmentRoom = hasRefreshmentRoom;
        this.zone = zone;
    }

    /**
     * Returns a formatted display name with city if different from name
     */
    public String getDisplayName() {
        if (name.equals(city)) {
            return name + " (" + code + ")";
        } else {
            return name + ", " + city + " (" + code + ")";
        }
    }
    
    /**
     * Calculate distance between two stations using Haversine formula
     */
    public double distanceTo(Station other) {
        if (other == null || this.latitude == 0 || this.longitude == 0 || 
            other.latitude == 0 || other.longitude == 0) {
            return 0;
        }
        
        // Haversine formula
        double earthRadius = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(other.latitude - this.latitude);
        double lonDistance = Math.toRadians(other.longitude - this.longitude);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                 + Math.cos(Math.toRadians(this.latitude)) * Math.cos(Math.toRadians(other.latitude))
                 * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    // Getters and Setters
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public int getPlatformCount() {
        return platformCount;
    }

    public void setPlatformCount(int platformCount) {
        this.platformCount = platformCount;
    }

    public boolean isHasClockRoom() {
        return hasClockRoom;
    }

    public void setHasClockRoom(boolean hasClockRoom) {
        this.hasClockRoom = hasClockRoom;
    }

    public boolean isHasWaitingRoom() {
        return hasWaitingRoom;
    }

    public void setHasWaitingRoom(boolean hasWaitingRoom) {
        this.hasWaitingRoom = hasWaitingRoom;
    }

    public boolean isHasRefreshmentRoom() {
        return hasRefreshmentRoom;
    }

    public void setHasRefreshmentRoom(boolean hasRefreshmentRoom) {
        this.hasRefreshmentRoom = hasRefreshmentRoom;
    }

    public String getZone() {
        return zone;
    }

    public void setZone(String zone) {
        this.zone = zone;
    }

    @Override
    public String toString() {
        return "Station{" +
                "code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", city='" + city + '\'' +
                ", state='" + state + '\'' +
                ", zone='" + zone + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Station station = (Station) obj;
        return code.equals(station.code);
    }

    @Override
    public int hashCode() {
        return code.hashCode();
    }
}
