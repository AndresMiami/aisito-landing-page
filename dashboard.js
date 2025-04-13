// dashboard.js

// Global variables to store the map and directions service (for future map integration)
let map;
let directionsService;
let directionsRenderer;

// This function is called by the Google Maps script tag (callback=initAutocomplete)
function initAutocomplete() {
    console.log("Google Maps API loaded, initializing Autocomplete, Tabs, and Map.");

    // --- Get references to your address input fields ---
    const fromOneWayInput = document.getElementById('from-oneway');
    const toOneWayInput = document.getElementById('to-oneway');
    const fromHourlyInput = document.getElementById('from-hourly');

    // --- Options for Autocomplete ---
    const options = {
        componentRestrictions: { country: "us" },
        fields: ["address_components", "geometry", "name", "formatted_address", "types"],
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(25.5, -80.5), // SW Miami area
            new google.maps.LatLng(26.1, -80.0)  // NE Fort Lauderdale area
        ),
        strictBounds: false,
    };

    // --- Helper Function to Show/Hide Airport Fields ---
    // (This function remains the same as the previous version)
    function updateAirportFieldVisibility(addressInputId, isAirport) {
        let typeContainerId, notesContainerId, hiddenInputId;
        let typeInput, notesInput; // To potentially reset values

        console.log(`Updating airport fields for ${addressInputId}. Is Airport: ${isAirport}`);

        if (addressInputId === 'from-oneway' || addressInputId === 'from-hourly') {
            typeContainerId = 'pickup-type-container';
            notesContainerId = 'pickup-notes-container';
            hiddenInputId = addressInputId === 'from-oneway' ? 'isPickupAirportOneWay' : 'isPickupAirportHourly';
            typeInput = document.getElementById('pickup-type');
            notesInput = document.getElementById('pickup-notes');
        } else if (addressInputId === 'to-oneway') {
            typeContainerId = 'dropoff-type-container';
            notesContainerId = 'dropoff-notes-container';
            hiddenInputId = 'isDropoffAirportOneWay';
            typeInput = document.getElementById('dropoff-type');
            notesInput = document.getElementById('dropoff-notes');
        } else {
            console.warn(`Unknown address input ID in updateAirportFieldVisibility: ${addressInputId}`);
            return;
        }

        const typeContainer = document.getElementById(typeContainerId);
        const notesContainer = document.getElementById(notesContainerId);
        const hiddenInput = document.getElementById(hiddenInputId);

        if (!typeContainer || !notesContainer || !hiddenInput) {
            console.error(`Could not find all elements for ${addressInputId}:`, typeContainerId, notesContainerId, hiddenInputId);
            return;
        }

        if (isAirport) {
            typeContainer.classList.remove('hidden');
            notesContainer.classList.remove('hidden');
            hiddenInput.value = 'true';
        } else {
            typeContainer.classList.add('hidden');
            notesContainer.classList.add('hidden');
            hiddenInput.value = 'false';
            // Optional: Reset fields when hidden
            if (typeInput) typeInput.selectedIndex = 0; // Reset dropdown to first option (e.g., "Select Type")
            if (notesInput) notesInput.value = '';
        }
    }

    // --- Create Autocomplete objects ---
    // (Error checks added for robustness)
    if (fromOneWayInput) {
        try {
            const autocompleteFromOneWay = new google.maps.places.Autocomplete(fromOneWayInput, options);
            autocompleteFromOneWay.addListener('place_changed', () => {
                const place = autocompleteFromOneWay.getPlace();
                console.log("Place Changed (From One Way):", place);
                const isAirport = place?.types?.includes('airport') || false;
                updateAirportFieldVisibility('from-oneway', isAirport);
            });
        } catch (e) {
            console.error("Error initializing Autocomplete for from-oneway:", e);
        }
    } else {
        console.error("Input 'from-oneway' not found");
    }

    if (toOneWayInput) {
        try {
            const autocompleteToOneWay = new google.maps.places.Autocomplete(toOneWayInput, options);
            autocompleteToOneWay.addListener('place_changed', () => {
                const place = autocompleteToOneWay.getPlace();
                console.log("Place Changed (To One Way):", place);
                const isAirport = place?.types?.includes('airport') || false;
                updateAirportFieldVisibility('to-oneway', isAirport);
            });
        } catch (e) {
            console.error("Error initializing Autocomplete for to-oneway:", e);
        }
    } else {
        console.error("Input 'to-oneway' not found");
    }

    if (fromHourlyInput) {
        try {
            const autocompleteFromHourly = new google.maps.places.Autocomplete(fromHourlyInput, options);
            autocompleteFromHourly.addListener('place_changed', () => {
                const place = autocompleteFromHourly.getPlace();
                console.log("Place Changed (From Hourly):", place);
                const isAirport = place?.types?.includes('airport') || false;
                updateAirportFieldVisibility('from-hourly', isAirport);
            });
        } catch (e) {
            console.error("Error initializing Autocomplete for from-hourly:", e);
        }
    } else {
        console.error("Input 'from-hourly' not found");
    }

    // --- Setup Form Listeners ---
    setupFormListeners(); // Call the function that now includes the Clear button listener

    // --- Initialize the tab switching functionality ---
    initializeTabSwitching(); // Call the function that now hides results on tab switch
}

// --- Function to get current location using Geolocation API ---
// (This function remains the same as the previous version)
function getCurrentLocation(inputId) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log(`Geolocation retrieved: Lat ${latitude}, Lng ${longitude}`);

                // Use Google Maps Geocoder to convert coordinates to address
                const geocoder = new google.maps.Geocoder();
                const latlng = { lat: latitude, lng: longitude };

                try {
                    const response = await new Promise((resolve, reject) => {
                        geocoder.geocode({ location: latlng }, (results, status) => {
                            if (status === 'OK' && results[0]) {
                                resolve(results);
                            } else {
                                reject(new Error('Geocoding failed: ' + status));
                            }
                        });
                    });

                    const address = response[0].formatted_address;
                    console.log(`Geocoded address: ${address}`);

                    // Update the specified input field
                    const inputField = document.getElementById(inputId);
                    if (inputField) {
                        inputField.value = address;
                        console.log(`Updated input '${inputId}' with address: ${address}`);
                        // Force hide airport fields when geocoding fills input
                        updateAirportFieldVisibility(inputId, false);
                    } else {
                        console.error(`Input field with ID '${inputId}' not found.`);
                    }
                } catch (error) {
                    console.error('Error geocoding location:', error);
                    alert('Unable to retrieve address for your location. Please try again.');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = 'Unable to retrieve your location.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access was denied. Please allow location permissions.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'The request to get your location timed out.';
                        break;
                }
                alert(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser.');
        alert('Geolocation is not supported by your browser.');
    }
}

// --- UPDATED: Setup form AND button listeners ---
function setupFormListeners() {
    const oneWayForm = document.getElementById('one-way-form');
    const hourlyForm = document.getElementById('by-the-hour-form');
    // --- Get location buttons ---
    const oneWayLocationBtn = document.getElementById('get-location-oneway-btn');
    const hourlyLocationBtn = document.getElementById('get-location-hourly-btn');
     // --- Get clear button ---
    const clearFormBtn = document.getElementById('clear-form-btn');


    // Form submit listeners (existing)
    if (oneWayForm) {
        oneWayForm.addEventListener('submit', handleOneWaySubmit);
        console.log("Submit listener added to one-way form.");
    } else {
        console.error("One-way form element not found.");
    }

    if (hourlyForm) {
        hourlyForm.addEventListener('submit', handleHourlySubmit);
        console.log("Submit listener added to hourly form.");
    } else {
        console.error("Hourly form element not found.");
    }

    // --- Add listeners for location buttons ---
    if (oneWayLocationBtn) {
        oneWayLocationBtn.addEventListener('click', () => {
            // Call getCurrentLocation, passing the ID of the input to update
            getCurrentLocation('from-oneway');
        });
        console.log("Location listener added to one-way button.");
    } else {
        console.warn("One-way location button not found.");
    }

    if (hourlyLocationBtn) {
        hourlyLocationBtn.addEventListener('click', () => {
            // Call getCurrentLocation, passing the ID of the input to update
            getCurrentLocation('from-hourly');
        });
        console.log("Location listener added to hourly button.");
    } else {
        console.warn("Hourly location button not found.");
    }

    // ---> ADDED: Listener for Clear Form button <---
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', () => {
            console.log('Clear Form button clicked');
            const resultsArea = document.getElementById('quote-results-area');
            const errorDisplay = document.getElementById('quote-error');
            // Find the active form (the one *not* hidden)
            const oneWayFormActive = !document.getElementById('one-way-form').classList.contains('hidden');
            const hourlyFormActive = !document.getElementById('by-the-hour-form').classList.contains('hidden');


            // Hide results and clear errors
            if (resultsArea) resultsArea.style.display = 'none'; // Hide results
            if (errorDisplay) errorDisplay.textContent = '';

            // Reset the active form
            if (oneWayFormActive) {
                document.getElementById('one-way-form').reset(); // Clear standard inputs
                // Manually reset hidden inputs and hide airport fields
                document.getElementById('isPickupAirportOneWay').value = 'false';
                document.getElementById('isDropoffAirportOneWay').value = 'false';
                // updateAirportFieldVisibility might not be defined here if moved outside initAutocomplete
                // Safest to call directly if needed or ensure it's globally available
                 if (typeof updateAirportFieldVisibility === 'function') {
                    updateAirportFieldVisibility('from-oneway', false);
                    updateAirportFieldVisibility('to-oneway', false);
                 } else { // Fallback if function not accessible (e.g., scope issue) - less ideal
                    document.getElementById('pickup-type-container')?.classList.add('hidden');
                    document.getElementById('pickup-notes-container')?.classList.add('hidden');
                    document.getElementById('dropoff-type-container')?.classList.add('hidden');
                    document.getElementById('dropoff-notes-container')?.classList.add('hidden');
                 }
                console.log('One-way form cleared.');
            } else if (hourlyFormActive) { // Use else if to be specific
                document.getElementById('by-the-hour-form').reset(); // Clear standard inputs
                 // Manually reset hidden inputs and hide airport fields
                document.getElementById('isPickupAirportHourly').value = 'false';
                 if (typeof updateAirportFieldVisibility === 'function') {
                    updateAirportFieldVisibility('from-hourly', false);
                 } else {
                    document.getElementById('pickup-type-container')?.classList.add('hidden');
                    document.getElementById('pickup-notes-container')?.classList.add('hidden');
                 }
                console.log('Hourly form cleared.');
            }
        });
        console.log("Clear form listener added.");
    } else {
        console.warn("Clear form button not found.");
    }
    // --- End of Add listener for Clear Form button ---
}

// --- Function to handle tab switching ---
function initializeTabSwitching() {
    const oneWayTab = document.getElementById('one-way-tab');
    const byTheHourTab = document.getElementById('by-the-hour-tab');
    const oneWayForm = document.getElementById('one-way-form');
    const byTheHourForm = document.getElementById('by-the-hour-form');

    // Get references to results/error area for clearing on tab switch
    const resultsArea = document.getElementById('quote-results-area');
    const errorDisplay = document.getElementById('quote-error');


    if (!oneWayTab || !byTheHourTab || !oneWayForm || !byTheHourForm) {
        console.error("One or more tab/form elements not found. Tab switching disabled.");
        return;
    }

    const tabs = [oneWayTab, byTheHourTab];
    const forms = [oneWayForm, byTheHourForm];

    tabs.forEach((tab) => {
        tab.addEventListener('click', (event) => {
            // ---> ADDED: Hide results and clear errors when tab is clicked <---
            console.log('Tab clicked, hiding results area.');
            if (resultsArea) resultsArea.style.display = 'none'; // Hide results
            if (errorDisplay) errorDisplay.textContent = '';     // Clear errors
            // ---> End of Added lines <---

            // Existing code follows:
            tabs.forEach((t) => t.classList.remove('active'));
            forms.forEach((f) => f.classList.add('hidden'));
            const clickedTab = event.currentTarget;
            clickedTab.classList.add('active');
            const targetFormId = clickedTab.getAttribute('data-target');
            const targetForm = document.getElementById(targetFormId);
            if (targetForm) {
                targetForm.classList.remove('hidden');
            } else {
                console.warn(`Target form with ID '${targetFormId}' not found.`);
            }
        });
    });

    // --- Ensure the default active tab's form is visible on initial load ---
    const initiallyActiveTab = document.querySelector('.tab-button.active');
    let activeFormFound = false;
    if (initiallyActiveTab) {
        const initialFormId = initiallyActiveTab.getAttribute('data-target');
        const initialForm = document.getElementById(initialFormId);
        if (initialForm) {
            forms.forEach((f) => f.classList.add('hidden'));
            initialForm.classList.remove('hidden');
            activeFormFound = true;
            console.log(`Initial active form: ${initialFormId}`);
        } else {
            console.warn(`Initial active tab found, but target form '${initialFormId}' not found.`);
        }
    } else {
        console.warn("No tab initially marked as active.");
    }
    if (!activeFormFound && oneWayForm) {
        console.log("Fallback: Displaying 'one-way-form'.");
        forms.forEach((f) => f.classList.add('hidden'));
        oneWayForm.classList.remove('hidden');
        if (oneWayTab) oneWayTab.classList.add('active');
    }
} // End of initializeTabSwitching function

// ==================================================
// == FORM SUBMISSION LOGIC (WITH UI UPDATES) ==
// ==================================================

// --- Handle One-Way Form Submission ---
// (This function remains the same as the previous version, uses classList if HTML was updated, otherwise style.display is fine)
async function handleOneWaySubmit(event) {
    event.preventDefault();
    console.log('Handling one-way form submission...');

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerText;
    submitButton.disabled = true;
    submitButton.innerText = 'Searching...';

    const resultsArea = document.getElementById('quote-results-area');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('quote-error');
    const quoteDetailsDisplay = document.getElementById('quote-details');

    if (resultsArea) resultsArea.style.display = 'block'; // Show area using style.display
    if (quoteDetailsDisplay) quoteDetailsDisplay.style.display = 'none'; // Hide details initially using style.display
    if (errorDisplay) errorDisplay.textContent = ''; // Clear errors
    if (loadingIndicator) loadingIndicator.style.display = 'block'; // Show loading using style.display

    // Gather form data (includes isPickupAirport/isDropoffAirport from hidden inputs)
    const formData = {
        type: 'one-way',
        pickupAddress: document.getElementById('from-oneway').value,
        dropoffAddress: document.getElementById('to-oneway').value,
        pickupDate: document.getElementById('date-oneway').value,
        pickupTime: document.getElementById('time-oneway').value,
        pickupType: document.getElementById('pickup-type').value || null,
        pickupNotes: document.getElementById('pickup-notes').value || null,
        dropoffType: document.getElementById('dropoff-type').value || null,
        dropoffNotes: document.getElementById('dropoff-notes').value || null,
        isPickupAirport: document.getElementById('isPickupAirportOneWay').value,
        isDropoffAirport: document.getElementById('isDropoffAirportOneWay').value,
    };

    // Basic validation
    if (!formData.pickupAddress || !formData.dropoffAddress || !formData.pickupDate || !formData.pickupTime) {
        if (errorDisplay) errorDisplay.textContent = 'Please fill in all required fields for the one-way booking.';
        if (loadingIndicator) loadingIndicator.style.display = 'none'; // Ensure loading hidden
        submitButton.disabled = false;
        submitButton.innerText = originalButtonText;
        return;
    }

    // Send data
    await submitBookingRequest(formData);

    // Restore button state
    submitButton.disabled = false;
    submitButton.innerText = originalButtonText;
}

// --- Handle Hourly Form Submission ---
// (This function remains the same as the previous version, uses classList if HTML was updated, otherwise style.display is fine)
async function handleHourlySubmit(event) {
    event.preventDefault();
    console.log('Handling hourly form submission...');

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerText;
    submitButton.disabled = true;
    submitButton.innerText = 'Searching...';

    const resultsArea = document.getElementById('quote-results-area');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('quote-error');
    const quoteDetailsDisplay = document.getElementById('quote-details');

    if (resultsArea) resultsArea.style.display = 'block'; // Show area using style.display
    if (quoteDetailsDisplay) quoteDetailsDisplay.style.display = 'none'; // Hide details initially using style.display
    if (errorDisplay) errorDisplay.textContent = ''; // Clear errors
    if (loadingIndicator) loadingIndicator.style.display = 'block'; // Show loading using style.display

    // Gather form data (includes isPickupAirport from hidden input)
    const formData = {
        type: 'hourly',
        pickupAddress: document.getElementById('from-hourly').value,
        durationHours: document.getElementById('duration-hourly').value,
        pickupDate: document.getElementById('date-hourly').value,
        pickupTime: document.getElementById('time-hourly').value,
        isPickupAirport: document.getElementById('isPickupAirportHourly').value,
    };

    // Basic validation
    if (!formData.pickupAddress || !formData.durationHours || !formData.pickupDate || !formData.pickupTime) {
        if (errorDisplay) errorDisplay.textContent = 'Please fill in all fields for the hourly booking.';
         if (loadingIndicator) loadingIndicator.style.display = 'none'; // Ensure loading hidden
        submitButton.disabled = false;
        submitButton.innerText = originalButtonText;
        return;
    }

    // Send data
    await submitBookingRequest(formData);

    // Restore button state
    submitButton.disabled = false;
    submitButton.innerText = originalButtonText;
}

// --- Reusable Fetch Function to Send Data & Update UI ---
// (This function remains the same, uses classList if HTML was updated, otherwise style.display is fine)
async function submitBookingRequest(data) {
    // Get references to the UI elements for results, loading, and errors
    const resultsArea = document.getElementById('quote-results-area');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('quote-error');
    const quoteDetailsDisplay = document.getElementById('quote-details');
    const priceDisplay = document.getElementById('quote-price');
    const distanceDisplay = document.getElementById('quote-distance');
    const durationDisplay = document.getElementById('quote-duration');
    const pickupTypeRow = document.getElementById('pickup-type-row'); // Get row elements
    const pickupNotesRow = document.getElementById('pickup-notes-row');
    const dropoffTypeRow = document.getElementById('dropoff-type-row');
    const dropoffNotesRow = document.getElementById('dropoff-notes-row');
    const pickupTypeDisplay = document.getElementById('quote-pickup-type'); // Get display elements
    const pickupNotesDisplay = document.getElementById('quote-pickup-notes');
    const dropoffTypeDisplay = document.getElementById('quote-dropoff-type');
    const dropoffNotesDisplay = document.getElementById('quote-dropoff-notes');


    // Check if elements exist (should be called only after DOM is ready)
     if (
        !resultsArea || !loadingIndicator || !errorDisplay || !quoteDetailsDisplay ||
        !priceDisplay || !distanceDisplay || !durationDisplay ||
        !pickupTypeRow || !pickupNotesRow || !dropoffTypeRow || !dropoffNotesRow || // Check rows
        !pickupTypeDisplay || !pickupNotesDisplay || !dropoffTypeDisplay || !dropoffNotesDisplay // Check displays
    ) {
        console.error("Critical Error: One or more quote display elements not found in HTML! Cannot proceed.");
        return; // Added return
    }


    // Endpoint for Netlify function
    const endpoint = '/.netlify/functions/whatsapp-webhook';

    console.log(`Sending data to endpoint: ${endpoint}`);
    console.log('Data being sent:', data);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json(); // Attempt to parse JSON first

        if (!response.ok) {
            // Throw error using message from parsed JSON body if possible
            throw new Error(result.message || `Request failed with status ${response.status}`);
        }

        console.log('Received response from server:', result);

        // --- Display SUCCESS results in HTML ---
        priceDisplay.textContent = result.price || 'N/A';
        // Only show distance/duration if they exist in the result (hourly quote won't have distance)
        distanceDisplay.textContent = result.distance || '---';
        durationDisplay.textContent = result.duration || 'N/A';

        // Display airport-specific fields if applicable using style.display
        if (result.isPickupAirport) {
             pickupTypeRow.style.display = 'flex'; // Show row
            pickupTypeDisplay.textContent = result.pickupType
                ? result.pickupType.charAt(0).toUpperCase() + result.pickupType.slice(1)
                : 'N/A';
             pickupNotesRow.style.display = 'flex'; // Show row
            pickupNotesDisplay.textContent = result.pickupNotes || 'None';
        } else {
             pickupTypeRow.style.display = 'none'; // Hide row
             pickupNotesRow.style.display = 'none'; // Hide row
        }

        if (result.isDropoffAirport) {
             dropoffTypeRow.style.display = 'flex'; // Show row
            dropoffTypeDisplay.textContent = result.dropoffType
                ? result.dropoffType.charAt(0).toUpperCase() + result.dropoffType.slice(1)
                : 'N/A';
             dropoffNotesRow.style.display = 'flex'; // Show row
            dropoffNotesDisplay.textContent = result.dropoffNotes || 'None';
        } else {
             dropoffTypeRow.style.display = 'none'; // Hide row
             dropoffNotesRow.style.display = 'none'; // Hide row
        }

        errorDisplay.textContent = ''; // Clear any previous error message
        quoteDetailsDisplay.style.display = 'block'; // Show the quote details section
    } catch (error) {
        // Handle network errors or errors thrown from !response.ok or JSON parsing errors
        console.error('Error submitting booking request:', error);

        // --- Display ERROR message in HTML ---
        errorDisplay.textContent = error.message || 'An unknown error occurred.';
        quoteDetailsDisplay.style.display = 'none'; // Hide the quote details section on error
    } finally {
        // This block runs whether the fetch succeeded or failed
        console.log('Fetch request finished.');
        // Ensure loading indicator is hidden
        if (loadingIndicator) loadingIndicator.style.display = 'none'; // Hide loading
    }
} // End of submitBookingRequest

// Note: initAutocomplete is called automatically by the Google Maps script callback