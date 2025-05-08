// formValidation.js
// This module contains the logic for validating the booking form.

// Import error handling functions needed for displaying validation errors.
import { showError, clearAllErrors } from './errorHandling.js';

/**
 * Validates the form based on the currently active tab and the inputs within that tab.
 * Displays user-friendly error messages next to invalid fields and logs validation failures.
 *
 * @param {object} elements - Object containing references to DOM elements (from getElementRefs).
 * @returns {boolean} - true if the form is valid, false otherwise.
 */
export function validateForm(elements) {
    let isValid = true; // Assume the form is valid initially
    // Get the active tab button and determine the ID of the active panel.
    const activeTabButton = elements.tabNavigationContainer?.querySelector('.active-tab');
    const activePanelId = activeTabButton ? activeTabButton.getAttribute('data-tab-target') : null;

    // Clear all previous errors before performing new validation.
    clearAllErrors(elements);

    // --- Validation logic for fields that are always visible regardless of the tab ---
    // Validate the 'From' location input field.
    if (!elements.fromLocationInput?.value.trim()) {
        // If the field is empty, display an error message using the imported showError function.
        showError(elements, 'from-location', 'Please enter a "From" location.');
        console.warn("Validation Failed: 'From' location is empty."); // Log the validation failure for debugging.
        isValid = false; // Set the overall form validity to false.
    }

    // --- Validation logic specific to the One-Way tab ---
    if (activePanelId === '#panel-oneway') {
        // Validate the 'To' address input field for the One-Way service.
        if (!elements.toAddressInput?.value.trim()) {
            showError(elements, 'to-address', 'Please enter a "To" address.');
            console.warn("Validation Failed: 'To' address is empty for One Way.");
            isValid = false;
        }

        // Validate that a Time Preference ('Request now' or 'Book for later') has been selected.
        const bookingPref = elements.bookingPreferenceInput?.value;
        if (!bookingPref) {
            showError(elements, 'booking-time', 'Please select "Request now" or "Book for later".'); // Error displayed below the buttons.
            console.warn("Validation Failed: Booking time preference not selected for One Way.");
            isValid = false;
        } else if (bookingPref === 'Scheduled') {
            // If 'Book for later' is selected, validate the specific Date and Time input fields.
            if (!elements.oneWayPickupDateInput?.value) {
                showError(elements, 'pickup-date-oneway', 'Please select a date.');
                console.warn("Validation Failed: One-Way pickup date is empty.");
                isValid = false;
            }
            if (!elements.oneWayPickupTimeInput?.value) {
                showError(elements, 'pickup-time-oneway', 'Please select a time.');
                console.warn("Validation Failed: One-Way pickup time is empty.");
                isValid = false;
            }
        } // If bookingPref is 'ASAP', no date/time validation is needed here.

        // Validate that a Vehicle Type has been selected for the One-Way service.
        const vehicleSelectedOneway = document.querySelector('input[name="vehicle_type_oneway"]:checked');
        if (!vehicleSelectedOneway) {
            showError(elements, 'vehicle_type_oneway', 'Please select a vehicle type.'); // Error displayed near the vehicle cards fieldset.
            console.warn("Validation Failed: No vehicle type selected for One Way.");
            isValid = false;
        }

    } else if (activePanelId === '#panel-experience-plus') {
        // --- Validation logic specific to the Experience+ tab ---
        const selectedService = elements.serviceDropdown.value; // Get the selected service value.
        if (!selectedService) {
            showError(elements, 'experience-dropdown', 'Please select a Service.'); // Error for the service dropdown.
            console.warn("Validation Failed: No service selected in Experience+ dropdown.");
            isValid = false;
        } else if (selectedService === 'hourly_chauffeur') {
            // Validation for the Hourly Chauffeur service.
            if (!elements.durationSelect?.value) {
                showError(elements, 'duration-hourly', 'Please select duration.');
                console.warn("Validation Failed: Hourly duration not selected.");
                isValid = false;
            }
            if (!elements.hourlyPickupDateInput?.value) {
                showError(elements, 'pickup-date-hourly', 'Please select a date.');
                console.warn("Validation Failed: Hourly pickup date is empty.");
                isValid = false;
            }
            if (!elements.hourlyPickupTimeInput?.value) {
                showError(elements, 'pickup-time-hourly', 'Please select a start time.');
                console.warn("Validation Failed: Hourly pickup time is empty.");
                isValid = false;
            }
        } else { // Validation for Curated Experiences (any selected service that is not Hourly)
            // Validate common contact and guest fields for curated experiences.
            if (!elements.experienceNameInput?.value.trim()) {
                showError(elements, 'experience-name', 'Name required.');
                console.warn("Validation Failed: Experience name is empty.");
                isValid = false;
            }
            if (!elements.experienceGuestsInput?.value || parseInt(elements.experienceGuestsInput.value, 10) < 1) {
                showError(elements, 'experience-guests', 'Min 1 guest.');
                console.warn("Validation Failed: Invalid number of guests.");
                isValid = false;
            }
            if (!elements.experienceEmailInput?.value.trim()) {
                showError(elements, 'experience-email', 'Email required.');
                console.warn("Validation Failed: Experience email is empty.");
                isValid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elements.experienceEmailInput.value.trim())) {
               // Basic email format validation.
                showError(elements, 'experience-email', 'Invalid email format.');
                console.warn("Validation Failed: Invalid email format for experience.");
                isValid = false;
            }
            if (!elements.experiencePhoneInput?.value.trim()) {
                 showError(elements, 'experience-phone', 'Phone required.');
                 console.warn("Validation Failed: Experience phone is empty.");
                 isValid = false;
             } else if (!/^\+?[\d\s()-]{10,20}$/.test(elements.experiencePhoneInput.value) || !/[\d]{10}/.test(elements.experiencePhoneInput.value.replace(/\D/g, ''))) {
               // Basic phone format check: allows +, digits, spaces, (), - and requires at least 10 digits after removing non-digits.
                showError(elements, 'experience-phone', 'Invalid phone format (minimum 10 digits).');
                console.warn("Validation Failed: Invalid phone format for experience.");
                isValid = false;
             }
             const datePrefSelected = document.querySelector('input[name="date_preference"]:checked');
             if (!datePrefSelected) {
                showError(elements, 'date_preference', 'Please select timing preference.');
                console.warn("Validation Failed: Date preference not selected for curated experience.");
                isValid = false;
             }

            // --- Specific validation for Wynwood Night experience if selected ---
            if (selectedService === 'wynwood_night') {
                const motivationSelected = document.querySelector('#wynwood-night-options input[name="motivation"]:checked');
                const dinnerPrefSelected = document.querySelector('#wynwood-night-options input[name="dinner_style_preference"]:checked');
                const loungeSelected = document.querySelector('#wynwood-night-options input[name="lounge_interest"]:checked');

                if (!motivationSelected) {
                    showError(elements, 'motivation', 'Occasion required.');
                    console.warn("Validation Failed: Wynwood occasion not selected.");
                    isValid = false;
                }
                if (!dinnerPrefSelected) {
                    showError(elements, 'dinner_style_preference', 'Dinner preference required.');
                    console.warn("Validation Failed: Wynwood dinner preference not selected.");
                    isValid = false;
                }
                // If the 'Other' dinner preference is selected, validate the 'Other Restaurant' text input.
                if (elements.wynwoodOtherDinnerRadio?.checked) {
                    const otherRestaurantInput = document.getElementById('wynwood-other-restaurant');
                    if (!otherRestaurantInput?.value.trim()) {
                        showError(elements, 'wynwood-other-restaurant', 'Please specify other preference.');
                        console.warn("Validation Failed: Wynwood 'Other' restaurant preference is empty.");
                        isValid = false;
                    }
                }
                if (!loungeSelected) {
                    showError(elements, 'lounge_interest', 'Lounge interest required.');
                    console.warn("Validation Failed: Wynwood lounge interest not selected.");
                    isValid = false;
                }
            }
            // Add validation for other experiences here if their options are added to the HTML and JS
        }
    } else {
          // This case should ideally not be reached if tab switching logic is correct.
          // Log an error if no active tab panel is identified to help diagnose UI issues.
          isValid = false;
          console.error("Validation Error: No active tab panel identified for validation.");
        }

    // Log a general message indicating the overall validation outcome.
    if (!isValid) {
        console.warn("Form validation failed. Errors have been displayed to the user.");
    } else {
        console.log("Form validation passed. Ready to submit.");
    }

    return isValid; // Return the final validation result (true or false).
}
