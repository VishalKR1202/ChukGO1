/**
 * ChukChukGO - Form Validation
 * Handles form validation and error display
 */

/**
 * Validate a form's inputs
 * @param {HTMLFormElement} form - The form to validate
 * @return {boolean} - True if valid, false otherwise
 */
function validateForm(form) {
    // Check if the form exists
    if (!form) return false;
    
    // Get all form inputs that require validation
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    // Reset previous validation errors
    clearValidationErrors(form);
    
    // Check each input
    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    // Check for password confirmation match if applicable
    const password = form.querySelector('#registerPassword');
    const confirmPassword = form.querySelector('#confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
        showInputError(confirmPassword, 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Validate a single input field
 * @param {HTMLElement} input - The input element to validate
 * @return {boolean} - True if valid, false otherwise
 */
function validateInput(input) {
    // Skip disabled inputs
    if (input.disabled) return true;
    
    let isValid = true;
    const value = input.value.trim();
    
    // Check for empty required fields
    if (input.hasAttribute('required') && value === '') {
        showInputError(input, 'This field is required');
        return false;
    }
    
    // Validate by input type
    switch (input.type) {
        case 'email':
            isValid = validateEmail(input);
            break;
        case 'tel':
            isValid = validatePhone(input);
            break;
        case 'password':
            isValid = validatePassword(input);
            break;
        case 'number':
            isValid = validateNumber(input);
            break;
        case 'date':
            isValid = validateDate(input);
            break;
    }
    
    // Check pattern attribute if present
    if (isValid && input.hasAttribute('pattern')) {
        isValid = validatePattern(input);
    }
    
    // Add valid state if all checks passed
    if (isValid) {
        input.classList.add('is-valid');
    }
    
    return isValid;
}

/**
 * Validate email format
 * @param {HTMLElement} input - The email input
 * @return {boolean} - True if valid, false otherwise
 */
function validateEmail(input) {
    const value = input.value.trim();
    if (value === '') return true; // Empty non-required fields are valid
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(value)) {
        showInputError(input, 'Please enter a valid email address');
        return false;
    }
    
    return true;
}

/**
 * Validate phone number format
 * @param {HTMLElement} input - The phone input
 * @return {boolean} - True if valid, false otherwise
 */
function validatePhone(input) {
    const value = input.value.trim();
    if (value === '') return true; // Empty non-required fields are valid
    
    // Basic validation for Indian phone numbers
    const phoneRegex = /^[6-9]\d{9}$/;
    
    if (!phoneRegex.test(value)) {
        showInputError(input, 'Please enter a valid 10-digit mobile number');
        return false;
    }
    
    return true;
}

/**
 * Validate password strength
 * @param {HTMLElement} input - The password input
 * @return {boolean} - True if valid, false otherwise
 */
function validatePassword(input) {
    const value = input.value;
    if (value === '') return true; // Empty non-required fields are valid
    
    // Only apply strict validation to registration form
    if (input.id === 'registerPassword') {
        // Password must be at least 8 characters
        if (value.length < 8) {
            showInputError(input, 'Password must be at least 8 characters long');
            return false;
        }
        
        // Password should have at least one number and one letter
        const hasLetter = /[a-zA-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        
        if (!hasLetter || !hasNumber) {
            showInputError(input, 'Password must contain both letters and numbers');
            return false;
        }
    }
    
    return true;
}

/**
 * Validate number inputs (age, etc.)
 * @param {HTMLElement} input - The number input
 * @return {boolean} - True if valid, false otherwise
 */
function validateNumber(input) {
    const value = input.value.trim();
    if (value === '') return true; // Empty non-required fields are valid
    
    const numValue = Number(value);
    
    // Check for min/max attributes
    if (input.hasAttribute('min') && numValue < Number(input.getAttribute('min'))) {
        showInputError(input, `Value must be at least ${input.getAttribute('min')}`);
        return false;
    }
    
    if (input.hasAttribute('max') && numValue > Number(input.getAttribute('max'))) {
        showInputError(input, `Value must be at most ${input.getAttribute('max')}`);
        return false;
    }
    
    return true;
}

/**
 * Validate date inputs
 * @param {HTMLElement} input - The date input
 * @return {boolean} - True if valid, false otherwise
 */
function validateDate(input) {
    const value = input.value;
    if (value === '') return true; // Empty non-required fields are valid
    
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for comparison
    
    // Validate min date - usually today or future dates for booking
    if (input.hasAttribute('min')) {
        const minDate = new Date(input.getAttribute('min'));
        if (selectedDate < minDate) {
            showInputError(input, 'Please select a future date');
            return false;
        }
    }
    
    // For journey date, make sure it's not in the past
    if (input.id === 'journeyDate' && selectedDate < today) {
        showInputError(input, 'Journey date cannot be in the past');
        return false;
    }
    
    return true;
}

/**
 * Validate input against pattern attribute
 * @param {HTMLElement} input - The input with pattern attribute
 * @return {boolean} - True if valid, false otherwise
 */
function validatePattern(input) {
    const value = input.value.trim();
    if (value === '') return true; // Empty non-required fields are valid
    
    const pattern = new RegExp(input.getAttribute('pattern'));
    
    if (!pattern.test(value)) {
        let errorMessage = 'Please enter a valid format';
        
        // Specific messages for common patterns
        if (input.id === 'pnrNumber' || input.id === 'pnrCancel') {
            errorMessage = 'Please enter a valid 10-digit PNR number';
        } else if (input.id === 'phoneNumber' || input.id === 'contactPhone') {
            errorMessage = 'Please enter a valid 10-digit mobile number';
        }
        
        showInputError(input, errorMessage);
        return false;
    }
    
    return true;
}

/**
 * Display error message for an input
 * @param {HTMLElement} input - The input with error
 * @param {string} message - The error message to display
 */
function showInputError(input, message) {
    input.classList.add('is-invalid');
    
    // Check if error feedback already exists
    let feedback = input.nextElementSibling;
    if (!feedback || !feedback.classList.contains('invalid-feedback')) {
        feedback = document.createElement('div');
        feedback.classList.add('invalid-feedback');
        input.parentNode.insertBefore(feedback, input.nextSibling);
    }
    
    feedback.textContent = message;
}

/**
 * Clear validation errors from a form
 * @param {HTMLFormElement} form - The form to clear errors from
 */
function clearValidationErrors(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
        
        // Remove error messages
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = '';
        }
    });
}

/**
 * Real-time validation for inputs
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add blur event listener to all forms for real-time validation
    document.querySelectorAll('form').forEach(form => {
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('blur', function() {
                validateInput(this);
            });
            
            // Clear validation on input
            input.addEventListener('input', function() {
                this.classList.remove('is-invalid', 'is-valid');
                
                const feedback = this.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.textContent = '';
                }
            });
        });
    });
    
    // Add special validation for passenger forms that might be dynamically created
    document.body.addEventListener('blur', function(e) {
        const target = e.target;
        
        // Check if the blurred element is an input in a passenger form
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
            const passengerForm = target.closest('.passenger-form');
            if (passengerForm) {
                validateInput(target);
            }
        }
    }, true);
    
    // Special handling for password confirmation
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('blur', function() {
            const password = document.getElementById('registerPassword');
            if (password.value !== this.value) {
                showInputError(this, 'Passwords do not match');
            }
        });
    }
});
