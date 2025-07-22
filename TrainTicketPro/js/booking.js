/**
 * ChukChukGO - Booking Management
 * Handles train booking flow, passenger details, and seat selection
 */

// Initialize passenger details management when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for passenger form submission
    const passengerForm = document.getElementById('passengerForm');
    if (passengerForm) {
        passengerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validatePassengerDetails()) {
                continueToPayment();
            }
        });
    }
    
    // Add event listener for travel insurance checkbox
    const travelInsurance = document.getElementById('travelInsurance');
    if (travelInsurance) {
        travelInsurance.addEventListener('change', function() {
            updateTotalFare();
        });
    }
});

/**
 * Validate all passenger details before proceeding
 */
function validatePassengerDetails() {
    let isValid = true;
    
    // Validate each passenger's details
    for (let i = 1; i <= currentPassengerCount; i++) {
        const name = document.getElementById(`passengerName${i}`);
        const age = document.getElementById(`passengerAge${i}`);
        const gender = document.getElementById(`passengerGender${i}`);
        
        // Check required fields
        if (!name.value.trim()) {
            showInputError(name, 'Passenger name is required');
            isValid = false;
        }
        
        if (!age.value) {
            showInputError(age, 'Age is required');
            isValid = false;
        } else if (parseInt(age.value) < 1 || parseInt(age.value) > 120) {
            showInputError(age, 'Please enter a valid age');
            isValid = false;
        }
        
        if (!gender.value) {
            showInputError(gender, 'Please select gender');
            isValid = false;
        }
        
        // Check ID proof fields if a concession is selected
        const concession = document.getElementById(`passengerConcession${i}`);
        if (concession.value !== 'NONE') {
            const idProofType = document.getElementById(`idProofType${i}`);
            const idProofNumber = document.getElementById(`idProofNumber${i}`);
            
            if (!idProofNumber.value.trim()) {
                showInputError(idProofNumber, 'ID proof number is required for concession');
                isValid = false;
            } else {
                // Validate ID proof based on type
                if (idProofType.value === 'AADHAR' && !/^\d{12}$/.test(idProofNumber.value)) {
                    showInputError(idProofNumber, 'Aadhar number must be 12 digits');
                    isValid = false;
                } else if (idProofType.value === 'PAN' && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idProofNumber.value)) {
                    showInputError(idProofNumber, 'Invalid PAN format');
                    isValid = false;
                }
            }
        }
    }
    
    // Validate contact information
    const contactPhone = document.getElementById('contactPhone');
    const contactEmail = document.getElementById('contactEmail');
    
    if (!contactPhone.value.trim()) {
        showInputError(contactPhone, 'Mobile number is required');
        isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(contactPhone.value)) {
        showInputError(contactPhone, 'Please enter a valid 10-digit mobile number');
        isValid = false;
    }
    
    if (!contactEmail.value.trim()) {
        showInputError(contactEmail, 'Email is required');
        isValid = false;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(contactEmail.value)) {
        showInputError(contactEmail, 'Please enter a valid email address');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Update the total fare based on passenger count and selected options
 */
function updateTotalFare() {
    if (!selectedTrain || !selectedClass) return;
    
    const baseFare = selectedTrain.classes[selectedClass].fare;
    const passengerFare = baseFare * currentPassengerCount;
    
    // Additional charges
    const convenienceFee = 15 * currentPassengerCount;
    
    // Check if travel insurance is selected
    const insuranceElement = document.getElementById('travelInsurance');
    const insuranceFee = (insuranceElement && insuranceElement.checked) ? 15 * currentPassengerCount : 0;
    
    // Update the total fare
    totalFare = passengerFare + convenienceFee + insuranceFee;
    
    // If payment summary exists, update it
    const paymentSummary = document.getElementById('paymentSummary');
    if (paymentSummary) {
        paymentSummary.innerHTML = `
            <div class="mb-3">
                <div><strong>${selectedTrain.number} - ${selectedTrain.name}</strong></div>
                <div>${selectedTrain.fromStation} → ${selectedTrain.toStation}</div>
                <div>${formatDate(selectedTrain.journeyDate)} | ${getClassFullName(selectedClass)}</div>
            </div>
            <div class="mb-3">
                <div><strong>Passengers:</strong> ${currentPassengerCount}</div>
                <div><strong>Base Fare:</strong> ₹ ${baseFare} × ${currentPassengerCount} = ₹ ${passengerFare}</div>
                <div><strong>Convenience Fee:</strong> ₹ ${convenienceFee}</div>
                ${insuranceFee > 0 ? `<div><strong>Travel Insurance:</strong> ₹ ${insuranceFee}</div>` : ''}
            </div>
        `;
        
        // Update the total display
        const totalFareDisplay = document.getElementById('totalFare');
        if (totalFareDisplay) {
            totalFareDisplay.textContent = `₹ ${totalFare}`;
        }
    }
}

/**
 * Add a new passenger to the booking form
 */
function addPassenger() {
    // Check if we can add more passengers (limit to 6)
    if (currentPassengerCount >= 6) {
        showMessage('Maximum 6 passengers allowed per booking', 'error');
        return;
    }
    
    currentPassengerCount++;
    
    // Create new passenger form
    const passengerDetails = document.getElementById('passengerDetails');
    const newPassengerForm = document.createElement('div');
    newPassengerForm.innerHTML = createPassengerForm(currentPassengerCount);
    passengerDetails.appendChild(newPassengerForm.firstChild);
    
    // Update total fare
    updateTotalFare();
}

/**
 * Remove a passenger from the booking form
 */
function removePassenger(index) {
    // Cannot remove the last passenger
    if (currentPassengerCount <= 1) {
        return;
    }
    
    // Remove the passenger form
    const passengerForm = document.querySelector(`#passengerDetails .passenger-form:nth-child(${index})`);
    if (passengerForm) {
        passengerForm.remove();
        
        // Renumber remaining passengers
        const remainingForms = document.querySelectorAll('#passengerDetails .passenger-form');
        remainingForms.forEach((form, i) => {
            const heading = form.querySelector('h6');
            if (heading) {
                heading.textContent = `Passenger ${i + 1}`;
            }
        });
        
        currentPassengerCount--;
        
        // Update total fare
        updateTotalFare();
    }
}

/**
 * Show seat layout for selection
 */
function showSeatLayout() {
    // This would typically fetch seat layout from the server
    // For demonstration, we'll create a mock layout
    
    const coachLayoutContainer = document.createElement('div');
    coachLayoutContainer.className = 'coach-layout';
    
    let coachHtml = '';
    
    // Different layouts based on class
    if (selectedClass === 'SL' || selectedClass === '3A' || selectedClass === '2A') {
        coachHtml = createSleeperCoachLayout(selectedClass);
    } else if (selectedClass === 'CC' || selectedClass === 'EC' || selectedClass === '2S') {
        coachHtml = createSeatingCoachLayout(selectedClass);
    } else {
        coachHtml = `
            <div class="alert alert-info">
                Seat selection is not available for ${getClassFullName(selectedClass)}. 
                Seats will be assigned by the system.
            </div>
        `;
    }
    
    coachLayoutContainer.innerHTML = coachHtml;
    
    // Add to the modal
    const modalBody = document.querySelector('#bookingModal .modal-body');
    
    // Check if layout already exists
    const existingLayout = modalBody.querySelector('.coach-layout');
    if (existingLayout) {
        existingLayout.remove();
    }
    
    // Add the new layout after the passenger details
    modalBody.appendChild(coachLayoutContainer);
    
    // Add click handlers to selectable berths
    const berths = document.querySelectorAll('.berth.available');
    berths.forEach(berth => {
        berth.addEventListener('click', function() {
            selectBerth(this);
        });
    });
}

/**
 * Create a visual layout for sleeper coaches
 */
function createSleeperCoachLayout(classType) {
    let title = '';
    let berthsPerSet = 6;
    
    switch (classType) {
        case 'SL':
            title = 'Sleeper (SL) Coach';
            break;
        case '3A':
            title = 'AC 3 Tier (3A) Coach';
            break;
        case '2A':
            title = 'AC 2 Tier (2A) Coach';
            berthsPerSet = 4; // Upper, Lower, Upper, Lower
            break;
    }
    
    let html = `
        <div class="coach-title">${title} - Coach Selection</div>
        <div class="berth-legend">
            <div class="legend-item">
                <div class="legend-color available-seat"></div>
                <span>Available</span>
            </div>
            <div class="legend-item">
                <div class="legend-color booked-seat"></div>
                <span>Booked</span>
            </div>
            <div class="legend-item">
                <div class="legend-color your-seat"></div>
                <span>Your Selection</span>
            </div>
        </div>
        <div class="coach-selector mb-3">
            <select class="form-select" onchange="changeSleeper(this.value)">
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="B3">B3</option>
            </select>
        </div>
        <div class="sleeper-coach">
    `;
    
    // Create mock berth sets
    const totalSets = 12; // 12 sets per coach typically
    
    for (let i = 1; i <= totalSets; i++) {
        html += `<div class="berth-set">`;
        
        // Create berths in the set
        if (classType === '2A') {
            // 2A has 4 berths per set
            html += `
                <div class="berth lower available" data-berth="${i*2-1} LB">L-${i*2-1}</div>
                <div class="berth upper available" data-berth="${i*2-1} UB">U-${i*2-1}</div>
                <div class="berth lower available" data-berth="${i*2} LB">L-${i*2}</div>
                <div class="berth upper available" data-berth="${i*2} UB">U-${i*2}</div>
            `;
        } else {
            // 3A and SL have 6 berths per set
            html += `
                <div class="berth lower available" data-berth="${i*3-2} LB">L-${i*3-2}</div>
                <div class="berth middle available" data-berth="${i*3-1} MB">M-${i*3-1}</div>
                <div class="berth upper available" data-berth="${i*3} UB">U-${i*3}</div>
            `;
            
            // Side berths
            if (i % 2 === 0) {
                html += `
                    <div class="berth side-lower available" data-berth="SL-${i}">SL-${i}</div>
                    <div class="berth side-upper available" data-berth="SU-${i}">SU-${i}</div>
                `;
            }
        }
        
        html += `</div>`;
        
        // Add some random booked seats for demonstration
        if (i === 2 || i === 5 || i === 8) {
            const berths = document.querySelectorAll('.berth.available');
            for (let j = 0; j < Math.min(3, berths.length); j++) {
                const randomIndex = Math.floor(Math.random() * berths.length);
                if (berths[randomIndex]) {
                    berths[randomIndex].classList.remove('available');
                    berths[randomIndex].classList.add('booked');
                    berths[randomIndex].removeAttribute('data-berth');
                }
            }
        }
    }
    
    html += `
        </div>
        <div class="mt-3 text-center">
            <button class="btn btn-outline-secondary" onclick="hideSeatLayout()">Close Seat Selection</button>
        </div>
    `;
    
    return html;
}

/**
 * Create a visual layout for seating coaches
 */
function createSeatingCoachLayout(classType) {
    let title = '';
    
    switch (classType) {
        case 'CC':
            title = 'Chair Car (CC) Coach';
            break;
        case 'EC':
            title = 'Executive Class (EC) Coach';
            break;
        case '2S':
            title = 'Second Sitting (2S) Coach';
            break;
    }
    
    let html = `
        <div class="coach-title">${title} - Seat Selection</div>
        <div class="berth-legend">
            <div class="legend-item">
                <div class="legend-color available-seat"></div>
                <span>Available</span>
            </div>
            <div class="legend-item">
                <div class="legend-color booked-seat"></div>
                <span>Booked</span>
            </div>
            <div class="legend-item">
                <div class="legend-color your-seat"></div>
                <span>Your Selection</span>
            </div>
        </div>
        <div class="coach-selector mb-3">
            <select class="form-select" onchange="changeSleeper(this.value)">
                <option value="C1">C1</option>
                <option value="C2">C2</option>
                <option value="C3">C3</option>
            </select>
        </div>
        <div class="text-center mb-3">
            <div class="alert alert-info">
                Seat selection is simplified for demonstration. In a real application, you would see a detailed coach layout.
            </div>
        </div>
        <div class="seat-selection">
            <div class="row">
    `;
    
    // Create a simple grid of seats
    const rows = 10;
    const seatsPerRow = 6;
    
    for (let i = 1; i <= rows; i++) {
        html += `<div class="col-12 mb-2"><div class="d-flex justify-content-around">`;
        
        for (let j = 1; j <= seatsPerRow; j++) {
            const seatNumber = (i - 1) * seatsPerRow + j;
            const isBooked = [4, 12, 23, 35, 46, 52].includes(seatNumber);
            
            if (isBooked) {
                html += `<div class="berth booked">S-${seatNumber}</div>`;
            } else {
                html += `<div class="berth available" data-berth="S-${seatNumber}">S-${seatNumber}</div>`;
            }
        }
        
        html += `</div></div>`;
    }
    
    html += `
            </div>
        </div>
        <div class="mt-3 text-center">
            <button class="btn btn-outline-secondary" onclick="hideSeatLayout()">Close Seat Selection</button>
        </div>
    `;
    
    return html;
}

/**
 * Handle berth selection
 */
function selectBerth(berthElement) {
    // Check if already selected
    if (berthElement.classList.contains('selected')) {
        berthElement.classList.remove('selected');
        return;
    }
    
    // Get current selection count
    const selectedBerths = document.querySelectorAll('.berth.selected');
    
    // Ensure we don't select more berths than passengers
    if (selectedBerths.length >= currentPassengerCount) {
        showMessage(`You can only select up to ${currentPassengerCount} berths`, 'error');
        return;
    }
    
    // Add selected class
    berthElement.classList.add('selected');
    
    // Get selected berth data
    const berthData = berthElement.getAttribute('data-berth');
    
    // Update passenger berth preference if possible
    const passengerIndex = selectedBerths.length; // 0-based
    const berthPreference = document.getElementById(`passengerBerth${passengerIndex + 1}`);
    
    if (berthPreference) {
        // Set the berth preference based on selection
        if (berthData.includes('LB')) {
            berthPreference.value = 'LB';
        } else if (berthData.includes('MB')) {
            berthPreference.value = 'MB';
        } else if (berthData.includes('UB')) {
            berthPreference.value = 'UB';
        } else if (berthData.includes('SL')) {
            berthPreference.value = 'SL';
        } else if (berthData.includes('SU')) {
            berthPreference.value = 'SU';
        }
    }
}

/**
 * Change sleeper coach
 */
function changeSleeper(coachNumber) {
    // This would typically fetch a new coach layout from the server
    // For demonstration, we'll just show a message
    showMessage(`Coach ${coachNumber} layout loaded`, 'info');
    
    // Reset selections
    const selectedBerths = document.querySelectorAll('.berth.selected');
    selectedBerths.forEach(berth => {
        berth.classList.remove('selected');
    });
}

/**
 * Hide seat layout
 */
function hideSeatLayout() {
    const coachLayout = document.querySelector('.coach-layout');
    if (coachLayout) {
        coachLayout.remove();
    }
}

/**
 * Submit booking details to server
 */
function submitBooking(paymentMethod) {
    // Gather all passenger details
    const passengers = [];
    
    for (let i = 1; i <= currentPassengerCount; i++) {
        const passenger = {
            name: document.getElementById(`passengerName${i}`).value,
            age: document.getElementById(`passengerAge${i}`).value,
            gender: document.getElementById(`passengerGender${i}`).value,
            berth: document.getElementById(`passengerBerth${i}`).value,
            concession: document.getElementById(`passengerConcession${i}`).value
        };
        
        // Add ID proof if applicable
        if (passenger.concession !== 'NONE') {
            passenger.idProofType = document.getElementById(`idProofType${i}`).value;
            passenger.idProofNumber = document.getElementById(`idProofNumber${i}`).value;
        }
        
        passengers.push(passenger);
    }
    
    // Gather contact details
    const contactDetails = {
        phone: document.getElementById('contactPhone').value,
        email: document.getElementById('contactEmail').value
    };
    
    // Gather travel preferences
    const travelPreferences = {
        seatPreference: document.getElementById('seatPreference').value,
        mealPreference: document.getElementById('mealPreference').value,
        insuranceOpted: document.getElementById('travelInsurance').checked
    };
    
    // Create booking object
    const booking = {
        trainNumber: selectedTrain.number,
        trainName: selectedTrain.name,
        fromStation: selectedTrain.fromStation,
        toStation: selectedTrain.toStation,
        journeyDate: selectedTrain.journeyDate,
        departureTime: selectedTrain.departureTime,
        arrivalTime: selectedTrain.arrivalTime,
        travelClass: selectedClass,
        fare: totalFare,
        passengers: passengers,
        contactDetails: contactDetails,
        travelPreferences: travelPreferences,
        paymentMethod: paymentMethod
    };
    
    // In a real application, this would be posted to the server
    // For demonstration, we'll log the data and proceed
    console.log('Booking data:', booking);
    
    // Proceed to payment confirmation
    processPayment(paymentMethod);
}

/**
 * Save booking details to local storage to simulate server persistence
 */
function saveBookingToStorage(pnr, bookingData) {
    // Get existing bookings
    let bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    
    // Add new booking
    bookings[pnr] = bookingData;
    
    // Save back to storage
    localStorage.setItem('bookings', JSON.stringify(bookings));
}
