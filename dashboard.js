// dashboard.js

// Global variables
let map;
let directionsService;
let directionsRenderer;
let lastQuoteDetails = null; // To store details for booking

// --- Helper Function to Show/Hide Airport Fields ---
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
    } else { console.warn(`Unknown address input ID: ${addressInputId}`); return; }
    const typeContainer = document.getElementById(typeContainerId);
    const notesContainer = document.getElementById(notesContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!typeContainer || !notesContainer || !hiddenInput) { console.error(`Missing elements for ${addressInputId}`); return; }
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
    const options = {
        componentRestrictions: { country: "us" },
        fields: ["address_components", "geometry", "name", "formatted_address", "types"],
        bounds: new google.maps.LatLngBounds(new google.maps.LatLng(25.5, -80.5), new google.maps.LatLng(26.1, -80.0)),
        strictBounds: false,
    };

    // Init Autocompletes (with error handling)
    if (fromOneWayInput) { try { /* ...Autocomplete setup for fromOneWayInput... */
        const ac = new google.maps.places.Autocomplete(fromOneWayInput, options);
        ac.addListener('place_changed', () => { const p = ac.getPlace(); updateAirportFieldVisibility('from-oneway', p?.types?.includes('airport')||false); });
    } catch(e){console.error('Autocomplete failed (from-oneway)', e)} } else { console.error("Input 'from-oneway' not found"); }

    if (toOneWayInput) { try { /* ...Autocomplete setup for toOneWayInput... */
        const ac = new google.maps.places.Autocomplete(toOneWayInput, options);
        ac.addListener('place_changed', () => { const p = ac.getPlace(); updateAirportFieldVisibility('to-oneway', p?.types?.includes('airport')||false); });
    } catch(e){console.error('Autocomplete failed (to-oneway)', e)} } else { console.error("Input 'to-oneway' not found"); }

    if (fromHourlyInput) { try { /* ...Autocomplete setup for fromHourlyInput... */
        const ac = new google.maps.places.Autocomplete(fromHourlyInput, options);
        ac.addListener('place_changed', () => { const p = ac.getPlace(); updateAirportFieldVisibility('from-hourly', p?.types?.includes('airport')||false); });
     } catch(e){console.error('Autocomplete failed (from-hourly)', e)} } else { console.error("Input 'from-hourly' not found"); }

    setupFormListeners();
    initializeTabSwitching();
}

// --- Function to get current location using Geolocation API ---
function getCurrentLocation(inputId) {
    console.log(`getCurrentLocation called for input: ${inputId} at ${new Date().toISOString()}`);
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser.'); return; }

    navigator.geolocation.getCurrentPosition( async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Geolocation retrieved: Lat ${latitude}, Lng ${longitude}`);
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };
        try {
            const response = await new Promise((resolve, reject) => {
                geocoder.geocode({ location: latlng }, (results, status) => {
                    if (status === 'OK' && results[0]) { resolve(results); }
                    else { reject(new Error(`Geocoding failed: ${status}`)); }
                });
            });
            const address = response[0].formatted_address;
            console.log(`Geocoded address: ${address}`);
            const inputField = document.getElementById(inputId);
            if (inputField) { inputField.value = address; updateAirportFieldVisibility(inputId, false); }
            else { console.error(`Input field '${inputId}' not found.`); }
        } catch (error) {
            console.error('Error geocoding location:', error);
            alert(`Unable to retrieve address: ${error.message}`);
        }
    }, (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to retrieve your location.';
        switch(error.code) { /* ... error messages ... */
            case error.PERMISSION_DENIED: errorMessage = 'Location access denied.'; break;
            case error.POSITION_UNAVAILABLE: errorMessage = 'Location information unavailable.'; break;
            case error.TIMEOUT: errorMessage = 'Location request timed out.'; break;
        }
        alert(errorMessage);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
}

// --- Setup form AND button listeners ---
function setupFormListeners() {
    const oneWayForm = document.getElementById('one-way-form');
    const hourlyForm = document.getElementById('by-the-hour-form');
    const oneWayLocationBtn = document.getElementById('get-location-oneway-btn');
    const hourlyLocationBtn = document.getElementById('get-location-hourly-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const bookNowBtn = document.getElementById('book-now-btn');

    // Form submit listeners
    if (oneWayForm) { oneWayForm.addEventListener('submit', handleOneWaySubmit); console.log("Submit listener added (one-way)."); } else { console.error("One-way form missing."); }
    if (hourlyForm) { hourlyForm.addEventListener('submit', handleHourlySubmit); console.log("Submit listener added (hourly)."); } else { console.error("Hourly form missing."); }

    // Location button listeners
    if (oneWayLocationBtn) { oneWayLocationBtn.addEventListener('click', () => getCurrentLocation('from-oneway')); console.log("Location listener added (one-way)."); } else { console.warn("One-way location button missing."); }
    if (hourlyLocationBtn) { hourlyLocationBtn.addEventListener('click', () => getCurrentLocation('from-hourly')); console.log("Location listener added (hourly)."); } else { console.warn("Hourly location button missing."); }

    // Clear Form button listener
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', () => {
            console.log('Clear Form button clicked');
            const resultsArea = document.getElementById('quote-results-area');
            const errorDisplay = document.getElementById('quote-error');
            const oneWayFormEl = document.getElementById('one-way-form');
            const hourlyFormEl = document.getElementById('by-the-hour-form');
            const oneWayFormActive = !oneWayFormEl.classList.contains('hidden');

            if (resultsArea) resultsArea.style.display = 'none';
            if (errorDisplay) errorDisplay.textContent = '';
            lastQuoteDetails = null; // Clear stored details

            if (oneWayFormActive) {
                oneWayFormEl.reset();
                document.getElementById('isPickupAirportOneWay').value = 'false';
                document.getElementById('isDropoffAirportOneWay').value = 'false';
                updateAirportFieldVisibility('from-oneway', false); updateAirportFieldVisibility('to-oneway', false);
                console.log('One-way form cleared.');
            } else { // Assume hourly is active
                hourlyFormEl.reset();
                document.getElementById('isPickupAirportHourly').value = 'false';
                updateAirportFieldVisibility('from-hourly', false);
                console.log('Hourly form cleared.');
            }
        });
        console.log("Clear form listener added.");
    } else { console.warn("Clear form button missing."); }

    // Book Now button listener
    if (bookNowBtn) { bookNowBtn.addEventListener('click', handleBookingSubmit); console.log("Book Now listener added."); }
    else { console.warn("Book Now button missing initially (expected inside results)."); }
}

// --- Function to handle tab switching ---
function initializeTabSwitching() {
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
            if (resultsArea) resultsArea.style.display = 'none';
            if (errorDisplay) errorDisplay.textContent = '';
            lastQuoteDetails = null; // Clear stored details

            tabs.forEach((t) => t.classList.remove('active')); forms.forEach((f) => f.classList.add('hidden'));
            const clickedTab = event.currentTarget; clickedTab.classList.add('active');
            const targetFormId = clickedTab.getAttribute('data-target'); const targetForm = document.getElementById(targetFormId);
            if (targetForm) { targetForm.classList.remove('hidden'); } else { console.warn(`Target form '${targetFormId}' not found.`); }
        });
    });
    // Initial active tab logic remains the same
    const initiallyActiveTab = document.querySelector('.tab-button.active'); /*...*/
    if (initiallyActiveTab) { /* ... */ } else { /* ... */ }
}

// ==================================================
// == FORM SUBMISSION HANDLERS ==
// ==================================================

// --- Handle One-Way Form Submission (for getting quote) ---
async function handleOneWaySubmit(event) {
    event.preventDefault(); console.log('Handling one-way form submission...');
    const submitButton = event.target.querySelector('button[type="submit"]');
    const errorDisplay = document.getElementById('quote-error');

    // Reset state
    lastQuoteDetails = null;
    if(errorDisplay) errorDisplay.textContent = '';

    // Gather form data
    const formData = {
        action: 'getQuote', // <<< Action added
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
        return; // Stop if validation fails
    }

    // Disable button before sending request
    if(submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText = submitButton.innerText; // Store original text
        submitButton.innerText = 'Searching...';
    }

    await submitRequest(formData); // Call generic submit function

    // Button state restored in submitRequest's finally block
}

// --- Handle Hourly Form Submission (for getting quote) ---
async function handleHourlySubmit(event) {
    event.preventDefault(); console.log('Handling hourly form submission...');
    const submitButton = event.target.querySelector('button[type="submit"]');
    const errorDisplay = document.getElementById('quote-error');

    // Reset state
    lastQuoteDetails = null;
     if(errorDisplay) errorDisplay.textContent = '';

    // Gather form data
    const formData = {
        action: 'getQuote', // <<< Action added
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
        return; // Stop if validation fails
    }

     // Disable button before sending request
    if(submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText = submitButton.innerText; // Store original text
        submitButton.innerText = 'Searching...';
    }

    await submitRequest(formData); // Call generic submit function

    // Button state restored in submitRequest's finally block
}

// --- Handle Book Now Button Click ---
async function handleBookingSubmit() {
    console.log('Handling booking submission...');
    const bookNowBtn = document.getElementById('book-now-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const resultsArea = document.getElementById('quote-results-area');
    const errorDisplay = document.getElementById('quote-error');
    const quoteDetailsDisplay = document.getElementById('quote-details');

    if (!lastQuoteDetails) {
        console.error("No quote details found to book.");
        if(errorDisplay) errorDisplay.textContent = 'Cannot book. Please get a valid quote first.';
        if (resultsArea) resultsArea.style.display = 'block';
        if (quoteDetailsDisplay) quoteDetailsDisplay.style.display = 'none';
        return;
    }

    // Disable buttons, show loading state
    if (bookNowBtn) { bookNowBtn.disabled = true; bookNowBtn.innerText = 'Booking...'; }
    if (clearFormBtn) { clearFormBtn.disabled = true; } // Also disable clear during booking
    if(errorDisplay) errorDisplay.textContent = '';

    // Construct payload for backend 'book' action
    const bookingData = {
        action: 'book',
        // Pass all relevant details stored from the quote request/response
        type: lastQuoteDetails.type,
        pickupAddress: lastQuoteDetails.pickupAddress,
        dropoffAddress: lastQuoteDetails.dropoffAddress,
        pickupDate: lastQuoteDetails.pickupDate,
        pickupTime: lastQuoteDetails.pickupTime,
        durationHours: lastQuoteDetails.durationHours,
        isPickupAirport: lastQuoteDetails.isPickupAirport,
        isDropoffAirport: lastQuoteDetails.isDropoffAirport,
        pickupType: lastQuoteDetails.pickupType,
        pickupNotes: lastQuoteDetails.pickupNotes,
        dropoffType: lastQuoteDetails.dropoffType,
        dropoffNotes: lastQuoteDetails.dropoffNotes,
        quotePrice: lastQuoteDetails.quotePrice,
        quoteDistance: lastQuoteDetails.quoteDistance,
        quoteDuration: lastQuoteDetails.quoteDuration,
        // Add passenger placeholders
        passengerName: 'N/A (Web Form)',
        passengerPhone: 'N/A',
        passengerEmail: 'N/A'
    };

    console.log('Sending booking data:', bookingData);
    await submitRequest(bookingData, true); // Pass true for booking action

    // If submitRequest fails, it re-enables buttons in finally block
    // If successful, buttons remain disabled, success message shown
}


// ---> ADDED BACK: Reusable Fetch Function (Handles both Quote and Book) <---
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
    // Find the correct submit button based on active form
    const activeSubmitButton = data.type === 'one-way'
        ? document.querySelector('#one-way-form button[type="submit"]')
        : document.querySelector('#by-the-hour-form button[type="submit"]');

    // Ensure elements exist
    if (!resultsArea || !loadingIndicator || !errorDisplay || !quoteDetailsDisplay || !priceDisplay || !distanceDisplay || !durationDisplay || !pickupTypeRow || !pickupNotesRow || !dropoffTypeRow || !dropoffNotesRow || !pickupTypeDisplay || !pickupNotesDisplay || !dropoffTypeDisplay || !dropoffNotesDisplay || !bookNowBtn || !clearFormBtn) {
        console.error("Critical Error: One or more UI elements not found!");
        // Attempt to restore submit button if possible
         if(activeSubmitButton && activeSubmitButton.dataset.originalText) {
             activeSubmitButton.disabled = false;
             activeSubmitButton.innerText = activeSubmitButton.dataset.originalText;
         }
        return;
    }

    // Show results area, hide details, show loading (except for booking action)
    if (!isBookingAction) {
        resultsArea.style.display = 'block';
        quoteDetailsDisplay.style.display = 'none';
        loadingIndicator.style.display = 'block';
    }
     errorDisplay.textContent = ''; // Clear errors always

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
            throw new Error(result.message || `Request failed with status ${response.status}`);
        }

        console.log('Received response from server:', result);

        // --- Handle SUCCESS response ---
        if (data.action === 'getQuote') {
            // Store details for potential booking
             lastQuoteDetails = {
                ...data, // Original form inputs
                quotePrice: result.price, quoteDistance: result.distance, quoteDuration: result.duration,
                // Use results from backend for airport flags/details
                isPickupAirport: result.isPickupAirport, isDropoffAirport: result.isDropoffAirport,
                pickupType: result.pickupType, pickupNotes: result.pickupNotes,
                dropoffType: result.dropoffType, dropoffNotes: result.dropoffNotes
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
                 resultsArea.style.display = 'block';
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
        // This block runs always
        console.log('Fetch request finished.');
        if (loadingIndicator) loadingIndicator.style.display = 'none'; // Hide loading
        // Restore the correct Submit button state only if it's NOT a successful booking
        if (activeSubmitButton && !(data.action === 'book' && !errorDisplay.textContent)) { // Restore unless booking succeeded
             if(activeSubmitButton.dataset.originalText) {
                activeSubmitButton.disabled = false;
                activeSubmitButton.innerText = activeSubmitButton.dataset.originalText;
             }
        }
    }
}

// Note: initAutocomplete is called automatically by the Google Maps script callback