// dashboard.js

// This function is called by the Google Maps script tag (callback=initAutocomplete)
function initAutocomplete() {
    console.log("Google Maps API loaded, initializing Autocomplete and Tabs.");

    // --- Get references to your address input fields ---
    const fromOneWayInput = document.getElementById('from-oneway');
    const toOneWayInput = document.getElementById('to-oneway');
    const fromHourlyInput = document.getElementById('from-hourly');

    // --- Options for Autocomplete ---
    const options = {
        componentRestrictions: { country: "us" },
        fields: ["address_components", "geometry", "name", "formatted_address"],
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(25.5, -80.5), // SW Miami area
            new google.maps.LatLng(26.1, -80.0)  // NE Fort Lauderdale area
        ),
        strictBounds: false,
    };

    // --- Create Autocomplete objects ---
    // (Error checks added for robustness)
    if (fromOneWayInput) {
        try {
            const autocompleteFromOneWay = new google.maps.places.Autocomplete(fromOneWayInput, options);
            autocompleteFromOneWay.addListener('place_changed', () => {
                const place = autocompleteFromOneWay.getPlace();
                if (place?.geometry?.location) { // Optional chaining for safety
                    console.log("Selected Place (From One Way):", place.formatted_address, place.geometry.location.lat(), place.geometry.location.lng());
                } else {
                    console.log("Autocomplete 'From One Way' returned place without geometry");
                }
            });
        } catch(e) { console.error("Error initializing Autocomplete for from-oneway:", e)}
    } else { console.error("Input 'from-oneway' not found"); }

    if (toOneWayInput) {
        try {
            const autocompleteToOneWay = new google.maps.places.Autocomplete(toOneWayInput, options);
            autocompleteToOneWay.addListener('place_changed', () => {
                const place = autocompleteToOneWay.getPlace();
                if (place?.geometry?.location) {
                    console.log("Selected Place (To One Way):", place.formatted_address, place.geometry.location.lat(), place.geometry.location.lng());
                } else {
                    console.log("Autocomplete 'To One Way' returned place without geometry");
                }
            });
        } catch(e) { console.error("Error initializing Autocomplete for to-oneway:", e)}
    } else { console.error("Input 'to-oneway' not found"); }

    if (fromHourlyInput) {
        try {
            const autocompleteFromHourly = new google.maps.places.Autocomplete(fromHourlyInput, options);
            autocompleteFromHourly.addListener('place_changed', () => {
                const place = autocompleteFromHourly.getPlace();
                if (place?.geometry?.location) {
                    console.log("Selected Place (From Hourly):", place.formatted_address, place.geometry.location.lat(), place.geometry.location.lng());
                } else {
                    console.log("Autocomplete 'From Hourly' returned place without geometry");
                }
            });
        } catch(e) { console.error("Error initializing Autocomplete for from-hourly:", e)}
    } else { console.error("Input 'from-hourly' not found"); }

    // --- Setup Form Listeners ---
    setupFormListeners();

    // --- Initialize the tab switching functionality ---
    initializeTabSwitching();
} // End of initAutocomplete function

// --- Function to get current location using Geolocation API ---
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
                switch(error.code) {
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
                maximumAge: 0
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

    // Form submit listeners (existing)
    if (oneWayForm) {
        oneWayForm.addEventListener('submit', handleOneWaySubmit);
        console.log("Submit listener added to one-way form.");
    } else { console.error("One-way form element not found."); }

    if (hourlyForm) {
        hourlyForm.addEventListener('submit', handleHourlySubmit);
        console.log("Submit listener added to hourly form.");
    } else { console.error("Hourly form element not found."); }

    // --- Add listeners for location buttons ---
    if (oneWayLocationBtn) {
        oneWayLocationBtn.addEventListener('click', () => {
            // Call getCurrentLocation, passing the ID of the input to update
            getCurrentLocation('from-oneway');
        });
        console.log("Location listener added to one-way button.");
    } else { console.warn("One-way location button not found."); } // Use warn if optional

    if (hourlyLocationBtn) {
        hourlyLocationBtn.addEventListener('click', () => {
            // Call getCurrentLocation, passing the ID of the input to update
            getCurrentLocation('from-hourly');
        });
        console.log("Location listener added to hourly button.");
    } else { console.warn("Hourly location button not found."); } // Use warn if optional
}

// --- Function to handle tab switching ---
function initializeTabSwitching() {
    const oneWayTab = document.getElementById('one-way-tab');
    const byTheHourTab = document.getElementById('by-the-hour-tab');
    const oneWayForm = document.getElementById('one-way-form');
    const byTheHourForm = document.getElementById('by-the-hour-form');

    if (!oneWayTab || !byTheHourTab || !oneWayForm || !byTheHourForm) {
        console.error("One or more tab/form elements not found. Tab switching disabled.");
        return;
    }

    const tabs = [oneWayTab, byTheHourTab];
    const forms = [oneWayForm, byTheHourForm];

    tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.add('hidden'));
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
            forms.forEach(f => f.classList.add('hidden'));
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
        forms.forEach(f => f.classList.add('hidden'));
        oneWayForm.classList.remove('hidden');
        if(oneWayTab) oneWayTab.classList.add('active');
    }
} // End of initializeTabSwitching function

// ==================================================
// == FORM SUBMISSION LOGIC (WITH UI UPDATES) ==
// ==================================================

// --- Handle One-Way Form Submission ---
async function handleOneWaySubmit(event) {
    event.preventDefault();
    console.log('Handling one-way form submission...');

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerText;
    submitButton.disabled = true;
    submitButton.innerText = 'Searching...';

    // --- Prepare UI for request ---
    const resultsArea = document.getElementById('quote-results-area');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('quote-error');
    const quoteDetailsDisplay = document.getElementById('quote-details');

    // Hide previous results/errors, show loading
    if(resultsArea) resultsArea.style.display = 'block'; // Show area
    if(quoteDetailsDisplay) quoteDetailsDisplay.style.display = 'none'; // Hide details
    if(errorDisplay) errorDisplay.textContent = ''; // Clear errors
    if(loadingIndicator) loadingIndicator.style.display = 'block'; // Show loading

    // Gather form data
    const formData = {
        type: 'one-way',
        pickupAddress: document.getElementById('from-oneway').value,
        dropoffAddress: document.getElementById('to-oneway').value,
        pickupDate: document.getElementById('date-oneway').value,
        pickupTime: document.getElementById('time-oneway').value,
    };

    // Basic validation
    if (!formData.pickupAddress || !formData.dropoffAddress || !formData.pickupDate || !formData.pickupTime) {
        if(errorDisplay) errorDisplay.textContent = 'Please fill in all fields for the one-way booking.';
        if(loadingIndicator) loadingIndicator.style.display = 'none';
        submitButton.disabled = false;
        submitButton.innerText = originalButtonText;
        return;
    }

    // Send data (submitBookingRequest handles displaying results/errors now)
    await submitBookingRequest(formData);

    // Restore button state AFTER the request finishes
    submitButton.disabled = false;
    submitButton.innerText = originalButtonText;
}

// --- Handle Hourly Form Submission ---
async function handleHourlySubmit(event) {
    event.preventDefault();
    console.log('Handling hourly form submission...');

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerText;
    submitButton.disabled = true;
    submitButton.innerText = 'Searching...';

    // --- Prepare UI for request ---
    const resultsArea = document.getElementById('quote-results-area');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('quote-error');
    const quoteDetailsDisplay = document.getElementById('quote-details');

    // Hide previous results/errors, show loading
    if(resultsArea) resultsArea.style.display = 'block'; // Show area
    if(quoteDetailsDisplay) quoteDetailsDisplay.style.display = 'none'; // Hide details
    if(errorDisplay) errorDisplay.textContent = ''; // Clear errors
    if(loadingIndicator) loadingIndicator.style.display = 'block'; // Show loading

    // Gather form data
    const formData = {
        type: 'hourly',
        pickupAddress: document.getElementById('from-hourly').value,
        durationHours: document.getElementById('duration-hourly').value,
        pickupDate: document.getElementById('date-hourly').value,
        pickupTime: document.getElementById('time-hourly').value,
    };

    // Basic validation
    if (!formData.pickupAddress || !formData.durationHours || !formData.pickupDate || !formData.pickupTime) {
        if(errorDisplay) errorDisplay.textContent = 'Please fill in all fields for the hourly booking.';
        if(loadingIndicator) loadingIndicator.style.display = 'none';
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

// --- UPDATED: Reusable Fetch Function to Send Data & Update UI ---
async function submitBookingRequest(data) {
    // Get references to the UI elements for results, loading, and errors
    const resultsArea = document.getElementById('quote-results-area');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('quote-error');
    const quoteDetailsDisplay = document.getElementById('quote-details');
    const priceDisplay = document.getElementById('quote-price');
    const distanceDisplay = document.getElementById('quote-distance');
    const durationDisplay = document.getElementById('quote-duration');

    // Check if elements exist (should be called only after DOM is ready)
    if (!resultsArea || !loadingIndicator || !errorDisplay || !quoteDetailsDisplay || !priceDisplay || !distanceDisplay || !durationDisplay) {
        console.error("Critical Error: One or more quote display elements not found in HTML! Cannot proceed.");
        return;
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
        if(loadingIndicator) loadingIndicator.style.display = 'none';
    }
} // End of submitBookingRequest

// Note: initAutocomplete is called automatically by the Google Maps script callback