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
    
    // Initialize 24-hour clock
    initializeClock();
    
    // Add event listeners
    setupEventListeners();
    
    // Check for any URL parameters (e.g., for pre-filled searches)
    checkUrlParameters();
    
    // Create a sample booking for testing PNR
    createSampleBooking();
});

/**
 * Initialize the 24-hour clock in the navbar
 */
function initializeClock() {
    // Get the display elements
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    
    // Update time immediately and then every second
    updateTime();
    setInterval(updateTime, 1000);
    
    // Function to update the time display
    function updateTime() {
        const now = new Date();
        
        // Format time as HH:MM:SS (24-hour)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        // Format date as DD/MM/YYYY
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-based
        const year = now.getFullYear();
        
        // Update the displays if elements exist
        if (timeDisplay) timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
        if (dateDisplay) dateDisplay.textContent = `${day}/${month}/${year}`;
    }
}

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
    
    // Train filter checkboxes
    document.querySelectorAll('.class-filter').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            filterTrainsByClass();
        });
    });
    
    // Train type filter checkboxes
    document.querySelectorAll('.train-type-filter').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // If "All Types" is checked, uncheck others
            if (this.id === 'type-all' && this.checked) {
                document.querySelectorAll('.train-type-filter:not(#type-all)').forEach(cb => {
                    cb.checked = false;
                });
            } 
            // If any specific type is checked, uncheck "All Types"
            else if (this.id !== 'type-all' && this.checked) {
                document.getElementById('type-all').checked = false;
            }
            
            filterTrainsByType();
        });
    });
    
    // Additional options checkboxes
    document.querySelectorAll('.option-filter').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            applyAdditionalFilters();
        });
    });
    
    // TravelBites PNR verification button
    const verifyPnrBtn = document.getElementById('verifyPnrBtn');
    if (verifyPnrBtn) {
        verifyPnrBtn.addEventListener('click', function() {
            verifyTravelBitesPNR();
        });
    }
    
    // TravelBites food item counters
    document.querySelectorAll('.counter-btn').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.counter-input');
            if (this.classList.contains('increment')) {
                input.value = parseInt(input.value) + 1;
            } else if (this.classList.contains('decrement')) {
                input.value = Math.max(0, parseInt(input.value) - 1);
            }
            updateFoodOrderSummary();
        });
    });
    
    // TravelBites place order button
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', function() {
            placeFoodOrder();
        });
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('resetFilters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            resetAllFilters();
        });
    }
    
    // Show available only toggle
    const showAvailableOnly = document.getElementById('showAvailableOnly');
    if (showAvailableOnly) {
        showAvailableOnly.addEventListener('change', function() {
            filterAvailableTrains(this.checked);
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
            
            // If class is provided, update the class dropdown
            if (urlParams.has('class')) {
                const travelClassInput = document.getElementById('travelClass');
                if (travelClassInput) {
                    travelClassInput.value = urlParams.get('class');
                }
                
                // Also update the travel class filters
                updateTravelClassFilters(urlParams.get('class'));
            }
            
            // If quota is provided, update the quota dropdown
            if (urlParams.has('quota')) {
                const quotaInput = document.getElementById('quota');
                if (quotaInput) {
                    quotaInput.value = urlParams.get('quota');
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
 * Update travel class filters in the sidebar based on selected class
 */
function updateTravelClassFilters(selectedClass) {
    // Get all class checkboxes
    const classCheckboxes = document.querySelectorAll('input[name="journey-class"]');
    
    // Uncheck all classes first
    classCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Check the selected class
    if (selectedClass) {
        const selectedClassCheckbox = document.querySelector(`input[value="${selectedClass}"]`);
        if (selectedClassCheckbox) {
            selectedClassCheckbox.checked = true;
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
    // Use API endpoint instead of /search to ensure we get JSON data
    fetch(`/api/trains?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}&date=${journeyDate}&class=${travelClass}&quota=${quota}`, {
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
        // Debug: Log the data returned from the API
        console.log('Train search results:', data);
        
        // Store the results globally
        searchResults = data;
        
        // Display the results
        displaySearchResults(data);
        
        // Also update travel class filters in the sidebar to match the search
        updateTravelClassFilters(travelClass);
        
        // Update URL without reloading page
        const newUrl = `/search?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}&date=${journeyDate}&class=${travelClass}&quota=${quota}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
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
    
    // Debug: Log train details
    console.log('Creating train card for:', train);
    
    // Check if train has the required properties
    if (!train || !train.runningDays) {
        console.error('Train is missing runningDays property:', train);
        // Return a simple train card if data is incomplete
        return `
            <div class="train-details" id="train-${index}">
                <div class="train-info">
                    <div class="train-info-primary">
                        <div class="train-number-name">${train.number || 'Unknown'} - ${train.name || 'Unknown'}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
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
                    <div class="train-actions mt-1">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="showTrainSchedule(${index})">
                            <i data-feather="map" class="feather-small"></i> Schedule
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-info ms-1" onclick="showFutureAvailability(${index}, '${Object.keys(train.classes)[0]}')">
                            <i data-feather="calendar" class="feather-small"></i> Check Availability
                        </button>
                    </div>
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
    
    // Update travel class filters in the sidebar
    updateTravelClassFilters(classType);
    
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
    // Check total number of passengers to determine if we should show email field
    const totalPassengers = currentPassengerCount || 1;
    
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
            
            ${totalPassengers > 1 ? `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="passengerEmail${index}" class="form-label">Email (Optional)</label>
                    <input type="email" class="form-control" id="passengerEmail${index}" name="passengerEmail${index}">
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
            ` : `
            <div class="row">
                <div class="col-md-12 mb-3">
                    <label for="passengerConcession${index}" class="form-label">Concession</label>
                    <select class="form-select" id="passengerConcession${index}" name="passengerConcession${index}" onchange="toggleIdProof(${index}, this.value)">
                        <option value="NONE">None</option>
                        <option value="SENIOR">Senior Citizen</option>
                        <option value="DIVYAANG">Divyaang</option>
                        <option value="STUDENT">Student</option>
                    </select>
                </div>
            </div>
            `}
            
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
            
            ${localStorage.getItem('specialAssistanceRequired') ? `
            <div class="row special-assistance-row mt-3">
                <div class="col-12">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0">Special Assistance Details</h6>
                        </div>
                        <div class="card-body">
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" id="wheelchairAssistance${index}" name="wheelchairAssistance${index}">
                                <label class="form-check-label" for="wheelchairAssistance${index}">
                                    Wheelchair Assistance
                                </label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" id="medicalAssistance${index}" name="medicalAssistance${index}">
                                <label class="form-check-label" for="medicalAssistance${index}">
                                    Medical Assistance
                                </label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" id="accompanyingAssistant${index}" name="accompanyingAssistant${index}">
                                <label class="form-check-label" for="accompanyingAssistant${index}">
                                    Accompanying Assistant Required
                                </label>
                            </div>
                            <div class="mb-3 mt-3">
                                <label for="assistanceNotes${index}" class="form-label">Additional Notes</label>
                                <textarea class="form-control" id="assistanceNotes${index}" name="assistanceNotes${index}" rows="2" placeholder="Please specify any other special assistance needs"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
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
    const totalFareElement = document.getElementById('totalFare');
    if (totalFareElement) {
        totalFareElement.textContent = `₹ ${totalFare}`;
    }
    
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
    const confirmationPNRElement = document.getElementById('confirmationPNR');
    if (confirmationPNRElement) {
        confirmationPNRElement.textContent = pnr;
    }
    
    // Gather all passenger details
    const passengers = [];
    for (let i = 1; i <= currentPassengerCount; i++) {
        const nameElement = document.getElementById(`passengerName${i}`);
        const ageElement = document.getElementById(`passengerAge${i}`);
        const genderElement = document.getElementById(`passengerGender${i}`);
        const emailElement = document.getElementById(`passengerEmail${i}`);
        
        if (nameElement && ageElement && genderElement) {
            // Assign random coach and berth for demonstration
            const coach = ['B1', 'B2', 'B3', 'B4', 'B5'][Math.floor(Math.random() * 5)];
            const berthTypes = ['LB', 'MB', 'UB', 'SL', 'SU'];
            const berthType = berthTypes[Math.floor(Math.random() * berthTypes.length)];
            const berthNumber = Math.floor(Math.random() * 72) + 1;
            const berth = `${berthNumber} ${berthType}`;
            
            const passenger = {
                name: nameElement.value,
                age: ageElement.value,
                gender: genderElement.value,
                bookingStatus: `CNF/${coach}/${berthNumber}`,
                currentStatus: 'CNF',
                coach: coach,
                berth: berth
            };
            
            // Add email if it was provided
            if (emailElement && emailElement.value) {
                passenger.email = emailElement.value;
            }
            
            // Add special assistance details if needed
            if (localStorage.getItem('specialAssistanceRequired')) {
                const wheelchairAssistanceElement = document.getElementById(`wheelchairAssistance${i}`);
                const medicalAssistanceElement = document.getElementById(`medicalAssistance${i}`);
                const accompanyingAssistantElement = document.getElementById(`accompanyingAssistant${i}`);
                const assistanceNotesElement = document.getElementById(`assistanceNotes${i}`);
                
                passenger.specialAssistance = {
                    wheelchairRequired: wheelchairAssistanceElement && wheelchairAssistanceElement.checked,
                    medicalAssistanceRequired: medicalAssistanceElement && medicalAssistanceElement.checked,
                    accompanyingAssistantRequired: accompanyingAssistantElement && accompanyingAssistantElement.checked,
                    notes: assistanceNotesElement ? assistanceNotesElement.value : ''
                };
            }
            
            passengers.push(passenger);
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
        specialAssistanceRequired: localStorage.getItem('specialAssistanceRequired') === 'true',
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
            canCancel: bookingData.isCancelled ? false : true,
            passengers: bookingData.passengers.map(p => {
                const passengerObj = {
                    name: p.name || 'Passenger',
                    age: p.age || '30',
                    gender: p.gender || 'Male',
                    bookingStatus: p.bookingStatus || 'CNF',
                    status: p.currentStatus || 'CNF',
                    coach: p.coach || 'B4',
                    berth: p.berth || 'LB'
                };
                
                // Add email if available
                if (p.email) {
                    passengerObj.email = p.email;
                }
                
                // Add special assistance info if available
                if (p.specialAssistance) {
                    passengerObj.specialAssistance = p.specialAssistance;
                }
                
                return passengerObj;
            })
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
            } else if (status.toString().startsWith('CANC')) {
                statusClass = 'pnr-status-cancelled';
            }
            
            // Check if passenger has email
            const emailHtml = passenger.email ? `
                <div class="passenger-detail">
                    <div class="pnr-label">Email</div>
                    <div class="pnr-value">${passenger.email}</div>
                </div>
            ` : '';
            
            // Check if passenger has special assistance requirements
            let specialAssistanceHtml = '';
            if (passenger.specialAssistance) {
                const sa = passenger.specialAssistance;
                let assistanceItems = [];
                
                if (sa.wheelchairRequired) {
                    assistanceItems.push('Wheelchair Assistance');
                }
                if (sa.medicalAssistanceRequired) {
                    assistanceItems.push('Medical Assistance');
                }
                if (sa.accompanyingAssistantRequired) {
                    assistanceItems.push('Accompanying Assistant');
                }
                
                // Create the HTML for special assistance display
                if (assistanceItems.length > 0 || sa.notes) {
                    specialAssistanceHtml = `
                        <div class="passenger-detail">
                            <div class="pnr-label">Special Assistance</div>
                            <div class="pnr-value">
                                ${assistanceItems.length > 0 ? assistanceItems.join(', ') : 'None'}
                                ${sa.notes ? `<div class="small text-muted mt-1">${sa.notes}</div>` : ''}
                            </div>
                        </div>
                    `;
                }
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
                    ${emailHtml}
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
                    ${specialAssistanceHtml}
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
    
    // Check if any passenger has special assistance needs
    const hasSpecialAssistance = pnrData.passengers && pnrData.passengers.some(p => p.specialAssistance);
    
    pnrResult.innerHTML = `
        <div class="pnr-status-container">
            ${hasSpecialAssistance ? `
            <div class="alert alert-info mb-3">
                <i data-feather="alert-circle" class="me-2"></i>
                <strong>Special Assistance Required</strong> - This booking includes special assistance requirements. Please contact station manager for assistance.
            </div>
            ` : ''}
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
        // Update booking status in localStorage
        const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
        
        if (bookings[pnr]) {
            // Update the booking status to cancelled
            const bookingData = bookings[pnr];
            
            // Update passengers status to CANC
            if (bookingData.passengers && Array.isArray(bookingData.passengers)) {
                bookingData.passengers = bookingData.passengers.map(p => {
                    return {
                        ...p,
                        bookingStatus: 'CANC',
                        currentStatus: 'CANC'
                    };
                });
            }
            
            // Set canCancel to false since it's already cancelled
            bookingData.canCancel = false;
            bookingData.isCancelled = true;
            
            // Save updated booking back to localStorage
            bookings[pnr] = bookingData;
            localStorage.setItem('bookings', JSON.stringify(bookings));
            
            console.log('Booking cancelled:', pnr, bookingData);
        }
        
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
        'FC': 'First Class',
        '3E': 'AC 3 Tier Economy',
        'EA': 'Anubhuti Class',
        'GN': 'General Unreserved',
        'UR': 'Unreserved',
        'HO': 'Head On Generation',
        'EOG': 'End On Generation',
        'PC': 'Pantry Car',
        'SLRD': 'Sleeper cum Luggage/Generator Car'
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
 * Filter trains by travel class
 */
function filterTrainsByClass() {
    if (!searchResults || searchResults.length === 0) return;
    
    // Get all selected class checkboxes
    const selectedClasses = Array.from(document.querySelectorAll('.class-filter:checked'))
        .map(checkbox => checkbox.value);
    
    // If no classes are selected, show all trains
    if (selectedClasses.length === 0) {
        displaySearchResults(searchResults);
        return;
    }
    
    // Filter trains based on available classes
    const filteredResults = searchResults.filter(train => {
        // Check if any of the selected classes is available in this train
        for (const classType of selectedClasses) {
            if (train.classes && train.classes[classType]) {
                return true;
            }
        }
        return false;
    });
    
    // Handle no results after filtering
    if (filteredResults.length === 0) {
        const trainList = document.getElementById('trainList');
        trainList.innerHTML = `
            <div class="alert alert-info">
                <i data-feather="info" class="me-2"></i>
                No trains found with the selected class(es). Please try different class options.
            </div>
        `;
        feather.replace();
        return;
    }
    
    // Display filtered results
    displaySearchResults(filteredResults);
}

/**
 * Filter trains by train type
 */
function filterTrainsByType() {
    if (!searchResults || searchResults.length === 0) return;
    
    // Get all selected type checkboxes
    const selectedTypes = Array.from(document.querySelectorAll('.train-type-filter:checked'))
        .map(checkbox => checkbox.value);
    
    // If 'all' is selected or no types are selected, show all trains
    if (selectedTypes.includes('all') || selectedTypes.length === 0) {
        displaySearchResults(searchResults);
        return;
    }
    
    // Filter trains based on train types
    const filteredResults = searchResults.filter(train => {
        // Check if the train name includes any of the selected types
        const trainName = train.name.toUpperCase();
        return selectedTypes.some(type => {
            switch(type) {
                case 'rajdhani':
                    return trainName.includes('RAJDHANI');
                case 'shatabdi':
                    return trainName.includes('SHATABDI');
                case 'vande':
                    return trainName.includes('VANDE BHARAT');
                case 'tejas':
                    return trainName.includes('TEJAS');
                case 'other':
                    return !(trainName.includes('RAJDHANI') || 
                           trainName.includes('SHATABDI') || 
                           trainName.includes('VANDE BHARAT') || 
                           trainName.includes('TEJAS'));
                default:
                    return false;
            }
        });
    });
    
    // Handle no results after filtering
    if (filteredResults.length === 0) {
        const trainList = document.getElementById('trainList');
        trainList.innerHTML = `
            <div class="alert alert-info">
                <i data-feather="info" class="me-2"></i>
                No trains found for the selected train type(s). Please try different types.
            </div>
        `;
        feather.replace();
        return;
    }
    
    // Display filtered results
    displaySearchResults(filteredResults);
}

/**
 * Filter to show only available trains
 */
function filterAvailableTrains(onlyAvailable) {
    if (!searchResults || searchResults.length === 0) return;
    
    if (!onlyAvailable) {
        // Show all trains
        displaySearchResults(searchResults);
        return;
    }
    
    // Filter trains that have at least one class with available seats
    const filteredResults = searchResults.filter(train => {
        for (const classType in train.classes) {
            if (train.classes[classType].available > 0) {
                return true;
            }
        }
        return false;
    });
    
    // Handle no results after filtering
    if (filteredResults.length === 0) {
        const trainList = document.getElementById('trainList');
        trainList.innerHTML = `
            <div class="alert alert-info">
                <i data-feather="info" class="me-2"></i>
                No trains with available seats found. Please try a different date.
            </div>
        `;
        feather.replace();
        return;
    }
    
    // Display filtered results
    displaySearchResults(filteredResults);
}

/**
 * Apply additional filters (flexible date, concessions, etc.)
 */
function applyAdditionalFilters() {
    if (!searchResults || searchResults.length === 0) return;
    
    const flexibleDate = document.getElementById('option-flexible-date')?.checked;
    const availableBerth = document.getElementById('option-available-berth')?.checked;
    const disability = document.getElementById('option-disability')?.checked;
    const railwayPass = document.getElementById('option-railway-pass')?.checked;
    const specialAssistance = document.getElementById('option-special-assistance')?.checked;
    
    // In a real application, these would trigger API calls with additional parameters
    // For this demo, we'll just show a message
    if (flexibleDate || availableBerth || disability || railwayPass || specialAssistance) {
        showMessage('Filter applied! In a production environment, this would refine the search results.', 'info');
    }
    
    // Sync special assistance with passenger form (to be shown during booking)
    if (specialAssistance) {
        localStorage.setItem('specialAssistanceRequired', 'true');
    } else {
        localStorage.removeItem('specialAssistanceRequired');
    }
}

/**
 * Reset all filter options
 */
function resetAllFilters() {
    // Reset class filters
    document.querySelectorAll('.class-filter').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset train type filters
    document.querySelectorAll('.train-type-filter').forEach(checkbox => {
        checkbox.checked = (checkbox.id === 'type-all'); // Check only 'All Types'
    });
    
    // Reset additional options
    document.querySelectorAll('.option-filter').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset available only toggle
    const showAvailableOnly = document.getElementById('showAvailableOnly');
    if (showAvailableOnly) {
        showAvailableOnly.checked = false;
    }
    
    // Show all trains
    if (searchResults && searchResults.length > 0) {
        displaySearchResults(searchResults);
    }
    
    // Show feedback
    showMessage('Filters have been reset', 'info');
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
            
            ${booking.specialAssistanceRequired ? `
            <div style="margin-bottom: 20px; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                <h3 style="color: #2196f3; margin-top: 0;">Special Assistance Required</h3>
                <p style="margin: 8px 0 0;">This booking includes passengers requiring special assistance. Please contact the station manager or railway staff for assistance services.</p>
            </div>
            ` : ''}
            
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
                            ${passenger.specialAssistance ? `
                            <tr>
                                <td colspan="7" style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;">
                                    <div style="margin: 5px 0; font-weight: bold; color: #2196f3;">Special Assistance: 
                                        ${(() => {
                                            const sa = passenger.specialAssistance;
                                            let assistanceItems = [];
                                            
                                            if (sa.wheelchairRequired) {
                                                assistanceItems.push('Wheelchair Assistance');
                                            }
                                            if (sa.medicalAssistanceRequired) {
                                                assistanceItems.push('Medical Assistance');
                                            }
                                            if (sa.accompanyingAssistantRequired) {
                                                assistanceItems.push('Accompanying Assistant');
                                            }
                                            
                                            return assistanceItems.length > 0 ? assistanceItems.join(', ') : 'None';
                                        })()}
                                    </div>
                                    ${passenger.specialAssistance.notes ? `
                                    <div style="margin: 5px 0; color: #666;">Notes: ${passenger.specialAssistance.notes}</div>
                                    ` : ''}
                                </td>
                            </tr>
                            ` : ''}
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
                ${booking.specialAssistanceRequired ? `
                <p style="margin: 0 0 5px; color: #2196f3;">• For special assistance, please report to the Station Manager's office at least 60 minutes before departure.</p>
                <p style="margin: 0 0 5px; color: #2196f3;">• Wheelchair and assistance services are provided free of charge by Indian Railways.</p>
                ` : ''}
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
 * Show train schedule in modal
 */
function showTrainSchedule(trainIndex) {
    const train = searchResults[trainIndex];
    if (!train) return;
    
    // Set train info in modal
    document.getElementById('scheduleTrainNumber').textContent = train.number;
    document.getElementById('scheduleTrainName').textContent = train.name;
    document.getElementById('scheduleFromStation').textContent = train.fromStation;
    document.getElementById('scheduleToStation').textContent = train.toStation;
    
    // Set running days badges
    const runsOnElement = document.getElementById('scheduleRunsOn');
    runsOnElement.innerHTML = '';
    
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    days.forEach((day, i) => {
        const isRunning = train.runningDays.includes(i);
        const badgeClass = isRunning ? 'bg-success' : 'bg-secondary';
        runsOnElement.innerHTML += `<span class="badge ${badgeClass} me-1">${day}</span>`;
    });
    
    // Populate stops - in a real app, this would come from the server
    const stopsBody = document.getElementById('trainStopsBody');
    stopsBody.innerHTML = ''; // Clear existing stops
    
    // Mock stops data - in a real application, this would come from the API
    const stops = getMockTrainStops(train);
    
    stops.forEach((stop, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${stop.stationCode}</td>
            <td>${stop.stationName}</td>
            <td>${stop.routeNumber}</td>
            <td>${stop.arrivalTime || '-'}</td>
            <td>${stop.departureTime || '-'}</td>
            <td>${stop.haltTime || '-'}</td>
            <td>${stop.distance} KM</td>
            <td>${stop.day}</td>
        `;
        stopsBody.appendChild(row);
    });
    
    // Show the modal
    const scheduleModal = new bootstrap.Modal(document.getElementById('trainScheduleModal'));
    scheduleModal.show();
}

/**
 * Show future availability in modal
 */
function showFutureAvailability(trainIndex, classType) {
    const train = searchResults[trainIndex];
    if (!train) return;
    
    // Set train info in modal
    document.getElementById('availabilityTrainInfo').textContent = 
        `${train.number} - ${train.name}`;
    document.getElementById('availabilityFromStation').textContent = train.fromStation;
    document.getElementById('availabilityToStation').textContent = train.toStation;
    
    // Set selected class
    document.getElementById('availabilityClassSelect').value = classType;
    
    // Populate future dates - in a real app, this would come from the server
    const futureDatesBody = document.getElementById('futureDatesBody');
    futureDatesBody.innerHTML = ''; // Clear existing dates
    
    // Generate next 6 dates and random availability
    const today = new Date(train.journeyDate);
    
    for (let i = 0; i < 6; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        // Skip dates when train doesn't run
        if (!train.runningDays.includes(date.getDay())) continue;
        
        // Generate random availability for demonstration
        const availabilityStatus = getRandomAvailability();
        const statusClass = getStatusClass(availabilityStatus.status);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(date)}</td>
            <td>
                <span class="berth-details">${availabilityStatus.berths}</span>
            </td>
            <td class="${statusClass}">${availabilityStatus.status}</td>
            <td>₹ ${getClassFare(classType, train)}</td>
        `;
        futureDatesBody.appendChild(row);
    }
    
    // Show the modal
    const availabilityModal = new bootstrap.Modal(document.getElementById('futureAvailabilityModal'));
    availabilityModal.show();
}

/**
 * Get class fare from train data
 */
function getClassFare(classType, train) {
    return train.classes[classType]?.fare || '---';
}

/**
 * Get CSS class for availability status
 */
function getStatusClass(status) {
    if (status.includes('Available')) return 'text-success';
    if (status.includes('RAC')) return 'text-warning';
    return 'text-danger';
}

/**
 * Generate random availability status for demonstration
 */
function getRandomAvailability() {
    const statuses = [
        { status: 'Available', berths: 'LB: 2, MB: 3, UB: 5, SL: 1' },
        { status: 'RAC 5', berths: 'Booking as RAC' },
        { status: 'WL 12/WL 8', berths: 'Currently Waitlisted' },
        { status: 'Available', berths: 'LB: 1, UB: 2' },
        { status: 'Regret', berths: 'No seats available' }
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

/**
 * Get mock train stops for a train
 */
function getMockTrainStops(train) {
    // This would come from the API in a real application
    const fromCity = train.fromStation;
    const toCity = train.toStation;
    
    // Generate some intermediate stops based on the route
    const stops = [];
    
    // Source station
    stops.push({
        stationCode: fromCity,
        stationName: fromCity + ' Station',
        routeNumber: 1,
        arrivalTime: '---',
        departureTime: train.departureTime,
        haltTime: '---',
        distance: 0,
        day: 1
    });
    
    // Generate some intermediate stops
    const routeMap = {
        'Delhi': ['Kanpur', 'Allahabad', 'Mughal Sarai', 'Patna'],
        'Mumbai': ['Surat', 'Vadodara', 'Ahmedabad', 'Jaipur'],
        'Kolkata': ['Asansol', 'Dhanbad', 'Gaya', 'Patna'],
        'Chennai': ['Vijayawada', 'Warangal', 'Nagpur', 'Bhopal']
    };
    
    // Find route based on source city
    let route = [];
    for (const city in routeMap) {
        if (fromCity.includes(city)) {
            route = routeMap[city];
            break;
        }
    }
    
    // If no route found, use default stations
    if (route.length === 0) {
        route = ['Station A', 'Station B', 'Station C'];
    }
    
    // Add intermediate stops
    let distance = 100;
    let currentTime = new Date(`2023-01-01T${train.departureTime}`);
    let currentDay = 1;
    
    route.forEach((station, index) => {
        // Add some hours to the current time
        currentTime.setHours(currentTime.getHours() + 2);
        distance += 150 + Math.floor(Math.random() * 100);
        
        // Check if day changed
        if (currentTime.getHours() < 4 && index > 0) {
            currentDay++;
        }
        
        const arrivalTime = currentTime.toTimeString().substr(0, 5);
        
        // Add some minutes for halts at major stations
        currentTime.setMinutes(currentTime.getMinutes() + 10);
        const departureTime = currentTime.toTimeString().substr(0, 5);
        
        stops.push({
            stationCode: station.substr(0, 3).toUpperCase(),
            stationName: station + ' Junction',
            routeNumber: index + 2,
            arrivalTime: arrivalTime,
            departureTime: departureTime,
            haltTime: '10',
            distance: distance,
            day: currentDay
        });
    });
    
    // Destination station
    distance += 150 + Math.floor(Math.random() * 100);
    currentTime.setHours(currentTime.getHours() + 3);
    
    // Check if day changed
    if (currentTime.getHours() < 8) {
        currentDay++;
    }
    
    stops.push({
        stationCode: toCity,
        stationName: toCity + ' Station',
        routeNumber: stops.length + 1,
        arrivalTime: train.arrivalTime,
        departureTime: '---',
        haltTime: '---',
        distance: distance,
        day: currentDay
    });
    
    return stops;
}

/**
 * Verify PNR for TravelBites food ordering
 */
function verifyTravelBitesPNR() {
    const pnrNumber = document.getElementById('pnrNumber').value.trim();
    if (!pnrNumber) {
        showMessage('Please enter a valid PNR number', 'error');
        return;
    }
    
    // Show loading state
    document.getElementById('verifyPnrBtn').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
    document.getElementById('verifyPnrBtn').disabled = true;
    
    // Simulated server verification delay
    setTimeout(() => {
        // Reset button state
        document.getElementById('verifyPnrBtn').innerHTML = 'Verify PNR & Continue';
        document.getElementById('verifyPnrBtn').disabled = false;
        
        // In a real app, this would do an API call to verify PNR
        const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
        const booking = bookings[pnrNumber];
        
        if (!booking) {
            showMessage('PNR not found. Please check the number and try again.', 'error');
            return;
        }
        
        // Check if the ticket is cancelled
        if (booking.isCancelled || (booking.passengers && booking.passengers.some(p => p.currentStatus === 'CANC'))) {
            showMessage('This ticket has been cancelled. Food ordering is not available for cancelled tickets.', 'error');
            return;
        }
        
        // Load train journey details and populate delivery stations
        const deliveryStation = document.getElementById('deliveryStation');
        deliveryStation.disabled = false;
        deliveryStation.innerHTML = '';
        
        // Create a train object from the booking data
        const train = {
            fromStation: booking.fromStation,
            toStation: booking.toStation,
            departureTime: booking.departureTime,
            arrivalTime: booking.arrivalTime,
            journeyDate: booking.journeyDate
        };
        
        // Add options for all stations in the journey (in a real app, only stations with food service would be shown)
        const trainStops = getMockTrainStops(train);
        trainStops.forEach(stop => {
            deliveryStation.innerHTML += `<option value="${stop.stationCode}">${stop.stationName} (${stop.stationCode}), Day ${stop.day}, ${stop.arrivalTime || stop.departureTime}</option>`;
        });
        
        // Show menu section
        document.getElementById('menuSection').classList.remove('d-none');
        
        showMessage('PNR verified successfully. You can now select your delivery station and food items.', 'success');
    }, 1500);
}

/**
 * Update food order summary based on item quantities
 */
function updateFoodOrderSummary() {
    const items = [];
    let subtotal = 0;
    
    // Find all counter inputs with values > 0
    document.querySelectorAll('.counter-input').forEach(input => {
        const quantity = parseInt(input.value);
        if (quantity > 0) {
            const foodItem = input.closest('.food-item');
            if (foodItem) {
                const nameElement = foodItem.querySelector('.food-name');
                const priceElement = foodItem.querySelector('.food-price');
                
                if (nameElement && priceElement) {
                    const name = nameElement.textContent;
                    const priceText = priceElement.textContent;
                    const price = parseInt(priceText.replace('₹', '').trim());
                    
                    items.push({
                        name: name,
                        quantity: quantity,
                        price: price,
                        total: price * quantity
                    });
                    
                    subtotal += price * quantity;
                }
            }
        }
    });
    
    // Update order items list
    const orderItemsList = document.getElementById('orderItemsList');
    
    if (items.length === 0) {
        orderItemsList.innerHTML = '<p class="text-center text-muted">No items selected</p>';
    } else {
        let itemsHtml = '<ul class="list-group">';
        items.forEach(item => {
            itemsHtml += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fw-bold">${item.name}</span>
                        <span class="text-muted"> × ${item.quantity}</span>
                    </div>
                    <span>₹${item.total}</span>
                </li>
            `;
        });
        itemsHtml += '</ul>';
        orderItemsList.innerHTML = itemsHtml;
    }
    
    // Update totals
    document.getElementById('subtotalAmount').textContent = `₹${subtotal}`;
    const deliveryCharge = subtotal > 0 ? 25 : 0;
    document.getElementById('deliveryCharge').textContent = `₹${deliveryCharge}`;
    document.getElementById('totalAmount').textContent = `₹${subtotal + deliveryCharge}`;
}

/**
 * Place food order
 */
function placeFoodOrder() {
    const deliveryStation = document.getElementById('deliveryStation').value;
    const totalAmount = document.getElementById('totalAmount').textContent;
    
    if (!deliveryStation) {
        showMessage('Please select a delivery station', 'error');
        return;
    }
    
    const orderItems = [];
    document.querySelectorAll('.counter-input').forEach(input => {
        const quantity = parseInt(input.value);
        if (quantity > 0) {
            const foodItem = input.closest('.food-item');
            if (foodItem) {
                const nameElement = foodItem.querySelector('.food-name');
                if (nameElement) {
                    const name = nameElement.textContent;
                    orderItems.push({ name, quantity });
                }
            }
        }
    });
    
    if (orderItems.length === 0) {
        showMessage('Please select at least one food item', 'error');
        return;
    }
    
    // Show loading state
    document.getElementById('placeOrderBtn').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    document.getElementById('placeOrderBtn').disabled = true;
    
    // Simulated server verification delay
    setTimeout(() => {
        // In a real app, this would make an API call to place the order
        
        // Get PNR number to associate with the order
        const pnrNumber = document.getElementById('pnrNumber').value;
        
        // Create order object
        const orderData = {
            pnr: pnrNumber,
            deliveryStation: deliveryStation,
            totalAmount: totalAmount,
            items: orderItems,
            orderDate: new Date().toISOString(),
            status: 'Confirmed',
            deliveryTime: '30-40 minutes after train arrival',
            orderId: 'FO-' + Math.floor(Math.random() * 1000000)
        };
        
        // Save order to localStorage
        saveOrderToStorage(orderData);
        
        // Reset form
        document.getElementById('foodOrderForm').reset();
        document.getElementById('deliveryStation').disabled = true;
        document.getElementById('menuSection').classList.add('d-none');
        document.querySelectorAll('.counter-input').forEach(input => {
            input.value = 0;
        });
        
        // Reset button state
        document.getElementById('placeOrderBtn').innerHTML = 'Place Food Order';
        document.getElementById('placeOrderBtn').disabled = false;
        
        // Close modal
        const foodModal = bootstrap.Modal.getInstance(document.getElementById('travelBitesModal'));
        foodModal.hide();
        
        // Show success message
        showMessage(`Food order placed successfully! Your delivery is scheduled at ${deliveryStation}. Total: ${totalAmount}`, 'success');
    }, 2000);
}

/**
 * Save food order to local storage
 */
function saveOrderToStorage(orderData) {
    // Get existing orders from localStorage
    const foodOrders = JSON.parse(localStorage.getItem('foodOrders') || '{}');
    
    // Get PNR from order
    const pnr = orderData.pnr;
    
    // If this PNR already has orders, add to the array, otherwise create a new array
    if (foodOrders[pnr]) {
        foodOrders[pnr].push(orderData);
    } else {
        foodOrders[pnr] = [orderData];
    }
    
    // Save back to localStorage
    localStorage.setItem('foodOrders', JSON.stringify(foodOrders));
    
    console.log('Food order saved for PNR:', pnr, orderData);
}

/**
 * Cancel a food order
 */
function cancelFoodOrder(pnrNumber, orderIndex) {
    // Get food orders from localStorage
    const foodOrders = JSON.parse(localStorage.getItem('foodOrders') || '{}');
    
    // Check if the order exists
    if (foodOrders[pnrNumber] && foodOrders[pnrNumber][orderIndex]) {
        // Update order status to cancelled
        foodOrders[pnrNumber][orderIndex].status = 'Cancelled';
        
        // Save back to localStorage
        localStorage.setItem('foodOrders', JSON.stringify(foodOrders));
        
        // Show success message
        showMessage('Your food order has been cancelled. Amount will be refunded to your original payment method within 5-7 business days.', 'success');
        
        // Refresh the order display
        trackFoodOrder();
    } else {
        showMessage('Order not found. Please try again.', 'error');
    }
}

/**
 * Track food order using PNR
 */
function trackFoodOrder() {
    const pnrNumber = document.getElementById('trackPnrNumber').value;
    
    if (!pnrNumber) {
        showMessage('Please enter a PNR number', 'error');
        return;
    }
    
    // Show loading
    const orderTrackingResult = document.getElementById('orderTrackingResult');
    const orderStatusContent = document.getElementById('orderStatusContent');
    orderTrackingResult.classList.remove('d-none');
    orderStatusContent.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Fetching order details...</p>
        </div>
    `;
    
    // Simulate server request delay
    setTimeout(() => {
        // Get food orders and booking data from localStorage
        const foodOrders = JSON.parse(localStorage.getItem('foodOrders') || '{}');
        const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
        const booking = bookings[pnrNumber];
        
        // Check if the ticket is cancelled and show a warning
        if (booking && (booking.isCancelled || (booking.passengers && booking.passengers.some(p => p.currentStatus === 'CANC')))) {
            // We still show the orders but display a warning that the ticket is cancelled
            orderStatusContent.innerHTML = `
                <div class="alert alert-warning mb-3">
                    <i data-feather="alert-triangle" class="me-2"></i>
                    This ticket has been cancelled. Any new food orders for this journey cannot be placed.
                </div>
            `;
            feather.replace();
        }
        
        // Check if there are orders for this PNR
        if (foodOrders[pnrNumber] && foodOrders[pnrNumber].length > 0) {
            // Display orders - but don't clear if we displayed the cancellation warning
            if (!(booking && (booking.isCancelled || (booking.passengers && booking.passengers.some(p => p.currentStatus === 'CANC'))))) {
                orderStatusContent.innerHTML = '';
            }
            
            foodOrders[pnrNumber].forEach((order, index) => {
                // Create order card
                const orderCard = document.createElement('div');
                orderCard.className = 'card mb-3';
                
                // Prepare items HTML
                let itemsHtml = '';
                order.items.forEach(item => {
                    itemsHtml += `
                        <div class="d-flex justify-content-between">
                            <span>${item.name} × ${item.quantity}</span>
                        </div>
                    `;
                });
                
                // Status badge color based on order status
                let statusClass = 'bg-success';
                if (order.status === 'Preparing') {
                    statusClass = 'bg-warning text-dark';
                } else if (order.status === 'Cancelled') {
                    statusClass = 'bg-danger';
                }
                
                // Build order card HTML
                orderCard.innerHTML = `
                    <div class="card-header d-flex justify-content-between">
                        <h6 class="mb-0">Order #${order.orderId}</h6>
                        <span class="badge ${statusClass}">${order.status}</span>
                    </div>
                    <div class="card-body">
                        <p class="mb-1"><strong>Delivery Station:</strong> ${order.deliveryStation}</p>
                        <p class="mb-1"><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                        <p class="mb-1"><strong>Delivery Time:</strong> ${order.deliveryTime}</p>
                        <p class="mb-1"><strong>Total Amount:</strong> ${order.totalAmount}</p>
                        
                        <h6 class="mt-3 mb-2">Items Ordered:</h6>
                        <div class="order-items">
                            ${itemsHtml}
                        </div>
                        
                        ${order.status !== 'Cancelled' ? `
                        <div class="mt-3 text-end">
                            <button class="btn btn-sm btn-danger cancel-food-order" data-pnr="${pnrNumber}" data-index="${index}">
                                <i class="feather-icon" data-feather="x-circle"></i> Cancel Order
                            </button>
                        </div>
                        ` : `
                        <div class="mt-3 alert alert-info">
                            <i class="feather-icon" data-feather="info"></i> 
                            This order has been cancelled. Amount refunded.
                        </div>
                        `}
                    </div>
                `;
                
                // Add to content
                orderStatusContent.appendChild(orderCard);
            });
            
            // Add event listeners for cancel buttons
            document.querySelectorAll('.cancel-food-order').forEach(button => {
                button.addEventListener('click', function() {
                    const pnr = this.getAttribute('data-pnr');
                    const index = parseInt(this.getAttribute('data-index'));
                    
                    if (confirm('Are you sure you want to cancel this food order? This action cannot be undone.')) {
                        cancelFoodOrder(pnr, index);
                    }
                });
            });
            
            // Initialize feather icons in the new content
            feather.replace();
            
        } else {
            // No orders found for this PNR
            orderStatusContent.innerHTML = `
                <div class="alert alert-info">
                    <i data-feather="info" class="me-2"></i>
                    No food orders found for PNR: ${pnrNumber}
                </div>
                <p>You can place a new food order from the "Order Food" tab.</p>
            `;
            feather.replace();
        }
    }, 1500);
}

/**
 * Create sample booking for testing
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
