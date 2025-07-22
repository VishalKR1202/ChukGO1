/**
 * ChukChukGO - Payment Processing
 * Handles payment UI, validation, and submission
 */

// Initialize payment handlers when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Card payment form
    const cardPaymentForm = document.getElementById('cardPaymentForm');
    if (cardPaymentForm) {
        cardPaymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processCardPayment();
        });
        
        // Format card number with spaces
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s/g, '');
                if (value.length > 0) {
                    value = value.match(new RegExp('.{1,4}', 'g')).join(' ');
                }
                e.target.value = value;
            });
        }
        
        // Format expiry date with slash
        const expiryDate = document.getElementById('expiryDate');
        if (expiryDate) {
            expiryDate.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\//g, '');
                if (value.length > 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }
    }
    
    // UPI payment form
    const upiForm = document.getElementById('upiForm');
    if (upiForm) {
        upiForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processUPIPayment();
        });
    }
    
    // Netbanking form
    const netbankingForm = document.getElementById('netbankingForm');
    if (netbankingForm) {
        netbankingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processNetbankingPayment();
        });
    }
    
    // Wallet form
    const walletForm = document.getElementById('walletForm');
    if (walletForm) {
        walletForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processWalletPayment();
        });
    }
});

/**
 * Process credit/debit card payment
 */
function processCardPayment() {
    const cardNumber = document.getElementById('cardNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardName = document.getElementById('cardName').value;
    
    // Validate card details
    if (!validateCardDetails(cardNumber, expiryDate, cvv, cardName)) {
        return;
    }
    
    // Show processing state
    const submitBtn = document.querySelector('#cardPaymentForm button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    // In a real application, this would make an API call to a payment gateway
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        
        // Submit the booking with payment method
        submitBooking('card');
    }, 2000);
}

/**
 * Process UPI payment
 */
function processUPIPayment() {
    const upiId = document.getElementById('upiId').value;
    
    // Validate UPI ID
    if (!validateUPIId(upiId)) {
        return;
    }
    
    // Show processing state
    const submitBtn = document.querySelector('#upiForm button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    // In a real application, this would initiate a UPI payment request
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        
        // Submit the booking with payment method
        submitBooking('upi');
    }, 2000);
}

/**
 * Process netbanking payment
 */
function processNetbankingPayment() {
    const bankSelect = document.getElementById('bankSelect').value;
    
    if (!bankSelect) {
        showMessage('Please select a bank', 'error');
        return;
    }
    
    // Show processing state
    const submitBtn = document.querySelector('#netbankingForm button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Redirecting...';
    
    // In a real application, this would redirect to the bank's payment page
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        
        // For demonstration, we'll skip the bank page and proceed
        submitBooking('netbanking');
    }, 2000);
}

/**
 * Process wallet payment
 */
function processWalletPayment() {
    const selectedWallet = document.querySelector('input[name="wallet"]:checked');
    
    if (!selectedWallet) {
        showMessage('Please select a wallet', 'error');
        return;
    }
    
    // Show processing state
    const submitBtn = document.querySelector('#walletForm button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    // In a real application, this would initiate a wallet payment
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        
        // Submit the booking with payment method
        submitBooking('wallet_' + selectedWallet.value);
    }, 2000);
}

/**
 * Validate credit/debit card details
 */
function validateCardDetails(cardNumber, expiryDate, cvv, cardName) {
    // Remove spaces from card number
    const cardClean = cardNumber.replace(/\s/g, '');
    
    // Check card number (simple Luhn algorithm for demo)
    if (!cardClean || cardClean.length < 13 || cardClean.length > 19 || !luhnCheck(cardClean)) {
        showMessage('Please enter a valid card number', 'error');
        return false;
    }
    
    // Check expiry date format (MM/YY)
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
        showMessage('Please enter expiry date in MM/YY format', 'error');
        return false;
    }
    
    // Check if card is expired
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    const expiryParts = expiryDate.split('/');
    const expiryMonth = parseInt(expiryParts[0], 10);
    const expiryYear = parseInt(expiryParts[1], 10);
    
    if (
        expiryMonth < 1 || 
        expiryMonth > 12 || 
        (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth))
    ) {
        showMessage('Card has expired or invalid expiry date', 'error');
        return false;
    }
    
    // Check CVV
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
        showMessage('Please enter a valid CVV', 'error');
        return false;
    }
    
    // Check cardholder name
    if (!cardName || cardName.length < 3) {
        showMessage('Please enter the cardholder name', 'error');
        return false;
    }
    
    return true;
}

/**
 * Validate UPI ID format
 */
function validateUPIId(upiId) {
    if (!upiId || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId)) {
        showMessage('Please enter a valid UPI ID (e.g., name@upi)', 'error');
        return false;
    }
    
    return true;
}

/**
 * Luhn algorithm for card number validation
 */
function luhnCheck(cardNumber) {
    let sum = 0;
    let doubleUp = false;
    
    // Process from right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10);
        
        // Double every second digit
        if (doubleUp) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        doubleUp = !doubleUp;
    }
    
    // If the sum is a multiple of 10, the number is valid
    return (sum % 10) === 0;
}

/**
 * Handle payment method selection in modal
 */
function handlePaymentMethodSelection() {
    // For clarity in the payment modal, we could highlight the selected payment method
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            // Remove selection from all methods
            document.querySelectorAll('.payment-method').forEach(m => {
                m.classList.remove('payment-method-selected');
                
                // Hide any open details
                const details = m.querySelector('.payment-method-details');
                if (details) {
                    details.classList.remove('show');
                }
            });
            
            // Add selection to clicked method
            this.classList.add('payment-method-selected');
            
            // Show details for selected method
            const details = this.querySelector('.payment-method-details');
            if (details) {
                details.classList.add('show');
            }
        });
    });
}

/**
 * Show payment processing error
 */
function showPaymentError(message) {
    const paymentErrors = document.createElement('div');
    paymentErrors.className = 'alert alert-danger mt-3';
    paymentErrors.innerHTML = `
        <i data-feather="alert-triangle" class="me-2"></i>
        ${message}
    `;
    
    // Find the active tab content
    const activeTab = document.querySelector('#payment-content .tab-pane.active');
    if (activeTab) {
        // Remove any existing errors
        const existingError = activeTab.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }
        
        // Add the new error
        activeTab.appendChild(paymentErrors);
        
        // Initialize the icon
        feather.replace();
    } else {
        // Fallback to toast message
        showMessage(message, 'error');
    }
}

/**
 * Create a fake payment intent (simulating payment gateway API response)
 */
function createPaymentIntent(amount, currency = 'INR') {
    // In a real application, this would be a server call
    return {
        id: 'pi_' + Math.random().toString(36).substr(2, 9),
        amount: amount,
        currency: currency,
        status: 'requires_confirmation'
    };
}

/**
 * Confirm payment intent (simulating payment gateway API call)
 */
function confirmPaymentIntent(paymentIntentId, paymentMethod) {
    // In a real application, this would be a server call
    return new Promise((resolve, reject) => {
        // Simulate API call delay
        setTimeout(() => {
            // Randomly succeed or fail for demonstration
            if (Math.random() > 0.1) { // 90% success rate
                resolve({
                    id: paymentIntentId,
                    status: 'succeeded',
                    payment_method: paymentMethod
                });
            } else {
                reject({
                    error: {
                        code: 'card_declined',
                        message: 'Your card was declined. Please try a different payment method.'
                    }
                });
            }
        }, 1500);
    });
}
