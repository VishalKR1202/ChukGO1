/**
 * API Client for ChukChukGO
 * Handles all API communications with the Python backend
 */

class APIClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.apiURL = `${this.baseURL}/api`;
    }

    async request(endpoint, options = {}) {
        const url = `${this.apiURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    // Train search
    async searchTrains(searchParams) {
        const params = new URLSearchParams(searchParams);
        return this.request(`/trains/search?${params}`);
    }

    // Stations
    async getStations(search = '') {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        return this.request(`/stations${params}`);
    }

    // Bookings
    async createBooking(bookingData) {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    async getPNRStatus(pnr) {
        return this.request(`/pnr/${pnr}`);
    }

    async cancelBooking(pnr, email) {
        return this.request(`/bookings/${pnr}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }
}

// Create global API client instance
window.api = new APIClient();