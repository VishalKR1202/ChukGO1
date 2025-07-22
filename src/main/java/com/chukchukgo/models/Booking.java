package com.chukchukgo.models;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Model class for Booking object.
 * Represents a ticket booking in the system with details of passengers, train, journey, etc.
 */
public class Booking {
    private String pnrNumber;
    private String trainNumber;
    private String trainName;
    private String fromStation;
    private String toStation;
    private Date journeyDate;
    private String departureTime;
    private String arrivalTime;
    private String travelClass;
    private String quota;
    private Date bookingDate;
    private double totalFare;
    private String bookingStatus; // Confirmed, RAC, Waiting
    private String chartStatus; // Prepared, Not Prepared
    private boolean canCancel;
    private List<Passenger> passengers;
    private ContactDetails contactDetails;
    private String paymentMethod;
    private String paymentId;
    private String txnId;

    /**
     * Inner class to represent a Passenger
     */
    public static class Passenger {
        private String name;
        private int age;
        private String gender;
        private String berth;
        private String berthPreference;
        private String concession;
        private String idProofType;
        private String idProofNumber;
        private String bookingStatus;
        private String currentStatus;
        private String coach;

        // Getters and Setters
        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getAge() {
            return age;
        }

        public void setAge(int age) {
            this.age = age;
        }

        public String getGender() {
            return gender;
        }

        public void setGender(String gender) {
            this.gender = gender;
        }

        public String getBerth() {
            return berth;
        }

        public void setBerth(String berth) {
            this.berth = berth;
        }

        public String getBerthPreference() {
            return berthPreference;
        }

        public void setBerthPreference(String berthPreference) {
            this.berthPreference = berthPreference;
        }

        public String getConcession() {
            return concession;
        }

        public void setConcession(String concession) {
            this.concession = concession;
        }

        public String getIdProofType() {
            return idProofType;
        }

        public void setIdProofType(String idProofType) {
            this.idProofType = idProofType;
        }

        public String getIdProofNumber() {
            return idProofNumber;
        }

        public void setIdProofNumber(String idProofNumber) {
            this.idProofNumber = idProofNumber;
        }

        public String getBookingStatus() {
            return bookingStatus;
        }

        public void setBookingStatus(String bookingStatus) {
            this.bookingStatus = bookingStatus;
        }

        public String getCurrentStatus() {
            return currentStatus;
        }

        public void setCurrentStatus(String currentStatus) {
            this.currentStatus = currentStatus;
        }

        public String getCoach() {
            return coach;
        }

        public void setCoach(String coach) {
            this.coach = coach;
        }
    }

    /**
     * Inner class to represent contact details
     */
    public static class ContactDetails {
        private String email;
        private String phone;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }
    }

    /**
     * Default constructor
     */
    public Booking() {
        this.passengers = new ArrayList<>();
        this.contactDetails = new ContactDetails();
        this.bookingDate = new Date(); // Current date as booking date
        this.canCancel = true;
        this.chartStatus = "Chart Not Prepared";
    }

    /**
     * Add a passenger to the booking
     */
    public void addPassenger(Passenger passenger) {
        if (this.passengers == null) {
            this.passengers = new ArrayList<>();
        }
        this.passengers.add(passenger);
    }

    // Getters and Setters
    public String getPnrNumber() {
        return pnrNumber;
    }

    public void setPnrNumber(String pnrNumber) {
        this.pnrNumber = pnrNumber;
    }

    public String getTrainNumber() {
        return trainNumber;
    }

    public void setTrainNumber(String trainNumber) {
        this.trainNumber = trainNumber;
    }

    public String getTrainName() {
        return trainName;
    }

    public void setTrainName(String trainName) {
        this.trainName = trainName;
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

    public Date getJourneyDate() {
        return journeyDate;
    }

    public void setJourneyDate(Date journeyDate) {
        this.journeyDate = journeyDate;
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

    public String getTravelClass() {
        return travelClass;
    }

    public void setTravelClass(String travelClass) {
        this.travelClass = travelClass;
    }

    public String getQuota() {
        return quota;
    }

    public void setQuota(String quota) {
        this.quota = quota;
    }

    public Date getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(Date bookingDate) {
        this.bookingDate = bookingDate;
    }

    public double getTotalFare() {
        return totalFare;
    }

    public void setTotalFare(double totalFare) {
        this.totalFare = totalFare;
    }

    public String getBookingStatus() {
        return bookingStatus;
    }

    public void setBookingStatus(String bookingStatus) {
        this.bookingStatus = bookingStatus;
    }

    public String getChartStatus() {
        return chartStatus;
    }

    public void setChartStatus(String chartStatus) {
        this.chartStatus = chartStatus;
    }

    public boolean isCanCancel() {
        return canCancel;
    }

    public void setCanCancel(boolean canCancel) {
        this.canCancel = canCancel;
    }

    public List<Passenger> getPassengers() {
        return passengers;
    }

    public void setPassengers(List<Passenger> passengers) {
        this.passengers = passengers;
    }

    public ContactDetails getContactDetails() {
        return contactDetails;
    }

    public void setContactDetails(ContactDetails contactDetails) {
        this.contactDetails = contactDetails;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public String getTxnId() {
        return txnId;
    }

    public void setTxnId(String txnId) {
        this.txnId = txnId;
    }

    @Override
    public String toString() {
        return "Booking{" +
                "pnrNumber='" + pnrNumber + '\'' +
                ", trainNumber='" + trainNumber + '\'' +
                ", trainName='" + trainName + '\'' +
                ", fromStation='" + fromStation + '\'' +
                ", toStation='" + toStation + '\'' +
                ", journeyDate=" + journeyDate +
                ", travelClass='" + travelClass + '\'' +
                ", bookingStatus='" + bookingStatus + '\'' +
                ", passengers=" + passengers.size() +
                '}';
    }
}
