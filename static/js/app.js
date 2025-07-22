/**
 * Main Application JavaScript
 * Handles UI interactions and application state
 */

class ChukChukGOApp {
    constructor() {
        this.currentUser = null;
        this.searchResults = [];
        this.selectedTrain = null;
        this.selectedClass = null;
        this.passengerCount = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCurrentTime();
        this.loadStations();
        
        // Update time every minute
        setInterval(() => this.updateCurrentTime(), 60000);
    }

    setupEventListeners() {
        // Search form
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        // PNR form
        const pnrForm = document.getElementById('pnrForm');
        if (pnrForm) {
            pnrForm.addEventListener('submit', (e) => this.handlePNRCheck(e));
        }

        // Login/Register forms
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Station search inputs
        const fromStation = document.getElementById('fromStation');
        const toStation = document.getElementById('toStation');
        
        if (fromStation) {
            fromStation.addEventListener('input', (e) => this.handleStationSearch(e, 'from'));
        }
        
        if (toStation) {
            toStation.addEventListener('input', (e) => this.handleStationSearch(e, 'to'));
        }

        // Passenger count
        const passengerSelect = document.getElementById('passengers');
        if (passengerSelect) {
            passengerSelect.addEventListener('change', (e) => {
                this.passengerCount = parseInt(e.target.value);
            });
        }

        // Journey date validation
        const journeyDate = document.getElementById('journeyDate');
        if (journeyDate) {
            const today = new Date().toISOString().split('T')[0];
            journeyDate.setAttribute('min', today);
        }
    }

    updateCurrentTime() {
        const timeDisplay = document.getElementById('time-display');
        const dateDisplay = document.getElementById('date-display');
        
        if (timeDisplay && dateDisplay) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-IN', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            const dateString = now.toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short' 
            });
            
            timeDisplay.textContent = timeString;
            dateDisplay.textContent = dateString;
        }
    }

    async loadStations() {
        try {
            const response = await api.getStations();
            if (response.success) {
                this.stations = response.data;
                this.setupStationAutocomplete();
            }
        } catch (error) {
            console.error('Failed to load stations:', error);
        }
    }

    setupStationAutocomplete() {
        const fromInput = document.getElementById('fromStation');
        const toInput = document.getElementById('toStation');
        
        if (fromInput) this.createStationDropdown(fromInput, 'from');
        if (toInput) this.createStationDropdown(toInput, 'to');
    }

    createStationDropdown(input, type) {
        const dropdown = document.createElement('div');
        dropdown.className = 'station-dropdown';
        dropdown.id = `${type}StationDropdown`;
        input.parentNode.appendChild(dropdown);
        
        input.addEventListener('focus', () => {
            this.showStationSuggestions(input, dropdown);
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => dropdown.style.display = 'none', 200);
        });
    }

    async handleStationSearch(event, type) {
        const query = event.target.value;
        const dropdown = document.getElementById(`${type}StationDropdown`);
        
        if (query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }

        try {
            const response = await api.getStations(query);
            if (response.success) {
                this.showStationSuggestions(event.target, dropdown, response.data);
            }
        } catch (error) {
            console.error('Station search failed:', error);
        }
    }

    showStationSuggestions(input, dropdown, stations = this.stations) {
        if (!stations || stations.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        const query = input.value.toLowerCase();
        const filtered = stations.filter(station => 
            station.name.toLowerCase().includes(query) ||
            station.code.toLowerCase().includes(query) ||
            station.city.toLowerCase().includes(query)
        ).slice(0, 8);

        dropdown.innerHTML = filtered.map(station => `
            <div class="station-option" onclick="app.selectStation('${input.id}', '${station.code}', '${station.name}', '${station.city}')">
                <div class="station-name">${station.name} (${station.code})</div>
                <div class="station-city">${station.city}, ${station.state}</div>
            </div>
        `).join('');

        dropdown.style.display = filtered.length > 0 ? 'block' : 'none';
    }

    selectStation(inputId, code, name, city) {
        const input = document.getElementById(inputId);
        input.value = `${name} (${code})`;
        input.dataset.stationCode = code;
        
        const dropdown = document.getElementById(inputId.replace('Station', 'StationDropdown'));
        dropdown.style.display = 'none';
    }

    async handleSearch(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const fromInput = document.getElementById('fromStation');
        const toInput = document.getElementById('toStation');
        
        const searchParams = {
            from: fromInput.dataset.stationCode || fromInput.value.match(/\(([^)]+)\)/)?.[1],
            to: toInput.dataset.stationCode || toInput.value.match(/\(([^)]+)\)/)?.[1],
            date: formData.get('journeyDate'),
            class: formData.get('class'),
            passengers: formData.get('passengers')
        };

        if (!searchParams.from || !searchParams.to || !searchParams.date) {
            this.showMessage('Please fill all required fields', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await api.searchTrains(searchParams);
            if (response.success) {
                this.searchResults = response.data;
                this.displaySearchResults(response.data, searchParams);
            } else {
                this.showMessage(response.message || 'Search failed', 'error');
            }
        } catch (error) {
            this.showMessage('Search failed. Please try again.', 'error');
            console.error('Search error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    displaySearchResults(trains, searchParams) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (trains.length === 0) {
            resultsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i data-feather="alert-circle"></i>
                    No trains found for your search criteria. Please try different dates or stations.
                </div>
            `;
            feather.replace();
            return;
        }

        const resultsHTML = `
            <div class="search-summary mb-4">
                <h3>Available Trains</h3>
                <p>${searchParams.from} → ${searchParams.to} | ${searchParams.date} | ${searchParams.passengers} passenger(s)</p>
            </div>
            <div class="train-list">
                ${trains.map((train, index) => this.createTrainCard(train, index)).join('')}
            </div>
        `;

        resultsContainer.innerHTML = resultsHTML;
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        feather.replace();
    }

    createTrainCard(train, index) {
        const classesHTML = Object.entries(train.classes).map(([classType, classInfo]) => {
            const availabilityClass = classInfo.available === 'Available' ? 'avl-available' : 
                                    classInfo.available === 'RAC' ? 'avl-rac' : 'avl-waiting';
            
            const availabilityText = classInfo.available === 'Available' ? `Avl ${classInfo.seats}` :
                                   classInfo.available === 'RAC' ? `RAC ${classInfo.racStatus}` :
                                   `WL ${classInfo.waitlist}`;

            return `
                <div class="train-class" data-train-index="${index}" data-class-type="${classType}" 
                     onclick="app.selectTrainClass(${index}, '${classType}')">
                    <div class="class-type">${this.getClassFullName(classType)}</div>
                    <div class="class-fare">₹ ${classInfo.fare}</div>
                    <div class="class-availability ${availabilityClass}">${availabilityText}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="train-details" id="train-${index}">
                <div class="train-info">
                    <div class="train-info-primary">
                        <div class="train-number-name">${train.number} - ${train.name}</div>
                        <div class="train-runs-on">Runs on: ${train.runningDays.join(', ')}</div>
                    </div>
                </div>
                
                <div class="train-timing">
                    <div class="train-departure">
                        <div class="train-time">${train.departureTime}</div>
                        <div class="train-station">${train.fromStation}</div>
                        <div class="train-date">${new Date(train.journeyDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                    </div>
                    
                    <div class="train-duration">
                        <div class="train-duration-time">${train.duration}</div>
                        <div>Duration</div>
                    </div>
                    
                    <div class="train-arrival">
                        <div class="train-time">${train.arrivalTime}</div>
                        <div class="train-station">${train.toStation}</div>
                        <div class="train-date">${new Date(train.journeyDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                    </div>
                </div>
                
                <div class="train-fare-seats">
                    ${classesHTML}
                </div>
            </div>
        `;
    }

    selectTrainClass(trainIndex, classType) {
        // Remove previous selections
        document.querySelectorAll('.train-class').forEach(el => {
            el.classList.remove('train-class-selected');
        });

        // Highlight selected class
        const selectedElement = document.querySelector(
            `.train-class[data-train-index="${trainIndex}"][data-class-type="${classType}"]`
        );
        if (selectedElement) {
            selectedElement.classList.add('train-class-selected');
        }

        this.selectedTrain = this.searchResults[trainIndex];
        this.selectedClass = classType;

        // Add book button
        const trainCard = document.getElementById(`train-${trainIndex}`);
        let bookBtn = trainCard.querySelector('.book-btn-container');

        if (!bookBtn) {
            bookBtn = document.createElement('div');
            bookBtn.className = 'book-btn-container';
            trainCard.appendChild(bookBtn);
        }

        bookBtn.innerHTML = `
            <button class="btn btn-primary" onclick="app.proceedToBooking()">
                <i data-feather="check-circle"></i> Book ${this.getClassFullName(classType)}
            </button>
        `;
        feather.replace();
    }

    proceedToBooking() {
        if (!this.selectedTrain || !this.selectedClass) {
            this.showMessage('Please select a train and class', 'error');
            return;
        }

        // Show booking modal or redirect to booking page
        this.showBookingModal();
    }

    showBookingModal() {
        const modal = document.getElementById('bookingModal');
        if (!modal) {
            this.createBookingModal();
            return;
        }

        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = this.createBookingForm();
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    createBookingModal() {
        const modalHTML = `
            <div class="modal fade" id="bookingModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Complete Your Booking</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${this.createBookingForm()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
        modal.show();
    }

    createBookingForm() {
        const fare = this.selectedTrain.classes[this.selectedClass].fare;
        const totalFare = fare * this.passengerCount;

        return `
            <form id="bookingForm" onsubmit="app.handleBooking(event)">
                <div class="booking-summary mb-4">
                    <h6>Journey Details</h6>
                    <p><strong>${this.selectedTrain.number} - ${this.selectedTrain.name}</strong></p>
                    <p>${this.selectedTrain.fromStation} → ${this.selectedTrain.toStation}</p>
                    <p>${this.selectedTrain.journeyDate} | ${this.getClassFullName(this.selectedClass)}</p>
                    <p><strong>Total Fare: ₹${totalFare}</strong></p>
                </div>

                <div class="passenger-details mb-4">
                    <h6>Passenger Details</h6>
                    ${Array.from({length: this.passengerCount}, (_, i) => this.createPassengerForm(i + 1)).join('')}
                </div>

                <div class="contact-details mb-4">
                    <h6>Contact Details</h6>
                    <div class="row">
                        <div class="col-md-6">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" name="email" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Phone *</label>
                            <input type="tel" class="form-control" name="phone" pattern="[6-9][0-9]{9}" required>
                        </div>
                    </div>
                </div>

                <div class="payment-section mb-4">
                    <h6>Payment Method</h6>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="paymentMethod" value="card" id="paymentCard" checked>
                        <label class="form-check-label" for="paymentCard">Credit/Debit Card</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="paymentMethod" value="upi" id="paymentUPI">
                        <label class="form-check-label" for="paymentUPI">UPI</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="paymentMethod" value="netbanking" id="paymentNetbanking">
                        <label class="form-check-label" for="paymentNetbanking">Net Banking</label>
                    </div>
                </div>

                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Proceed to Pay ₹${totalFare}</button>
                </div>
            </form>
        `;
    }

    createPassengerForm(index) {
        return `
            <div class="passenger-form mb-3">
                <h6>Passenger ${index}</h6>
                <div class="row">
                    <div class="col-md-4">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-control" name="passenger${index}Name" required>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Age *</label>
                        <input type="number" class="form-control" name="passenger${index}Age" min="1" max="120" required>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Gender *</label>
                        <select class="form-select" name="passenger${index}Gender" required>
                            <option value="">Select</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="T">Transgender</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Berth Preference</label>
                        <select class="form-select" name="passenger${index}Berth">
                            <option value="LB">Lower Berth</option>
                            <option value="MB">Middle Berth</option>
                            <option value="UB">Upper Berth</option>
                            <option value="SL">Side Lower</option>
                            <option value="SU">Side Upper</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    async handleBooking(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const passengers = [];

        // Collect passenger data
        for (let i = 1; i <= this.passengerCount; i++) {
            passengers.push({
                name: formData.get(`passenger${i}Name`),
                age: parseInt(formData.get(`passenger${i}Age`)),
                gender: formData.get(`passenger${i}Gender`),
                berthPreference: formData.get(`passenger${i}Berth`)
            });
        }

        const bookingData = {
            trainId: this.selectedTrain.id,
            journeyDate: this.selectedTrain.journeyDate,
            travelClass: this.selectedClass,
            passengers: passengers,
            contactDetails: {
                email: formData.get('email'),
                phone: formData.get('phone')
            },
            totalFare: this.selectedTrain.classes[this.selectedClass].fare * this.passengerCount,
            paymentMethod: formData.get('paymentMethod')
        };

        try {
            this.showLoading(true);
            const response = await api.createBooking(bookingData);
            
            if (response.success) {
                this.showBookingSuccess(response.pnr);
            } else {
                this.showMessage(response.message || 'Booking failed', 'error');
            }
        } catch (error) {
            this.showMessage('Booking failed. Please try again.', 'error');
            console.error('Booking error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    showBookingSuccess(pnr) {
        const modal = document.getElementById('bookingModal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="text-center">
                <div class="success-icon mb-3">
                    <i data-feather="check-circle" style="width: 64px; height: 64px; color: #28a745;"></i>
                </div>
                <h4 class="text-success">Booking Confirmed!</h4>
                <p class="lead">Your PNR: <strong>${pnr}</strong></p>
                <p>Your ticket has been booked successfully. You will receive a confirmation email shortly.</p>
                <div class="mt-4">
                    <button class="btn btn-primary me-2" onclick="app.checkPNRStatus('${pnr}')">View Ticket</button>
                    <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        `;
        
        feather.replace();
    }

    async handlePNRCheck(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const pnr = formData.get('pnrNumber');

        if (!pnr || pnr.length !== 10) {
            this.showMessage('Please enter a valid 10-digit PNR number', 'error');
            return;
        }

        await this.checkPNRStatus(pnr);
    }

    async checkPNRStatus(pnr) {
        try {
            this.showLoading(true);
            const response = await api.getPNRStatus(pnr);
            
            if (response.success) {
                this.displayPNRStatus(response.data);
            } else {
                this.showMessage(response.message || 'PNR not found', 'error');
            }
        } catch (error) {
            this.showMessage('PNR check failed. Please try again.', 'error');
            console.error('PNR check error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    displayPNRStatus(booking) {
        const resultsContainer = document.getElementById('pnrResults') || document.getElementById('searchResults');
        if (!resultsContainer) return;

        const passengersHTML = booking.passengers.map((passenger, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${passenger.name}</td>
                <td>${passenger.age}</td>
                <td>${passenger.gender}</td>
                <td><span class="badge bg-success">${passenger.booking_status || passenger.current_status}</span></td>
            </tr>
        `).join('');

        const statusHTML = `
            <div class="pnr-status-container">
                <div class="pnr-header">
                    <h3>PNR Status: ${booking.pnrNumber}</h3>
                    <span class="badge bg-success">${booking.bookingStatus}</span>
                </div>
                
                <div class="pnr-details row">
                    <div class="col-md-6">
                        <h5>Journey Details</h5>
                        <p><strong>Train:</strong> ${booking.trainNumber} - ${booking.trainName}</p>
                        <p><strong>Route:</strong> ${booking.fromStation} → ${booking.toStation}</p>
                        <p><strong>Date:</strong> ${new Date(booking.journeyDate).toLocaleDateString('en-IN')}</p>
                        <p><strong>Time:</strong> ${booking.departureTime} - ${booking.arrivalTime}</p>
                        <p><strong>Class:</strong> ${this.getClassFullName(booking.travelClass)}</p>
                    </div>
                    <div class="col-md-6">
                        <h5>Booking Details</h5>
                        <p><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString('en-IN')}</p>
                        <p><strong>Total Fare:</strong> ₹${booking.totalFare}</p>
                        <p><strong>Chart Status:</strong> ${booking.chartStatus}</p>
                        ${booking.canCancel ? `
                            <button class="btn btn-danger btn-sm" onclick="app.showCancelModal('${booking.pnrNumber}')">
                                Cancel Ticket
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="passengers-section mt-4">
                    <h5>Passenger Details</h5>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${passengersHTML}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = statusHTML;
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    showCancelModal(pnr) {
        const modalHTML = `
            <div class="modal fade" id="cancelModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Cancel Booking</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="cancelForm" onsubmit="app.handleCancellation(event, '${pnr}')">
                                <div class="mb-3">
                                    <label class="form-label">Email Address *</label>
                                    <input type="email" class="form-control" name="email" required>
                                    <div class="form-text">Enter the email address used during booking</div>
                                </div>
                                <div class="alert alert-warning">
                                    <strong>Cancellation Policy:</strong>
                                    <ul class="mb-0 mt-2">
                                        <li>More than 48 hours: 90% refund</li>
                                        <li>24-48 hours: 50% refund</li>
                                        <li>Less than 24 hours: No refund</li>
                                    </ul>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button type="submit" class="btn btn-danger">Cancel Booking</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('cancelModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('cancelModal'));
        modal.show();
    }

    async handleCancellation(event, pnr) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email');

        try {
            this.showLoading(true);
            const response = await api.cancelBooking(pnr, email);
            
            if (response.success) {
                this.showMessage(response.message, 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('cancelModal'));
                modal.hide();
                
                // Refresh PNR status
                setTimeout(() => this.checkPNRStatus(pnr), 1000);
            } else {
                this.showMessage(response.message || 'Cancellation failed', 'error');
            }
        } catch (error) {
            this.showMessage('Cancellation failed. Please try again.', 'error');
            console.error('Cancellation error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            this.showLoading(true);
            const response = await api.login(credentials);
            
            if (response.success) {
                this.currentUser = response.user;
                this.showMessage('Login successful!', 'success');
                this.updateUserInterface();
            } else {
                this.showMessage(response.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.showMessage('Login failed. Please try again.', 'error');
            console.error('Login error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const userData = {
            username: formData.get('username'),
            password: formData.get('password'),
            email: formData.get('email'),
            fullName: formData.get('fullName'),
            phone: formData.get('phone')
        };

        // Validate password confirmation
        if (userData.password !== formData.get('confirmPassword')) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        try {
            this.showLoading(true);
            const response = await api.register(userData);
            
            if (response.success) {
                this.showMessage('Registration successful! Please login.', 'success');
                // Switch to login tab or redirect
            } else {
                this.showMessage(response.message || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showMessage('Registration failed. Please try again.', 'error');
            console.error('Registration error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    updateUserInterface() {
        // Update navbar or user interface based on login status
        const userSection = document.getElementById('userSection');
        if (userSection && this.currentUser) {
            userSection.innerHTML = `
                <span class="navbar-text me-3">Welcome, ${this.currentUser.fullName}</span>
                <button class="btn btn-outline-light btn-sm" onclick="app.logout()">Logout</button>
            `;
        }
    }

    logout() {
        this.currentUser = null;
        this.updateUserInterface();
        this.showMessage('Logged out successfully', 'info');
    }

    getClassFullName(classCode) {
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

    showLoading(show) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
        
        // Disable/enable forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, button, select');
            inputs.forEach(input => input.disabled = show);
        });
    }

    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChukChukGOApp();
});