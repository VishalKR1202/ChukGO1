/**
 * ChukChukGO - Main JavaScript
 * Handles general interactions and UI updates
 */

// Global variables to store search results and selected train/class
let searchResults = [];
let selectedTrain = null;
let selectedClass = null;
let currentPassengerCount = 1;
let totalFare = 0;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Feather icons
    feather.replace();
    
    // Initialize date picker with minimum date as today
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    document.getElementById('journeyDate').min = formattedDate;
    document.getElementById('journeyDate').value = formattedDate;
    
    // Add event listeners
    setupEventListeners();
    
    // Check for any URL parameters (e.g., for pre-filled searches)
    checkUrlParameters();
    
    // Create a sample booking for testing PNR
    createSampleBooking();
});

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Search form submission
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            searchTrains();
        });
    }
    
    // PNR form submission
    const pnrForm = document.getElementById('pnrForm');
    if (pnrForm) {
        pnrForm.addEventListener('submit', function(e) {
            e.preventDefault();
            checkPNRStatus();
        });
    }
    
    // Cancellation form submission
    const cancelTicketForm = document.getElementById('cancelTicketForm');
    if (cancelTicketForm) {
        cancelTicketForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processCancellation();
        });
    }
    
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitContactForm();
        });
    }
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processLogin();
        });
    }
    
    // Register form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processRegistration();
        });
    }
    
    // Sort and filter controls for search results
    const sortTrains = document.getElementById('sortTrains');
    if (sortTrains) {
        sortTrains.addEventListener('change', function() {
            sortSearchResults(this.value);
        });
    }
    
    const filterTrains = document.getElementById('filterTrains');
    if (filterTrains) {
        filterTrains.addEventListener('change', function() {
            filterSearchResults(this.value);
        });
    }
}

/**
 * Check for URL parameters to pre-fill search form
 */
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('from') && urlParams.has('to')) {
        const fromStation = urlParams.get('from');
        const toStation = urlParams.get('to');
        
        const fromInput = document.getElementById('fromStation');
        const toInput = document.getElementById('toStation');
        
        if (fromInput && toInput) {
            fromInput.value = fromStation;
            toInput.value = toStation;
            
            // If date is also provided
            if (urlParams.has('date')) {
                const dateInput = document.getElementById('journeyDate');
                if (dateInput) {
                    dateInput.value = urlParams.get('date');
                }
            }
            
            // Automatically search if all parameters are present
            if (fromInput.value && toInput.value) {
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    searchTrains();
                }, 100);
            }
        }
    }
}

/**
 * Handle train search
 */
function searchTrains() {
    const fromStation = document.getElementById('fromStation').value;
    const toStation = document.getElementById('toStation').value;
    const journeyDate = document.getElementById('journeyDate').value;
    const travelClass = document.getElementById('travelClass').value;
    const passengersCount = document.getElementById('passengers').value;
    const quota = document.getElementById('quota').value;
    
    // Validate inputs
    if (!fromStation || !toStation || !journeyDate) {
        showMessage('Please fill all required fields', 'error');
        return;
    }
    
    // Show loading indicator
    const searchResults = document.getElementById('searchResults');
    searchResults.classList.remove('d-none');
    const trainList = document.getElementById('trainList');
    trainList.innerHTML = `
        <div class="loading-indicator">
            <div class="loading-spinner"></div>
            <p class="mt-3">Searching for trains...</p>
        </div>
    `;
    
    // Update journey summary
    document.getElementById('journeySummary').textContent = 
        `${fromStation} to ${toStation} | ${formatDate(journeyDate)} | ${passengersCount} passenger(s) | ${getClassFullName(travelClass)}`;
    
    // Scroll to results
    searchResults.scrollIntoView({ behavior: 'smooth' });
    
    // In a real application, this would be an AJAX call to the server
    // For demonstration, we'll simulate a server response with mock data
    setTimeout(() => {
        fetchTrainResults(fromStation, toStation, journeyDate, travelClass, quota);
    }, 1500);
}

/**
 * Fetch train search results
 */
function fetchTrainResults(fromStation, toStation, journeyDate, travelClass, quota) {
    // In a production environment, this would be an AJAX call to the backend
    // For this example, we'll create a fetch request to our servlet

    fetch(`/search?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}&date=${journeyDate}&class=${travelClass}&quota=${quota}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Store the results globally
        searchResults = data;
        
        // Display the results
        displaySearchResults(data);
    })
    .catch(error => {
        console.error('Error fetching train results:', error);
        
        // For demonstration purposes, we'll use sample data when the backend is not available
        searchResults = getMockTrains(fromStation, toStation, journeyDate);
        displaySearchResults(searchResults);
    });
}

/**
 * Display train search results
 */
function displaySearchResults(trains) {
    const trainList = document.getElementById('trainList');
    
    if (!trains || trains.length === 0) {
        trainList.innerHTML = `
            <div class="alert alert-warning">
                <i data-feather="alert-circle" class="me-2"></i>
                No trains found for your search criteria. Please try different dates or stations.
            </div>
        `;
        feather.replace();
        return;
    }
    
    let html = `
        <div class="date-nav">
            <button class="btn btn-sm btn-outline-primary date-nav-btn" onclick="changeSearchDate(-1)">
                <i data-feather="chevron-left"></i> Previous Day
            </button>
            <div class="date-display">${formatDate(trains[0].journeyDate)}</div>
            <button class="btn btn-sm btn-outline-primary date-nav-btn" onclick="changeSearchDate(1)">
                Next Day <i data-feather="chevron-right"></i>
            </button>
        </div>
    `;
    
    trains.forEach((train, index) => {
        html += createTrainCard(train, index);
    });
    
    trainList.innerHTML = html;
    
    // Reinitialize feather icons for the new content
    feather.replace();
    
    // Add event listeners to the train class selection
    document.querySelectorAll('.train-class').forEach(classElement => {
        classElement.addEventListener('click', function() {
            selectTrainClass(this.dataset.trainIndex, this.dataset.classType);
        });
    });
}

/**
 * Create HTML for a train card
 */
function createTrainCard(train, index) {
    const departureTime = train.departureTime;
    const arrivalTime = train.arrivalTime;
    
    // Check if the train runs on the selected day
    const runsOnDay = train.runningDays.includes(new Date(train.journeyDate).getDay());
    
    if (!runsOnDay) {
        // Skip trains that don't run on the selected day
        return '';
    }
    
    // Format trains running days for display
    const daysDisplay = formatRunningDays(train.runningDays);
    
    let html = `
        <div class="train-details" id="train-${index}">
            <div class="train-info">
                <div class="train-info-primary">
                    <div class="train-number-name">${train.number} - ${train.name}</div>
                    <div class="train-runs-on">Runs on: ${daysDisplay}</div>
                </div>
                <div class="train-info-secondary">
                    <span class="badge bg-success">${train.quota || 'General'} Quota</span>
                </div>
            </div>
            
            <div class="train-timing">
                <div class="train-departure">
                    <div class="train-time">${departureTime}</div>
                    <div class="train-station">${train.fromStation}</div>
                    <div class="train-date">${formatDate(train.journeyDate)}</div>
                </div>
                
                <div class="train-duration">
                    <div class="train-duration-time">${train.duration}</div>
                    <div>Duration</div>
                </div>
                
                <div class="train-arrival">
                    <div class="train-time">${arrivalTime}</div>
                    <div class="train-station">${train.toStation}</div>
                    <div class="train-date">${formatDate(train.arrivalDate || train.journeyDate)}</div>
                </div>
            </div>
            
            <div class="train-fare-seats">
    `;
    
    // Add classes and availability
    for (const classType in train.classes) {
        const classInfo = train.classes[classType];
        
        if (classInfo.available) {
            let availabilityClass = 'avl-waiting';
            let availabilityText = 'WL ' + classInfo.waitlist;
            
            if (classInfo.available === 'RAC') {
                availabilityClass = 'avl-rac';
                availabilityText = 'RAC ' + classInfo.racStatus;
            } else if (classInfo.available === 'Available') {
                availabilityClass = 'avl-available';
                availabilityText = 'Avl ' + classInfo.seats;
            }
            
            html += `
                <div class="train-class" data-train-index="${index}" data-class-type="${classType}">
                    <div class="class-type">${getClassFullName(classType)}</div>
                    <div class="class-fare">₹ ${classInfo.fare}</div>
                    <div class="class-availability ${availabilityClass}">${availabilityText}</div>
                </div>
            `;
        }
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Handle selection of a train and travel class
 */
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
    selectedTrain = searchResults[trainIndex];
    selectedClass = classType;
    
    // Add book button if not already present
    const trainCard = document.getElementById(`train-${trainIndex}`);
    let bookBtn = trainCard.querySelector('.book-btn-container');
    
    if (!bookBtn) {
        const btnContainer = document.createElement('div');
        btnContainer.className = 'book-btn-container';
        btnContainer.innerHTML = `
            <button class="btn btn-primary" onclick="proceedToBooking()">
                <i data-feather="check-circle"></i> Book ${getClassFullName(classType)}
            </button>
        `;
        trainCard.appendChild(btnContainer);
        feather.replace();
    } else {
        bookBtn.innerHTML = `
            <button class="btn btn-primary" onclick="proceedToBooking()">
                <i data-feather="check-circle"></i> Book ${getClassFullName(classType)}
            </button>
        `;
        feather.replace();
    }
}

/**
 * Proceed to booking page/form
 */
function proceedToBooking() {
    if (!selectedTrain || !selectedClass) {
        showMessage('Please select a train and class first', 'error');
        return;
    }
    
    // Get passenger count
    const passengersCount = parseInt(document.getElementById('passengers').value, 10);
    
    // Set train booking details in the modal
    const trainBookingDetails = document.getElementById('trainBookingDetails');
    trainBookingDetails.innerHTML = `
        <p><strong>${selectedTrain.number} - ${selectedTrain.name}</strong></p>
        <p>${selectedTrain.fromStation} (${selectedTrain.departureTime}) → 
           ${selectedTrain.toStation} (${selectedTrain.arrivalTime})</p>
        <p>Date: ${formatDate(selectedTrain.journeyDate)} | Class: ${getClassFullName(selectedClass)}</p>
        <p>Fare: ₹ ${selectedTrain.classes[selectedClass].fare} per passenger</p>
    `;
    
    // Generate passenger forms
    const passengerDetails = document.getElementById('passengerDetails');
    passengerDetails.innerHTML = '';
    
    for (let i = 1; i <= passengersCount; i++) {
        passengerDetails.innerHTML += createPassengerForm(i);
    }
    
    // Update global passenger count
    currentPassengerCount = passengersCount;
    
    // Calculate and store total fare
    totalFare = calculateTotalFare(passengersCount);
    
    // Show booking modal
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    bookingModal.show();
}

/**
 * Create form fields for a passenger
 */
function createPassengerForm(index) {
    return `
        <div class="passenger-form">
            <h6>Passenger ${index}</h6>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="passengerName${index}" class="form-label">Full Name</label>
                    <input type="text" class="form-control" id="passengerName${index}" name="passengerName${index}" required>
                </div>
                <div class="col-md-3 mb-3">
                    <label for="passengerAge${index}" class="form-label">Age</label>
                    <input type="number" class="form-control" id="passengerAge${index}" name="passengerAge${index}" min="1" max="120" required>
                </div>
                <div class="col-md-3 mb-3">
                    <label for="passengerGender${index}" class="form-label">Gender</label>
                    <select class="form-select" id="passengerGender${index}" name="passengerGender${index}" required>
                        <option value="">Select</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="passengerBerth${index}" class="form-label">Berth Preference</label>
                    <select class="form-select" id="passengerBerth${index}" name="passengerBerth${index}">
                        <option value="NO">No Preference</option>
                        <option value="LB">Lower Berth</option>
                        <option value="MB">Middle Berth</option>
                        <option value="UB">Upper Berth</option>
                        <option value="SL">Side Lower</option>
                        <option value="SU">Side Upper</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="passengerConcession${index}" class="form-label">Concession</label>
                    <select class="form-select" id="passengerConcession${index}" name="passengerConcession${index}" onchange="toggleIdProof(${index}, this.value)">
                        <option value="NONE">None</option>
                        <option value="SENIOR">Senior Citizen</option>
                        <option value="DIVYAANG">Divyaang</option>
                        <option value="STUDENT">Student</option>
                    </select>
                </div>
            </div>
            <div class="row id-proof-row" id="idProofRow${index}">
                <div class="col-md-6 mb-3">
                    <label for="idProofType${index}" class="form-label">ID Proof Type</label>
                    <select class="form-select" id="idProofType${index}" name="idProofType${index}">
                        <option value="AADHAR">Aadhar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="DRIVING">Driving License</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="idProofNumber${index}" class="form-label">ID Proof Number</label>
                    <input type="text" class="form-control" id="idProofNumber${index}" name="idProofNumber${index}">
                </div>
            </div>
        </div>
    `;
}

/**
 * Toggle ID proof fields based on concession selection
 */
function toggleIdProof(passengerIndex, concessionType) {
    const idProofRow = document.getElementById(`idProofRow${passengerIndex}`);
    
    if (concessionType !== 'NONE') {
        idProofRow.classList.add('show');
        document.getElementById(`idProofType${passengerIndex}`).required = true;
        document.getElementById(`idProofNumber${passengerIndex}`).required = true;
    } else {
        idProofRow.classList.remove('show');
        document.getElementById(`idProofType${passengerIndex}`).required = false;
        document.getElementById(`idProofNumber${passengerIndex}`).required = false;
    }
}

/**
 * Calculate total fare for the booking
 */
function calculateTotalFare(passengersCount) {
    const baseFare = selectedTrain.classes[selectedClass].fare;
    const passengerFare = baseFare * passengersCount;
    
    // Additional charges
    const convenienceFee = 15 * passengersCount;
    
    // Check if travel insurance is selected
    const insuranceElement = document.getElementById('travelInsurance');
    const insuranceFee = (insuranceElement && insuranceElement.checked) ? 15 * passengersCount : 0;
    
    return passengerFare + convenienceFee + insuranceFee;
}

/**
 * Proceed to payment from passenger details
 */
function continueToPayment() {
    // Validate passenger form
    const passengerForm = document.getElementById('passengerForm');
    if (!validateForm(passengerForm)) {
        return false;
    }
    
    // Hide booking modal
    const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
    bookingModal.hide();
    
    // Update payment summary
    document.getElementById('paymentSummary').innerHTML = `
        <div class="mb-3">
            <div><strong>${selectedTrain.number} - ${selectedTrain.name}</strong></div>
            <div>${selectedTrain.fromStation} → ${selectedTrain.toStation}</div>
            <div>${formatDate(selectedTrain.journeyDate)} | ${getClassFullName(selectedClass)}</div>
        </div>
        <div class="mb-3">
            <div><strong>Passengers:</strong> ${currentPassengerCount}</div>
            <div><strong>Base Fare:</strong> ₹ ${selectedTrain.classes[selectedClass].fare} × ${currentPassengerCount}</div>
            <div><strong>Convenience Fee:</strong> ₹ ${15 * currentPassengerCount}</div>
            ${document.getElementById('travelInsurance').checked ? 
                `<div><strong>Travel Insurance:</strong> ₹ ${15 * currentPassengerCount}</div>` : ''}
        </div>
    `;
    
    // Update total fare
    document.getElementById('totalFare').textContent = `₹ ${totalFare}`;
    
    // Show payment modal
    const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    paymentModal.show();
    
    return true;
}

/**
 * Process the payment and show confirmation
 */
function processPayment(paymentMethod) {
    // Hide payment modal
    const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
    paymentModal.hide();
    
    // In a real application, we would process the payment here
    // For demo, we'll just show a success modal
    
    // Generate random PNR
    const pnr = generatePNR();
    document.getElementById('confirmationPNR').textContent = pnr;
    
    // Gather all passenger details
    const passengers = [];
    for (let i = 1; i <= currentPassengerCount; i++) {
        const nameElement = document.getElementById(`passengerName${i}`);
        const ageElement = document.getElementById(`passengerAge${i}`);
        const genderElement = document.getElementById(`passengerGender${i}`);
        
        if (nameElement && ageElement && genderElement) {
            // Assign random coach and berth for demonstration
            const coach = ['B1', 'B2', 'B3', 'B4', 'B5'][Math.floor(Math.random() * 5)];
            const berthTypes = ['LB', 'MB', 'UB', 'SL', 'SU'];
            const berthType = berthTypes[Math.floor(Math.random() * berthTypes.length)];
            const berthNumber = Math.floor(Math.random() * 72) + 1;
            const berth = `${berthNumber} ${berthType}`;
            
            passengers.push({
                name: nameElement.value,
                age: ageElement.value,
                gender: genderElement.value,
                bookingStatus: `CNF/${coach}/${berthNumber}`,
                currentStatus: 'CNF',
                coach: coach,
                berth: berth
            });
        }
    }
    
    // Create complete booking data
    const bookingData = {
        pnrNumber: pnr,
        trainNumber: selectedTrain.number,
        trainName: selectedTrain.name,
        fromStation: selectedTrain.fromStation,
        toStation: selectedTrain.toStation,
        departureTime: selectedTrain.departureTime,
        arrivalTime: selectedTrain.arrivalTime,
        journeyDate: selectedTrain.journeyDate,
        travelClass: selectedClass,
        bookingDate: new Date().toISOString().split('T')[0],
        chartStatus: 'Chart Not Prepared',
        totalFare: totalFare,
        quota: 'General',
        distance: selectedTrain.distance || '1384',
        passengers: passengers
    };
    
    // Save booking details to localStorage
    saveBookingToStorage(pnr, bookingData);
    
    // Add e-ticket download button to success modal
    const downloadBtnContainer = document.getElementById('downloadTicketContainer');
    if (downloadBtnContainer) {
        downloadBtnContainer.innerHTML = `
            <button class="btn btn-primary mt-3" onclick="generateETicket('${pnr}')">
                <i data-feather="download"></i> Download E-Ticket
            </button>
        `;
        feather.replace();
    }
    
    // Show success modal
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
    
    // Log the saved booking for debugging
    console.log('New booking saved with PNR:', pnr, bookingData);
}

/**
 * Check PNR status
 */
function checkPNRStatus() {
    const pnrNumber = document.getElementById('pnrNumber').value;
    
    if (!pnrNumber || pnrNumber.length !== 10) {
        showMessage('Please enter a valid 10-digit PNR number', 'error');
        return;
    }
    
    // Show loading in results area
    const pnrResult = document.getElementById('pnrResult');
    pnrResult.classList.remove('d-none');
    pnrResult.innerHTML = `
        <div class="loading-indicator">
            <div class="loading-spinner"></div>
            <p class="mt-3">Fetching PNR status...</p>
        </div>
    `;
    
    // In a real application, this would be an AJAX call to the server
    // For demonstration, we'll simulate a server response
    setTimeout(() => {
        fetchPNRStatus(pnrNumber);
    }, 1500);
}

/**
 * Fetch PNR status from server
 */
function fetchPNRStatus(pnrNumber) {
    // In a production environment, this would be an AJAX call to the backend
    // For this example, we'll check localStorage for the booking
    console.log("Fetching PNR status for:", pnrNumber);

    // Check if booking exists in local storage
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    console.log("Bookings in localStorage:", Object.keys(bookings));
    
    if (bookings[pnrNumber]) {
        console.log("Found booking in localStorage:", bookings[pnrNumber]);
        // Use booking from local storage
        const bookingData = bookings[pnrNumber];
        
        // Check if the booking data has all the required fields
        if (!bookingData.passengers || !Array.isArray(bookingData.passengers)) {
            console.log("Invalid booking data format, missing passengers array");
            const mockPNRData = getMockPNRStatus(pnrNumber);
            displayPNRStatus(mockPNRData);
            return;
        }
        
        // Format the data for PNR display
        const pnrData = {
            pnrNumber: pnrNumber,
            trainNumber: bookingData.trainNumber || '12301',
            trainName: bookingData.trainName || 'Rajdhani Express',
            fromStation: bookingData.fromStation || 'Delhi (NDLS)',
            toStation: bookingData.toStation || 'Mumbai (CSTM)',
            departureTime: bookingData.departureTime || '16:50',
            arrivalTime: bookingData.arrivalTime || '10:05',
            journeyDate: bookingData.journeyDate || new Date().toISOString().split('T')[0],
            travelClass: bookingData.travelClass || '3A',
            bookingDate: bookingData.bookingDate || new Date().toISOString().split('T')[0],
            chartStatus: bookingData.chartStatus || "Chart Not Prepared",
            canCancel: true,
            passengers: bookingData.passengers.map(p => ({
                name: p.name || 'Passenger',
                age: p.age || '30',
                gender: p.gender || 'Male',
                bookingStatus: p.bookingStatus || 'CNF',
                status: p.currentStatus || 'CNF',
                coach: p.coach || 'B4',
                berth: p.berth || 'LB'
            }))
        };
        
        displayPNRStatus(pnrData);
        return;
    } else {
        console.log("Booking not found in localStorage, showing error");
        // If the PNR is not found in localStorage, show an error
        const pnrResult = document.getElementById('pnrResult');
        pnrResult.innerHTML = `
            <div class="alert alert-danger">
                <i data-feather="alert-triangle" class="me-2"></i>
                PNR number ${pnrNumber} not found in the system. Please check and try again.
            </div>
        `;
        feather.replace();
        return;
    }
}

/**
 * Display PNR status
 */
function displayPNRStatus(pnrData) {
    const pnrResult = document.getElementById('pnrResult');
    
    if (!pnrData || pnrData.error) {
        pnrResult.innerHTML = `
            <div class="alert alert-danger">
                <i data-feather="alert-triangle" class="me-2"></i>
                ${pnrData?.error || 'Invalid PNR number or PNR not found in the system.'}
            </div>
        `;
        feather.replace();
        return;
    }
    
    // Format passengers status
    let passengersHtml = '';
    
    if (pnrData.passengers && pnrData.passengers.length > 0) {
        pnrData.passengers.forEach((passenger, index) => {
            // Determine status class
            let statusClass = 'pnr-status-waitlist';
            const status = passenger.status || passenger.currentStatus || 'CNF';
            
            if (status.toString().startsWith('CNF')) {
                statusClass = 'pnr-status-confirmed';
            } else if (status.toString().startsWith('RAC')) {
                statusClass = 'pnr-status-rac';
            }
            
            passengersHtml += `
                <div class="passenger-item">
                    <div class="passenger-detail">
                        <div class="pnr-label">Passenger ${index + 1}</div>
                        <div class="pnr-value">${passenger.name || 'Passenger'}</div>
                    </div>
                    <div class="passenger-detail">
                        <div class="pnr-label">Age / Gender</div>
                        <div class="pnr-value">${passenger.age || '--'} / ${passenger.gender || '--'}</div>
                    </div>
                    <div class="passenger-detail">
                        <div class="pnr-label">Booking Status</div>
                        <div class="pnr-value">${passenger.bookingStatus || status}</div>
                    </div>
                    <div class="passenger-detail">
                        <div class="pnr-label">Current Status</div>
                        <div class="pnr-value ${statusClass}">${status}</div>
                    </div>
                    <div class="passenger-detail">
                        <div class="pnr-label">Coach / Berth</div>
                        <div class="pnr-value">${passenger.coach || '--'} / ${passenger.berth || '--'}</div>
                    </div>
                </div>
            `;
        });
    } else {
        passengersHtml = `
            <div class="alert alert-warning">
                <i data-feather="alert-triangle" class="me-2"></i>
                No passenger details available for this booking.
            </div>
        `;
    }
    
    pnrResult.innerHTML = `
        <div class="pnr-status-container">
            <div class="pnr-header">
                <div>
                    <h5>PNR: ${pnrData.pnrNumber}</h5>
                    <div class="text-muted">Booked on: ${formatDate(pnrData.bookingDate)}</div>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.print()">
                        <i data-feather="printer" class="me-1"></i> Print
                    </button>
                </div>
            </div>
            
            <div class="pnr-status-info">
                <div class="pnr-status-item">
                    <div class="pnr-label">Train Number / Name</div>
                    <div class="pnr-value">${pnrData.trainNumber} / ${pnrData.trainName}</div>
                </div>
                <div class="pnr-status-item">
                    <div class="pnr-label">From</div>
                    <div class="pnr-value">${pnrData.fromStation} (${pnrData.departureTime})</div>
                </div>
                <div class="pnr-status-item">
                    <div class="pnr-label">To</div>
                    <div class="pnr-value">${pnrData.toStation} (${pnrData.arrivalTime})</div>
                </div>
                <div class="pnr-status-item">
                    <div class="pnr-label">Date of Journey</div>
                    <div class="pnr-value">${formatDate(pnrData.journeyDate)}</div>
                </div>
                <div class="pnr-status-item">
                    <div class="pnr-label">Class</div>
                    <div class="pnr-value">${getClassFullName(pnrData.travelClass)}</div>
                </div>
                <div class="pnr-status-item">
                    <div class="pnr-label">Chart Status</div>
                    <div class="pnr-value">${pnrData.chartStatus}</div>
                </div>
            </div>
            
            <div class="passenger-list">
                <div class="passenger-list-title">Passenger Details</div>
                ${passengersHtml}
            </div>
            
            ${pnrData.canCancel ? `
                <div class="mt-4 text-center">
                    <button class="btn btn-danger" onclick="openCancellationModal('${pnrData.pnrNumber}')">
                        <i data-feather="x-circle" class="me-1"></i> Cancel Ticket
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    feather.replace();
}

/**
 * Process ticket cancellation
 */
function processCancellation() {
    const pnr = document.getElementById('pnrCancel').value;
    const email = document.getElementById('emailCancel').value;
    
    if (!pnr || !email) {
        showMessage('Please fill all required fields', 'error');
        return;
    }
    
    // In a real application, this would be an AJAX call to the server
    // For demonstration, we'll simulate a server response
    const cancelBtn = document.querySelector('#cancelTicketForm button[type="submit"]');
    const originalBtnText = cancelBtn.innerHTML;
    
    cancelBtn.disabled = true;
    cancelBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    setTimeout(() => {
        cancelBtn.disabled = false;
        cancelBtn.innerHTML = originalBtnText;
        
        // Show success message
        const cancelModal = bootstrap.Modal.getInstance(document.getElementById('cancelModal'));
        cancelModal.hide();
        
        showMessage('Your ticket has been successfully cancelled. Refund will be processed to the original payment method within 5-7 working days.', 'success');
    }, 2000);
}

/**
 * Open cancellation modal with PNR pre-filled
 */
function openCancellationModal(pnr) {
    const pnrCancel = document.getElementById('pnrCancel');
    if (pnrCancel) {
        pnrCancel.value = pnr;
    }
    
    // Switch to cancel tab
    const navCancelTab = document.getElementById('nav-cancel-tab');
    navCancelTab.click();
    
    // Show cancel modal
    const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
    cancelModal.show();
}

/**
 * Submit contact form
 */
function submitContactForm() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    if (!name || !email || !subject || !message) {
        showMessage('Please fill all required fields', 'error');
        return;
    }
    
    // In a real application, this would be an AJAX call to the server
    // For demonstration, we'll simulate a server response
    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
    
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        
        // Reset form
        document.getElementById('contactForm').reset();
        
        showMessage('Thank you for your message. We will get back to you soon!', 'success');
    }, 1500);
}

/**
 * Process login form
 */
function processLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('Please fill all required fields', 'error');
        return;
    }
    
    // In a real application, this would be an AJAX call to the server
    // For demonstration, we'll simulate a server response
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalBtnText = loginBtn.innerHTML;
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
    
    setTimeout(() => {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalBtnText;
        
        // Hide login modal
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();
        
        showMessage('You have been successfully logged in!', 'success');
    }, 1500);
}

/**
 * Process registration form
 */
function processRegistration() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('phoneNumber').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!fullName || !email || !phone || !password || !confirmPassword) {
        showMessage('Please fill all required fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    // In a real application, this would be an AJAX call to the server
    // For demonstration, we'll simulate a server response
    const registerBtn = document.querySelector('#registerForm button[type="submit"]');
    const originalBtnText = registerBtn.innerHTML;
    
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';
    
    setTimeout(() => {
        registerBtn.disabled = false;
        registerBtn.innerHTML = originalBtnText;
        
        // Hide register modal
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        registerModal.hide();
        
        showMessage('Your account has been created successfully!', 'success');
    }, 1500);
}

/**
 * Preset search values for popular routes
 */
function presetSearch(from, to) {
    const fromInput = document.getElementById('fromStation');
    const toInput = document.getElementById('toStation');
    
    if (fromInput && toInput) {
        fromInput.value = from;
        toInput.value = to;
        
        // Scroll to search form
        document.getElementById('searchForm').scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Change search date and resubmit search
 */
function changeSearchDate(days) {
    const dateInput = document.getElementById('journeyDate');
    const currentDate = new Date(dateInput.value);
    
    // Add days to current date
    currentDate.setDate(currentDate.getDate() + days);
    
    // Update date input
    dateInput.value = currentDate.toISOString().substr(0, 10);
    
    // Resubmit search
    searchTrains();
}

/**
 * Format date string to a more readable format
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

/**
 * Get full name of travel class from class code
 */
function getClassFullName(classCode) {
    const classMap = {
        'SL': 'Sleeper Class',
        '3A': 'AC 3 Tier',
        '2A': 'AC 2 Tier',
        '1A': 'AC First Class',
        'CC': 'Chair Car',
        'EC': 'Executive Class',
        '2S': 'Second Sitting',
        'FC': 'First Class'
    };
    
    return classMap[classCode] || classCode;
}

/**
 * Format running days array into readable text
 */
function formatRunningDays(days) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
}

/**
 * Sort search results based on criteria
 */
function sortSearchResults(criteria) {
    if (!searchResults || searchResults.length === 0) return;
    
    switch (criteria) {
        case 'departure':
            searchResults.sort((a, b) => {
                const timeA = a.departureTime.split(':').map(Number);
                const timeB = b.departureTime.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
            });
            break;
        case 'arrival':
            searchResults.sort((a, b) => {
                const timeA = a.arrivalTime.split(':').map(Number);
                const timeB = b.arrivalTime.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
            });
            break;
        case 'duration':
            searchResults.sort((a, b) => {
                const durA = parseDuration(a.duration);
                const durB = parseDuration(b.duration);
                return durA - durB;
            });
            break;
        case 'price':
            searchResults.sort((a, b) => {
                // Find minimum fare across all classes
                const fareA = findMinFare(a.classes);
                const fareB = findMinFare(b.classes);
                return fareA - fareB;
            });
            break;
    }
    
    // Redisplay the sorted results
    displaySearchResults(searchResults);
}

/**
 * Filter search results
 */
function filterSearchResults(filter) {
    if (!searchResults || searchResults.length === 0) return;
    
    let filteredResults = [...searchResults];
    
    switch (filter) {
        case 'morning':
            filteredResults = searchResults.filter(train => {
                const hour = parseInt(train.departureTime.split(':')[0], 10);
                return hour >= 4 && hour < 12;
            });
            break;
        case 'afternoon':
            filteredResults = searchResults.filter(train => {
                const hour = parseInt(train.departureTime.split(':')[0], 10);
                return hour >= 12 && hour < 16;
            });
            break;
        case 'evening':
            filteredResults = searchResults.filter(train => {
                const hour = parseInt(train.departureTime.split(':')[0], 10);
                return hour >= 16 && hour < 21;
            });
            break;
        case 'night':
            filteredResults = searchResults.filter(train => {
                const hour = parseInt(train.departureTime.split(':')[0], 10);
                return hour >= 21 || hour < 4;
            });
            break;
        // Case 'all' will use the unfiltered results
    }
    
    // Handle no results after filtering
    if (filteredResults.length === 0) {
        const trainList = document.getElementById('trainList');
        trainList.innerHTML = `
            <div class="alert alert-info">
                <i data-feather="info" class="me-2"></i>
                No trains found for the selected filter. Please try a different filter.
            </div>
        `;
        feather.replace();
        return;
    }
    
    // Display filtered results
    displaySearchResults(filteredResults);
}

/**
 * Parse duration string (e.g., "5h 30m") into minutes
 */
function parseDuration(durationStr) {
    const hours = parseInt(durationStr.match(/(\d+)h/) ? durationStr.match(/(\d+)h/)[1] : 0, 10);
    const minutes = parseInt(durationStr.match(/(\d+)m/) ? durationStr.match(/(\d+)m/)[1] : 0, 10);
    return hours * 60 + minutes;
}

/**
 * Find minimum fare among all classes
 */
function findMinFare(classes) {
    let minFare = Infinity;
    
    for (const classType in classes) {
        if (classes[classType].fare < minFare) {
            minFare = classes[classType].fare;
        }
    }
    
    return minFare === Infinity ? 0 : minFare;
}

/**
 * Generate a random PNR for demonstration
 */
function generatePNR() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

/**
 * Generate and download an e-ticket as PDF
 */
function generateETicket(pnrNumber) {
    // Get booking data from localStorage
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    const booking = bookings[pnrNumber];
    
    if (!booking) {
        showMessage('Booking information not found', 'error');
        return;
    }
    
    // Create e-ticket content
    const ticketContent = document.createElement('div');
    ticketContent.innerHTML = `
        <div class="ticket-container" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
            <div class="ticket-header" style="display: flex; justify-content: space-between; border-bottom: 2px solid #6a1b9a; padding-bottom: 10px; margin-bottom: 20px;">
                <div>
                    <h2 style="color: #6a1b9a; margin: 0;">ChukChukGO E-Ticket</h2>
                    <p style="margin: 5px 0 0; color: #666;">Indian Railways</p>
                </div>
                <div>
                    <h3 style="color: #6a1b9a; margin: 0;">PNR: ${pnrNumber}</h3>
                    <p style="margin: 5px 0 0; color: #666;">Booking Date: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            
            <div class="ticket-journey" style="background-color: #f9f0ff; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #6a1b9a;">${booking.trainNumber} - ${booking.trainName}</h3>
                <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                    <div>
                        <p style="margin: 0; font-weight: bold;">${booking.fromStation}</p>
                        <p style="margin: 5px 0 0; color: #666;">${booking.departureTime}</p>
                    </div>
                    <div style="text-align: center;">
                        <p style="margin: 0; color: #666;">→</p>
                        <p style="margin: 5px 0 0; color: #666;">${formatDate(booking.journeyDate)}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-weight: bold;">${booking.toStation}</p>
                        <p style="margin: 5px 0 0; color: #666;">${booking.arrivalTime}</p>
                    </div>
                </div>
            </div>
            
            <div class="ticket-details" style="margin-bottom: 20px;">
                <h3 style="color: #6a1b9a; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Journey Details</h3>
                <div style="display: flex; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px; margin-bottom: 10px;">
                        <p style="margin: 0; color: #666;">Class</p>
                        <p style="margin: 5px 0 0; font-weight: bold;">${getClassFullName(booking.travelClass)}</p>
                    </div>
                    <div style="flex: 1; min-width: 200px; margin-bottom: 10px;">
                        <p style="margin: 0; color: #666;">Quota</p>
                        <p style="margin: 5px 0 0; font-weight: bold;">${booking.quota || 'General'}</p>
                    </div>
                    <div style="flex: 1; min-width: 200px; margin-bottom: 10px;">
                        <p style="margin: 0; color: #666;">Distance</p>
                        <p style="margin: 5px 0 0; font-weight: bold;">${booking.distance || '785'} KM</p>
                    </div>
                </div>
            </div>
            
            <div class="ticket-passengers" style="margin-bottom: 20px;">
                <h3 style="color: #6a1b9a; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Passenger Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f0f0f0;">
                            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">#</th>
                            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Name</th>
                            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Age</th>
                            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Gender</th>
                            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Status</th>
                            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Coach</th>
                            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Seat/Berth</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${booking.passengers.map((passenger, index) => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${passenger.name}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${passenger.age}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${passenger.gender}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">CNF</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${passenger.coach || 'B4'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${passenger.berth || '32 LB'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="ticket-fare" style="margin-bottom: 20px; background-color: #f9f0ff; padding: 15px; border-radius: 5px;">
                <h3 style="color: #6a1b9a; margin-top: 0;">Fare Details</h3>
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <p style="margin: 0; color: #666;">Base Fare</p>
                        <p style="margin: 0; color: #666;">Reservation Charges</p>
                        <p style="margin: 0; color: #666;">GST</p>
                        <p style="margin: 0; color: #666; font-weight: bold;">Total Fare</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0;">₹${booking.baseFare || (booking.totalFare - 40 - 30)}</p>
                        <p style="margin: 0;">₹40</p>
                        <p style="margin: 0;">₹30</p>
                        <p style="margin: 0; font-weight: bold;">₹${booking.totalFare}</p>
                    </div>
                </div>
            </div>
            
            <div class="ticket-footer" style="border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #666;">
                <p style="margin: 0 0 5px;">• This is a valid e-ticket. Show this ticket along with a valid photo ID during the journey.</p>
                <p style="margin: 0 0 5px;">• Arrive at the station at least 30 minutes before departure.</p>
                <p style="margin: 0 0 5px;">• For cancellations and refunds, visit ChukChukGO.com or call 139.</p>
                <p style="margin: 0 0 5px; text-align: center; margin-top: 15px;">Happy Journey with Indian Railways!</p>
            </div>
        </div>
    `;
    
    // Convert HTML to PDF and download
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>E-Ticket - ${pnrNumber}</title>
            <style>
                @media print {
                    body { margin: 0; padding: 0; }
                }
            </style>
        </head>
        <body>
            ${ticketContent.innerHTML}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `);
    
    showMessage('E-ticket generated successfully', 'success');
}

/**
 * Show message toast
 */
function showMessage(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create the toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'bg-danger text-white' : type === 'success' ? 'bg-success text-white' : 'bg-info text-white'}`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Information'}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize and show the toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove the toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

// Mock data for demonstration
function getMockTrains(fromStation, toStation, journeyDate) {
    return [
        {
            number: '12301',
            name: 'Rajdhani Express',
            fromStation: fromStation,
            toStation: toStation,
            departureTime: '16:50',
            arrivalTime: '10:05',
            journeyDate: journeyDate,
            arrivalDate: new Date(new Date(journeyDate).getTime() + 86400000).toISOString().substr(0, 10), // Next day
            duration: '17h 15m',
            runningDays: [0, 1, 2, 3, 4, 5, 6], // All days
            classes: {
                '3A': {
                    fare: 1245,
                    available: 'Available',
                    seats: 24
                },
                '2A': {
                    fare: 1890,
                    available: 'Available',
                    seats: 12
                },
                '1A': {
                    fare: 3120,
                    available: 'Available',
                    seats: 5
                }
            }
        },
        {
            number: '12259',
            name: 'Duronto Express',
            fromStation: fromStation,
            toStation: toStation,
            departureTime: '08:20',
            arrivalTime: '23:45',
            journeyDate: journeyDate,
            duration: '15h 25m',
            runningDays: [1, 3, 5], // Mon, Wed, Fri
            classes: {
                'SL': {
                    fare: 685,
                    available: 'Available',
                    seats: 45
                },
                '3A': {
                    fare: 1130,
                    available: 'Available',
                    seats: 18
                },
                '2A': {
                    fare: 1720,
                    available: 'RAC',
                    racStatus: '4'
                }
            }
        },
        {
            number: '12951',
            name: 'Mumbai Rajdhani',
            fromStation: fromStation,
            toStation: toStation,
            departureTime: '17:00',
            arrivalTime: '08:15',
            journeyDate: journeyDate,
            arrivalDate: new Date(new Date(journeyDate).getTime() + 86400000).toISOString().substr(0, 10), // Next day
            duration: '15h 15m',
            runningDays: [0, 2, 4, 6], // Sun, Tue, Thu, Sat
            classes: {
                '3A': {
                    fare: 1345,
                    available: 'Available',
                    seats: 16
                },
                '2A': {
                    fare: 1950,
                    available: 'Available',
                    seats: 8
                },
                '1A': {
                    fare: 3250,
                    available: 'RAC',
                    racStatus: '2'
                }
            }
        },
        {
            number: '12909',
            name: 'Garib Rath Express',
            fromStation: fromStation,
            toStation: toStation,
            departureTime: '23:45',
            arrivalTime: '14:30',
            journeyDate: journeyDate,
            arrivalDate: new Date(new Date(journeyDate).getTime() + 86400000).toISOString().substr(0, 10), // Next day
            duration: '14h 45m',
            runningDays: [1, 4], // Mon, Thu
            classes: {
                '3A': {
                    fare: 895,
                    available: 'Available',
                    seats: 68
                }
            }
        },
        {
            number: '12534',
            name: 'Pushpak Express',
            fromStation: fromStation,
            toStation: toStation,
            departureTime: '11:30',
            arrivalTime: '05:15',
            journeyDate: journeyDate,
            arrivalDate: new Date(new Date(journeyDate).getTime() + 86400000).toISOString().substr(0, 10), // Next day
            duration: '17h 45m',
            runningDays: [0, 1, 2, 3, 4, 5, 6], // All days
            classes: {
                'SL': {
                    fare: 590,
                    available: 'Available',
                    seats: 120
                },
                '3A': {
                    fare: 1050,
                    available: 'RAC',
                    racStatus: '18'
                },
                '2A': {
                    fare: 1560,
                    available: 'WL',
                    waitlist: '15'
                }
            }
        }
    ];
}

function getMockPNRStatus(pnrNumber) {
    return {
        pnrNumber: pnrNumber,
        trainNumber: '12301',
        trainName: 'Rajdhani Express',
        fromStation: 'Delhi (NDLS)',
        toStation: 'Mumbai (CSTM)',
        departureTime: '16:50',
        arrivalTime: '10:05',
        journeyDate: '2023-12-15',
        travelClass: '3A',
        bookingDate: '2023-11-25',
        chartStatus: 'Chart Not Prepared',
        canCancel: true,
        passengers: [
            {
                name: 'John Doe',
                bookingStatus: 'CNF/B4/32',
                status: 'CNF/B4/32',
                coach: 'B4',
                berth: '32 LB'
            },
            {
                name: 'Jane Doe',
                bookingStatus: 'CNF/B4/33',
                status: 'CNF/B4/33',
                coach: 'B4',
                berth: '33 MB'
            },
            {
                name: 'Sam Smith',
                bookingStatus: 'RAC 12',
                status: 'RAC 8',
                coach: '--',
                berth: '--'
            }
        ]
    };
}

/**
 * Create a sample booking in localStorage for testing
 */
function createSampleBooking() {
    // Define a sample PNR
    const samplePNR = '2972705837'; // This is the PNR from the screenshot
    
    // Clear existing bookings to ensure we have a fresh start
    localStorage.removeItem('bookings');
    const bookings = {};
    
    // Calculate future journey date (15 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const journeyDate = futureDate.toISOString().split('T')[0];
    
    // Create sample booking data
    const sampleBooking = {
        pnrNumber: samplePNR,
        trainNumber: '12301',
        trainName: 'Rajdhani Express',
        fromStation: 'Delhi (NDLS)',
        toStation: 'Mumbai (CSTM)',
        departureTime: '16:50',
        arrivalTime: '10:05',
        journeyDate: journeyDate,
        travelClass: '3A',
        bookingDate: new Date().toISOString().split('T')[0],
        chartStatus: 'Chart Not Prepared',
        totalFare: 1245,
        quota: 'General',
        distance: '1384',
        passengers: [
            {
                name: 'Rohit Kumar',
                age: '32',
                gender: 'Male',
                bookingStatus: 'CNF/B4/32',
                currentStatus: 'CNF',
                coach: 'B4',
                berth: '32 LB'
            },
            {
                name: 'Priya Sharma',
                age: '28',
                gender: 'Female',
                bookingStatus: 'CNF/B4/33',
                currentStatus: 'CNF',
                coach: 'B4',
                berth: '33 MB'
            }
        ]
    };
    
    // Save to localStorage
    bookings[samplePNR] = sampleBooking;
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    console.log('Sample booking created with PNR:', samplePNR);
}
