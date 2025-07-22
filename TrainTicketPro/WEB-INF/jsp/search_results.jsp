<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Results - ChukChukGO</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.css">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/main.css">
    <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
</head>
<body>
    <jsp:include page="includes/header.jsp" />
    
    <section class="py-5">
        <div class="container">
            <h2 class="section-title text-center mb-4">Available Trains</h2>
            
            <div class="alert alert-info">
                <div class="d-flex">
                    <i data-feather="info" class="me-2"></i>
                    <div>
                        <strong>Journey Details:</strong> 
                        <span id="journeySummary">
                            ${param.from} to ${param.to} | 
                            <fmt:formatDate value="${param.date}" pattern="EEE, dd MMM yyyy" /> | 
                            ${param.passengers} passenger(s) | 
                            ${param.class}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="train-filters mb-3">
                <div class="row">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text">Sort By</span>
                            <select class="form-select" id="sortTrains">
                                <option value="departure">Departure Time</option>
                                <option value="duration">Duration</option>
                                <option value="price">Price</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text">Filter</span>
                            <select class="form-select" id="filterTrains">
                                <option value="all">All Trains</option>
                                <option value="morning">Morning Departure</option>
                                <option value="afternoon">Afternoon Departure</option>
                                <option value="evening">Evening Departure</option>
                                <option value="night">Night Departure</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Date Navigation -->
            <div class="date-nav">
                <a href="search?from=${param.from}&to=${param.to}&date=${previousDate}&class=${param.class}&passengers=${param.passengers}" class="btn btn-sm btn-outline-primary date-nav-btn">
                    <i data-feather="chevron-left"></i> Previous Day
                </a>
                <div class="date-display">
                    <fmt:formatDate value="${param.date}" pattern="EEE, dd MMM yyyy" />
                </div>
                <a href="search?from=${param.from}&to=${param.to}&date=${nextDate}&class=${param.class}&passengers=${param.passengers}" class="btn btn-sm btn-outline-primary date-nav-btn">
                    Next Day <i data-feather="chevron-right"></i>
                </a>
            </div>
            
            <div id="trainList" class="train-list">
                <c:choose>
                    <c:when test="${empty trains}">
                        <div class="alert alert-warning">
                            <i data-feather="alert-circle" class="me-2"></i>
                            No trains found for your search criteria. Please try different dates or stations.
                        </div>
                    </c:when>
                    <c:otherwise>
                        <c:forEach var="train" items="${trains}" varStatus="status">
                            <div class="train-details" id="train-${status.index}">
                                <div class="train-info">
                                    <div class="train-info-primary">
                                        <div class="train-number-name">${train.number} - ${train.name}</div>
                                        <div class="train-runs-on">Runs on: 
                                            <c:forEach var="day" items="${train.runningDays}" varStatus="dayStatus">
                                                <c:choose>
                                                    <c:when test="${day == 0}">Sun</c:when>
                                                    <c:when test="${day == 1}">Mon</c:when>
                                                    <c:when test="${day == 2}">Tue</c:when>
                                                    <c:when test="${day == 3}">Wed</c:when>
                                                    <c:when test="${day == 4}">Thu</c:when>
                                                    <c:when test="${day == 5}">Fri</c:when>
                                                    <c:when test="${day == 6}">Sat</c:when>
                                                </c:choose>
                                                <c:if test="${!dayStatus.last}">, </c:if>
                                            </c:forEach>
                                        </div>
                                    </div>
                                    <div class="train-info-secondary">
                                        <span class="badge bg-success">${train.quota} Quota</span>
                                    </div>
                                </div>
                                
                                <div class="train-timing">
                                    <div class="train-departure">
                                        <div class="train-time">${train.departureTime}</div>
                                        <div class="train-station">${train.fromStation}</div>
                                        <div class="train-date">
                                            <fmt:formatDate value="${param.date}" pattern="dd MMM" />
                                        </div>
                                    </div>
                                    
                                    <div class="train-duration">
                                        <div class="train-duration-time">${train.duration}</div>
                                        <div>Duration</div>
                                    </div>
                                    
                                    <div class="train-arrival">
                                        <div class="train-time">${train.arrivalTime}</div>
                                        <div class="train-station">${train.toStation}</div>
                                        <div class="train-date">
                                            <c:choose>
                                                <c:when test="${train.arrivalDate != param.date}">
                                                    <fmt:formatDate value="${train.arrivalDate}" pattern="dd MMM" />
                                                </c:when>
                                                <c:otherwise>
                                                    <fmt:formatDate value="${param.date}" pattern="dd MMM" />
                                                </c:otherwise>
                                            </c:choose>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="train-fare-seats">
                                    <c:forEach var="entry" items="${train.classes}">
                                        <c:set var="classType" value="${entry.key}" />
                                        <c:set var="classInfo" value="${entry.value}" />
                                        
                                        <c:if test="${not empty classInfo.available}">
                                            <c:set var="availabilityClass" value="" />
                                            <c:set var="availabilityText" value="" />
                                            
                                            <c:choose>
                                                <c:when test="${classInfo.available == 'Available'}">
                                                    <c:set var="availabilityClass" value="avl-available" />
                                                    <c:set var="availabilityText" value="Avl ${classInfo.seats}" />
                                                </c:when>
                                                <c:when test="${classInfo.available == 'RAC'}">
                                                    <c:set var="availabilityClass" value="avl-rac" />
                                                    <c:set var="availabilityText" value="RAC ${classInfo.racStatus}" />
                                                </c:when>
                                                <c:otherwise>
                                                    <c:set var="availabilityClass" value="avl-waiting" />
                                                    <c:set var="availabilityText" value="WL ${classInfo.waitlist}" />
                                                </c:otherwise>
                                            </c:choose>
                                            
                                            <div class="train-class" data-train-index="${status.index}" data-class-type="${classType}" 
                                                 onclick="selectTrainClass(${status.index}, '${classType}')">
                                                <div class="class-type">
                                                    <c:choose>
                                                        <c:when test="${classType == 'SL'}">Sleeper Class</c:when>
                                                        <c:when test="${classType == '3A'}">AC 3 Tier</c:when>
                                                        <c:when test="${classType == '2A'}">AC 2 Tier</c:when>
                                                        <c:when test="${classType == '1A'}">AC First Class</c:when>
                                                        <c:when test="${classType == 'CC'}">Chair Car</c:when>
                                                        <c:when test="${classType == 'EC'}">Executive Class</c:when>
                                                        <c:when test="${classType == '2S'}">Second Sitting</c:when>
                                                        <c:otherwise>${classType}</c:otherwise>
                                                    </c:choose>
                                                </div>
                                                <div class="class-fare">₹ ${classInfo.fare}</div>
                                                <div class="class-availability ${availabilityClass}">${availabilityText}</div>
                                            </div>
                                        </c:if>
                                    </c:forEach>
                                </div>
                            </div>
                        </c:forEach>
                    </c:otherwise>
                </c:choose>
            </div>
        </div>
    </section>
    
    <jsp:include page="includes/footer.jsp" />
    
    <!-- Train Class selection and proceed to booking -->
    <script>
        let selectedTrain = null;
        let selectedClass = null;
        
        function selectTrainClass(trainIndex, classType) {
            // Reset previously selected class
            document.querySelectorAll('.train-class').forEach(el => {
                el.classList.remove('train-class-selected');
            });
            
            // Highlight selected class
            const selectedElement = document.querySelector(`.train-class[data-train-index="${trainIndex}"][data-class-type="${classType}"]`);
            if (selectedElement) {
                selectedElement.classList.add('train-class-selected');
            }
            
            // Store selected train and class
            selectedTrain = trainIndex;
            selectedClass = classType;
            
            // Add book button if not already present
            const trainCard = document.getElementById(`train-${trainIndex}`);
            let bookBtn = trainCard.querySelector('.book-btn-container');
            
            if (!bookBtn) {
                const btnContainer = document.createElement('div');
                btnContainer.className = 'book-btn-container';
                btnContainer.innerHTML = `
                    <button class="btn btn-primary" onclick="proceedToBooking(${trainIndex}, '${classType}')">
                        <i data-feather="check-circle"></i> Book ${getClassFullName(classType)}
                    </button>
                `;
                trainCard.appendChild(btnContainer);
                feather.replace();
            } else {
                bookBtn.innerHTML = `
                    <button class="btn btn-primary" onclick="proceedToBooking(${trainIndex}, '${classType}')">
                        <i data-feather="check-circle"></i> Book ${getClassFullName(classType)}
                    </button>
                `;
                feather.replace();
            }
        }
        
        function proceedToBooking(trainIndex, classType) {
            // Get train details
            const trainNumber = '${trains[trainIndex].number}';
            const fromStation = '${param.from}';
            const toStation = '${param.to}';
            const journeyDate = '${param.date}';
            
            // Redirect to booking page
            window.location.href = `booking?train=${trainNumber}&from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}&date=${journeyDate}&class=${classType}`;
        }
        
        function getClassFullName(classCode) {
            const classMap = {
                'SL': 'Sleeper Class',
                '3A': 'AC 3 Tier',
                '2A': 'AC 2 Tier',
                '1A': 'AC First Class',
                'CC': 'Chair Car',
                'EC': 'Executive Class',
                '2S': 'Second Sitting'
            };
            
            return classMap[classCode] || classCode;
        }
        
        // Initialize Feather icons
        document.addEventListener('DOMContentLoaded', function() {
            feather.replace();
        });
    </script>
</body>
</html>
