// dashboard.js

// Global variables
let map;
let directionsService;
let directionsRenderer;
let lastQuoteDetails = null; // <<<<<<< ADDED: To store details for booking

// --- Helper Function to Show/Hide Airport Fields ---
// (Moved outside for scope fix)
function updateAirportFieldVisibility(addressInputId, isAirport) {
    let typeContainerId, notesContainerId, hiddenInputId;
    let typeInput, notesInput;
    console.log(`Updating airport fields for ${addressInputId}. Is Airport: ${isAirport}`);
    if (addressInputId === 'from-oneway' || addressInputId === 'from-hourly') {
        typeContainerId = 'pickup-type-container'; notesContainerId = 'pickup-notes-container';
        hiddenInputId = addressInputId === 'from-oneway' ? 'isPickupAirportOneWay' : 'isPickupAirportHourly';
        typeInput = document.getElementById('pickup-type'); notesInput = document.getElementById('pickup-notes');
    } else if (addressInputId === 'to-oneway') {
        typeContainerId = 'dropoff-type-container'; notesContainerId = 'dropoff-notes-container';
        hiddenInputId = 'isDropoffAirportOneWay';
        typeInput = document.getElementById('dropoff-type'); notesInput = document.getElementById('dropoff-notes');
    } else { return; }
    const typeContainer = document.getElementById(typeContainerId);
    const notesContainer = document.getElementById(notesContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!typeContainer || !notesContainer || !hiddenInput) { console.error(`Could not find all elements for ${addressInputId}`); return; }
    if (isAirport) {
        typeContainer.classList.remove('hidden'); notesContainer.classList.remove('hidden'); hiddenInput.value = 'true';
    } else {
        typeContainer.classList.add('hidden'); notesContainer.classList.add('hidden'); hiddenInput.value = 'false';
        if (typeInput) typeInput.selectedIndex = 0; if (notesInput) notesInput.value = '';
    }
}

// This function is called by the Google Maps script tag (callback=initAutocomplete)
function initAutocomplete() {
    console.log("Google Maps API loaded, initializing Autocomplete, Tabs, and Map.");
    const fromOneWayInput = document.getElementById('from-oneway');
    const toOneWayInput = document.getElementById('to-oneway');
    const fromHourlyInput = document.getElementById('from-hourly');
    const options = { /* ... autocomplete options ... */
        componentRestrictions: { country: "us" },
        fields: ["address_components", "geometry", "name", "formatted_address", "types"],
        bounds: new google.maps.LatLngBounds(new google.maps.LatLng(25.5, -80.5), new google.maps.LatLng(26.1, -80.0)),
        strictBounds: false,
    };

    // Initialize Autocomplete (One Way From)
    if (fromOneWayInput) { try {
        const autocompleteFromOneWay = new google.maps.places.Autocomplete(fromOneWayInput, options);
        autocompleteFromOneWay.addListener('place_changed', () => {
            const place = autocompleteFromOneWay.getPlace();
            const isAirport = place?.types?.includes('airport') || false;
            updateAirportFieldVisibility('from-oneway', isAirport);
        }); } catch (e) { console.error("Error initializing Autocomplete for from-oneway:", e); }
    } else { console.error("Input 'from-oneway' not found"); }

    // Initialize Autocomplete (One Way To)
    if (toOneWayInput) { try {
        const autocompleteToOneWay = new google.maps.places.Autocomplete(toOneWayInput, options);
        autocompleteToOneWay.addListener('place_changed', () => {
            const place = autocompleteToOneWay.getPlace();
            const isAirport = place?.types?.includes('airport') || false;
            updateAirportFieldVisibility('to-oneway', isAirport);
        }); } catch (e) { console.error("Error initializing Autocomplete for to-oneway:", e); }
    } else { console.error("Input 'to-oneway' not found"); }

     // Initialize Autocomplete (Hourly From)
    if (fromHourlyInput) { try {
        const autocompleteFromHourly = new google.maps.places.Autocomplete(fromHourlyInput, options);
        autocompleteFromHourly.addListener('place_changed', () => {
            const place = autocompleteFromHourly.getPlace();
            const isAirport = place?.types?.includes('airport') || false;
            updateAirportFieldVisibility('from-hourly', isAirport);
        }); } catch (e) { console.error("Error initializing Autocomplete for from-hourly:", e); }
    } else { console.error("Input 'from-hourly' not found"); }

    setupFormListeners();
    initializeTabSwitching();
}

// --- Function to get current location using Geolocation API ---
function getCurrentLocation(inputId) {
    console.log(`getCurrentLocation called for input: ${inputId} at ${new Date().toISOString()}`);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition( async (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`Geolocation retrieved: Lat ${latitude}, Lng ${longitude}`);
            const geocoder = new google.maps.Geocoder();
            const latlng = { lat: latitude, lng: longitude };
            try {
                const response = await new Promise((resolve, reject) => {
                    geocoder.geocode({ location: latlng }, (results, status) => {
                        if (status === 'OK' && results[0]) { resolve(results); }
                        else { reject(new Error('Geocoding failed: ' + status)); }
                    });
                });
                const address = response[0].formatted_address;
                console.log(`Geocoded address: ${address}`);
                const inputField = document.getElementById(inputId);
                if (inputField) {
                    inputField.value = address;
                    console.log(`Updated input '${inputId}' with address: ${address}`);
                    updateAirportFieldVisibility(inputId, false);
                } else { console.error(`Input field with ID '${inputId}' not found.`); }
            } catch (error) {
                console.error('Error geocoding location:', error);
                alert('Unable to retrieve address for your location. Please try again.');
            }
        }, (error) => { /* ... error handling ... */
             console.error('Geolocation error:', error);
             let errorMessage = 'Unable to retrieve your location.';
             switch(error.code) {
                 case error.PERMISSION_DENIED: errorMessage = 'Location access denied.'; break;
                 case error.POSITION_UNAVAILABLE: errorMessage = 'Location information unavailable.'; break;
                 case error.TIMEOUT: errorMessage = 'Location request timed out.'; break;
             }
             alert(errorMessage);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else { alert('Geolocation is not supported by your browser.'); }
}

// --- Setup form AND button listeners ---
function setupFormListeners() {
    const oneWayForm = document.getElementById('one-way-form');
    const hourlyForm = document.getElementById('by-the-hour-form');
    const oneWayLocationBtn = document.getElementById('get-location-oneway-btn');
    const hourlyLocationBtn = document.getElementById('get-location-hourly-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const bookNowBtn = document.getElementById('book-now-btn'); // <<<<< ADDED: Get Book Now button

    // Form submit listeners
    if (oneWayForm) { oneWayForm.addEventListener('submit', handleOneWaySubmit); console.log("Submit listener added to one-way form."); }
    else { console.error("One-way form element not found."); }
    if (hourlyForm) { hourlyForm.addEventListener('submit', handleHourlySubmit); console.log("Submit listener added to hourly form."); }
    else { console.error("Hourly form element not found."); }

    // Location button listeners
    if (oneWayLocationBtn) { oneWayLocationBtn.addEventListener('click', () => getCurrentLocation('from-oneway')); console.log("Location listener added to one-way button."); }
    else { console.warn("One-way location button not found."); }
    if (hourlyLocationBtn) { hourlyLocationBtn.addEventListener('click', () => getCurrentLocation('from-hourly')); console.log("Location listener added to hourly button."); }
    else { console.warn("Hourly location button not found."); }

    // Clear Form button listener
    if (clearFormBtn) { /* ... clear button logic ... */
        clearFormBtn.addEventListener('click', () => {
            console.log('Clear Form button clicked');
            const resultsArea = document.getElementById('quote-results-area');
            const errorDisplay = document.getElementById('quote-error');
            const oneWayFormActive = !document.getElementById('one-way-form').classList.contains('hidden');
            const hourlyFormActive = !document.getElementById('by-the-hour-form').classList.contains('hidden');
            if (resultsArea) resultsArea.style.display = 'none';
            if (errorDisplay) errorDisplay.textContent = '';
            lastQuoteDetails = null; // <<<<< ADDED: Clear stored quote details
            if (oneWayFormActive) {
                document.getElementById('one-way-form').reset();
                document.getElementById('isPickupAirportOneWay').value = 'false';
                document.getElementById('isDropoffAirportOneWay').value = 'false';
                updateAirportFieldVisibility('from-oneway', false); updateAirportFieldVisibility('to-oneway', false);
                console.log('One-way form cleared.');
            } else if (hourlyFormActive) {
                document.getElementById('by-the-hour-form').reset();
                document.getElementById('isPickupAirportHourly').value = 'false';
                updateAirportFieldVisibility('from-hourly', false);
                console.log('Hourly form cleared.');
            }
        });
        console.log("Clear form listener added.");
    } else { console.warn("Clear form button not found."); }

    // ---> ADDED: Listener for Book Now button <---
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', handleBookingSubmit); // Call new handler function
        console.log("Book Now listener added.");
    } else {
        console.warn("Book Now button not found."); // Should exist inside results area
    }
}

// --- Function to handle tab switching ---
function initializeTabSwitching() {
    // ... (tab switching logic remains the same - includes hiding results area) ...
    const oneWayTab = document.getElementById('one-way-tab');
    const byTheHourTab = document.getElementById('by-the-hour-tab');
    const oneWayForm = document.getElementById('one-way-form');
    const byTheHourForm = document.getElementById('by-the-hour-form');
    const resultsArea = document.getElementById('quote-results-area');
    const errorDisplay = document.getElementById('quote-error');

    if (!oneWayTab || !byTheHourTab || !oneWayForm || !byTheHourForm) { console.error("Tab/form elements missing."); return; }
    const tabs = [oneWayTab, byTheHourTab]; const forms = [oneWayForm, byTheHourForm];

    tabs.forEach((tab) => {
        tab.addEventListener('click', (event) => {
            console.log('Tab clicked, hiding results area.');
            if (resultsArea) resultsArea.style.display = 'none'; // Hide results
            if (errorDisplay) errorDisplay.textContent = '';     // Clear errors
            lastQuoteDetails = null; // <<<<< ADDED: Clear stored quote details on tab switch

            tabs.forEach((t) => t.classList.remove('active'));
            forms.forEach((f) => f.classList.add('hidden'));
            const clickedTab = event.currentTarget; clickedTab.classList.add('active');
            const targetFormId = clickedTab.getAttribute('data-target');
            const targetForm = document.getElementById(targetFormId);
            if (targetForm) { targetForm.classList.remove('hidden'); }
             else { console.warn(`Target form '${targetFormId}' not found.`); }
        });
    });
     // Initial load logic remains the same
     const initiallyActiveTab = document.querySelector('.tab-button.active'); /*...*/
     if (initiallyActiveTab) { /* ... */ } else { /* ... */ }
}

// ==================================================
// == FORM SUBMISSION LOGIC ==
// ==================================================

// --- Handle One-Way Form Submission (for getting quote) ---
async function handleOneWaySubmit(event) {
    event.preventDefault(); console.log('Handling one-way form submission...');
    const submitButton = event.target.querySelector('button[type="submit"]'); /*...*/
    const resultsArea = document.getElementById('quote-results-area'); /*...*/
    const loadingIndicator = document.getElementById('loading-indicator'); /*...*/
    const errorDisplay = document.getElementById('quote-error'); /*...*/
    const quoteDetailsDisplay = document.getElementById('quote-details'); /*...*/

    // Reset state
    lastQuoteDetails = null; // <<<<< ADDED: Clear previous quote data on new search
    if (resultsArea) resultsArea.style.display = 'block';
    if (quoteDetailsDisplay) quoteDetailsDisplay.style.display = 'none';
    if (errorDisplay) errorDisplay.textContent = '';
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    submitButton.disabled = true; submitButton.innerText = 'Searching...';

    // Gather form data
    const formData = {
        action: 'getQuote', // <<<<< Specify action
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
        if (errorDisplay) errorDisplay.textContent = 'Please fill in all required fields.';
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        submitButton.disabled = false; submitButton.innerText = 'Search';
        return;
    }
    await submitRequest(formData); // Use generic submit function
    submitButton.disabled = false; submitButton.innerText = 'Search'; // Restore button state
}

// --- Handle Hourly Form Submission (for getting quote) ---
async function handleHourlySubmit(event) {
    event.preventDefault(); console.log('Handling hourly form submission...');
    const submitButton = event.target.querySelector('button[type="submit"]'); /*...*/
    const resultsArea = document.getElementById('quote-results-area'); /*...*/
    const loadingIndicator = document.getElementById('loading-indicator'); /*...*/
    const errorDisplay = document.getElementById('quote-error'); /*...*/
    const quoteDetailsDisplay = document.getElementById('quote-details'); /*...*/

     // Reset state
    lastQuoteDetails = null; // <<<<< ADDED: Clear previous quote data on new search
    if (resultsArea) resultsArea.style.display = 'block';
    if (quoteDetailsDisplay) quoteDetailsDisplay.style.display = 'none';
    if (errorDisplay) errorDisplay.textContent = '';
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    submitButton.disabled = true; submitButton.innerText = 'Searching...';

    // Gather form data
    const formData = {
        action: 'getQuote', // <<<<< Specify action
        type: 'hourly',
        pickupAddress: document.getElementById('from-hourly').value,
        durationHours: document.getElementById('duration-hourly').value,
        pickupDate: document.getElementById('date-hourly').value,
        pickupTime: document.getElementById('time-hourly').value,
        isPickupAirport: document.getElementById('isPickupAirportHourly').value,
    };
    // Basic validation
    if (!formData.pickupAddress || !formData.durationHours || !formData.pickupDate || !formData.pickupTime) {
         if (errorDisplay) errorDisplay.textContent = 'Please fill in all fields.';
         if (loadingIndicator) loadingIndicator.style.display = 'none';
         submitButton.disabled = false; submitButton.innerText = 'Search';
         return;
    }
    await submitRequest(formData); // Use generic submit function
    submitButton.disabled = false; submitButton.innerText = 'Search'; // Restore button state
}

// ---> ADDED: Handle Book Now Button Click <---
async function handleBookingSubmit() {
    console.log('Handling booking submission...');
    const bookNowBtn = document.getElementById('book-now-btn');
    const resultsArea = document.getElementById('quote-results-area');
    const errorDisplay = document.getElementById('quote-error');
    const quoteDetailsDisplay = document.getElementById('quote-details'); // To potentially hide later

    // Check if we have stored quote details
    if (!lastQuoteDetails) {
        console.error("No quote details found to book.");
        if(errorDisplay) errorDisplay.textContent = 'Cannot book. Please get a valid quote first.';
        // Make sure results area is visible to show the error
        if (resultsArea) resultsArea.style.display = 'block';
        if (quoteDetailsDisplay) quoteDetailsDisplay.style.display = 'none';
        return;
    }

    // Disable button, show loading state
    if (bookNowBtn) {
         bookNowBtn.disabled = true;
         bookNowBtn.innerText = 'Booking...';
         // Also disable clear button during booking attempt
         document.getElementById('clear-form-btn').disabled = true;
    }
    if(errorDisplay) errorDisplay.textContent = ''; // Clear previous errors in the dedicated error spot

    // Construct payload for backend 'book' action
    // We pass the essential details needed by the backend for the email
    const bookingData = {
        action: 'book',
        // Ride details from the stored quote/form inputs
        type: lastQuoteDetails.type,
        pickupAddress: lastQuoteDetails.pickupAddress,
        dropoffAddress: lastQuoteDetails.dropoffAddress, // Will be null/undefined if hourly
        pickupDate: lastQuoteDetails.pickupDate,
        pickupTime: lastQuoteDetails.pickupTime,
        durationHours: lastQuoteDetails.durationHours, // Will be null/undefined if one-way
        isPickupAirport: lastQuoteDetails.isPickupAirport, // Pass boolean/string as stored
        isDropoffAirport: lastQuoteDetails.isDropoffAirport, // Pass boolean/string as stored
        pickupType: lastQuoteDetails.pickupType,
        pickupNotes: lastQuoteDetails.pickupNotes,
        dropoffType: lastQuoteDetails.dropoffType,
        dropoffNotes: lastQuoteDetails.dropoffNotes,
        // Pass back the specific quote details displayed to the user
        quotePrice: lastQuoteDetails.quotePrice,
        quoteDistance: lastQuoteDetails.quoteDistance,
        quoteDuration: lastQuoteDetails.quoteDuration,
        // Add passenger placeholders (enhance later by adding form fields)
        passengerName: 'N/A (Web Form)',
        passengerPhone: 'N/A',
        passengerEmail: 'N/A'
    };

    console.log('Sending booking data:', bookingData);

    // Use the generic submitRequest function
    await submitRequest(bookingData, true); // Pass true to indicate it's a booking action

    // Re-enable buttons only if booking failed (handled in submitRequest's catch)
    // If successful, buttons remain disabled / UI shows success message
}


// --- UPDATED: Reusable Fetch Function (Handles both Quote and Book) ---
async function submitRequest(data, isBookingAction = false) {
    const resultsArea = document.getElementById('quote-results-area');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('quote-error');
    const quoteDetailsDisplay = document.getElementById('quote-details');
    const priceDisplay = document.getElementById('quote-price');
    const distanceDisplay = document.getElementById('quote-distance');
    const durationDisplay = document.getElementById('quote-duration');
    const pickupTypeRow = document.getElementById('pickup-type-row');
    const pickupNotesRow = document.getElementById('pickup-notes-row');
    const dropoffTypeRow = document.getElementById('dropoff-type-row');
    const dropoffNotesRow = document.getElementById('dropoff-notes-row');
    const pickupTypeDisplay = document.getElementById('quote-pickup-type');
    const pickupNotesDisplay = document.getElementById('quote-pickup-notes');
    const dropoffTypeDisplay = document.getElementById('quote-dropoff-type');
    const dropoffNotesDisplay = document.getElementById('quote-dropoff-notes');
    const bookNowBtn = document.getElementById('book-now-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');


    // Check if elements exist
     if ( /* ... element checks ... */
        !resultsArea || !loadingIndicator || !errorDisplay || !quoteDetailsDisplay ||
        !priceDisplay || !distanceDisplay || !durationDisplay ||
        !pickupTypeRow || !pickupNotesRow || !dropoffTypeRow || !dropoffNotesRow ||
        !pickupTypeDisplay || !pickupNotesDisplay || !dropoffTypeDisplay || !dropoffNotesDisplay ||
        !bookNowBtn || !clearFormBtn
    ) { console.error("Critical Error: One or more UI elements not found!"); return; }


    const endpoint = '/.netlify/functions/whatsapp-webhook';
    console.log(`Sending data to endpoint: ${endpoint}`);
    console.log('Data being sent:', data);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            // Throw error using message from parsed JSON body if possible
            throw new Error(result.message || `Request failed with status ${response.status}`);
        }

        console.log('Received response from server:', result);
        errorDisplay.textContent = ''; // Clear previous errors on success

        // --- Handle SUCCESS response ---
        if (data.action === 'getQuote') {
            // Store details for potential booking
            lastQuoteDetails = {
                ...data, // Original form inputs
                quotePrice: result.price, // Results from backend
                quoteDistance: result.distance,
                quoteDuration: result.duration,
                // Use results from backend for airport flags/details for consistency
                isPickupAirport: result.isPickupAirport,
                isDropoffAirport: result.isDropoffAirport,
                pickupType: result.pickupType,
                pickupNotes: result.pickupNotes,
                dropoffType: result.dropoffType,
                dropoffNotes: result.dropoffNotes
            };
            console.log('Stored lastQuoteDetails for booking:', lastQuoteDetails);

            // Display quote details in HTML
            priceDisplay.textContent = result.price || 'N/A';
            distanceDisplay.textContent = result.distance || '---';
            durationDisplay.textContent = result.duration || 'N/A';

            // Show/Hide airport result rows
            result.isPickupAirport ? pickupTypeRow.style.display = 'flex' : pickupTypeRow.style.display = 'none';
            if(result.isPickupAirport) pickupTypeDisplay.textContent = result.pickupType ? result.pickupType.charAt(0).toUpperCase() + result.pickupType.slice(1) : 'N/A';
            result.isPickupAirport ? pickupNotesRow.style.display = 'flex' : pickupNotesRow.style.display = 'none';
             if(result.isPickupAirport) pickupNotesDisplay.textContent = result.pickupNotes || 'None';

            result.isDropoffAirport ? dropoffTypeRow.style.display = 'flex' : dropoffTypeRow.style.display = 'none';
            if(result.isDropoffAirport) dropoffTypeDisplay.textContent = result.dropoffType ? result.dropoffType.charAt(0).toUpperCase() + result.dropoffType.slice(1) : 'N/A';
            result.isDropoffAirport ? dropoffNotesRow.style.display = 'flex' : dropoffNotesRow.style.display = 'none';
            if(result.isDropoffAirport) dropoffNotesDisplay.textContent = result.dropoffNotes || 'None';

            quoteDetailsDisplay.style.display = 'block'; // Show the quote details section

        } else if (data.action === 'book') {
            // Display booking success message
             if (resultsArea) {
                 resultsArea.innerHTML = `<div class="text-center p-4 bg-green-100 text-green-800 rounded-lg">
                                            <h3 class="text-lg font-semibold mb-2">Booking Request Sent!</h3>
                                            <p>${result.message || 'You will be contacted shortly to confirm.'}</p>
                                         </div>`;
                 resultsArea.style.display = 'block'; // Ensure it's visible
            }
            // Buttons remain disabled after successful booking
        }

    } catch (error) {
        // --- Handle ERROR response ---
        console.error(`Error submitting ${data.action} request:`, error);
        errorDisplay.textContent = error.message || `An unknown error occurred during ${data.action}.`;
        quoteDetailsDisplay.style.display = 'none'; // Hide details section on error

        // Re-enable buttons only if it was a booking attempt that failed
        if (isBookingAction) {
             if (bookNowBtn) { bookNowBtn.disabled = false; bookNowBtn.innerText = 'Book Now'; }
             if (clearFormBtn) { clearFormBtn.disabled = false; }
        }
    } finally {
        // This block runs whether the fetch succeeded or failed
        console.log('Fetch request finished.');
        if (loadingIndicator) loadingIndicator.style.display = 'none'; // Hide loading indicator
    }
}

// Note: initAutocomplete is called automatically by the Google Maps script callback