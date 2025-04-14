// dashboard.js
// Reverted Version: Quote functionality only, no booking logic

// Global variables
let map;
let directionsService;
let directionsRenderer;
// let lastQuoteDetails = null; // REMOVED: Not needed without booking

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

    // Init Autocompletes
    if (fromOneWayInput) { try {
        const ac = new google.maps.places.Autocomplete(fromOneWayInput, options);
        ac.addListener('place_changed', () => { const p = ac.getPlace(); updateAirportFieldVisibility('from-oneway', p?.types?.includes('airport')||false); });
    } catch(e){console.error('Autocomplete failed (from-oneway)', e)} } else { console.error("Input 'from-oneway' not found"); }

    if (toOneWayInput) { try {
        const ac = new google.maps.places.Autocomplete(toOneWayInput, options);
        ac.addListener('place_changed', () => { const p = ac.getPlace(); updateAirportFieldVisibility('to-oneway', p?.types?.includes('airport')||false); });
    } catch(e){console.error('Autocomplete failed (to-oneway)', e)} } else { console.error("Input 'to-oneway' not found"); }

    if (fromHourlyInput) { try {
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
         switch(error.code) {
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
    // const bookNowBtn = document.getElementById('book-now-btn'); // REMOVED: No book listener needed

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
            // lastQuoteDetails = null; // REMOVED: Not needed

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

    // REMOVED: Listener for Book Now button
    // if (bookNowBtn) { bookNowBtn.addEventListener('click', handleBookingSubmit); console.log("Book Now listener added."); }
    // else { console.warn("Book Now button missing initially (expected inside results)."); }
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
            // lastQuoteDetails = null; // REMOVED: Not needed

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
    // lastQuoteDetails = null; // REMOVED: Not needed
    if(errorDisplay) errorDisplay.textContent = '';

    // Gather form data
    const formData = {
        action: 'getQuote', // Action added correctly
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
        return;
    }

    if(submitButton) {
        submitButton.disabled = true; submitButton.dataset.originalText = submitButton.innerText; submitButton.innerText = 'Searching...';
    }

    await submitQuoteRequest(formData); // Use quote-specific function name

    // Button state restored in submitQuoteRequest's finally block
}

// --- Handle Hourly Form Submission (for getting quote) ---
async function handleHourlySubmit(event) {
    event.preventDefault(); console.log('Handling hourly form submission...');
    const submitButton = event.target.querySelector('button[type="submit"]');
    const errorDisplay = document.getElementById('quote-error');

    // Reset state
    // lastQuoteDetails = null; // REMOVED: Not needed
     if(errorDisplay) errorDisplay.textContent = '';

    // Gather form data
    const formData = {
        action: 'getQuote', // Action added correctly
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
        return;
    }

     if(submitButton) {
        submitButton.disabled = true; submitButton.dataset.originalText = submitButton.innerText; submitButton.innerText = 'Searching...';
    }

    await submitQuoteRequest(formData); // Use quote-specific function name

    // Button state restored in submitQuoteRequest's finally block
}

// REMOVED: handleBookingSubmit function

// --- Reusable Fetch Function for QUOTES ONLY ---
async function submitQuoteRequest(data) {
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
    const bookNowBtn = document.getElementById('book-now-btn'); // Still needed to show/hide
    const clearFormBtn = document.getElementById('clear-form-btn');
    const activeSubmitButton = data.type === 'one-way' ? document.querySelector('#one-way-form button[type="submit"]') : document.querySelector('#by-the-hour-form button[type="submit"]');

     // Check if elements exist
     if ( /* ... element checks ... */ !resultsArea || !loadingIndicator || !errorDisplay || !quoteDetailsDisplay || !priceDisplay || !distanceDisplay || !durationDisplay || !pickupTypeRow || !pickupNotesRow || !dropoffTypeRow || !dropoffNotesRow || !pickupTypeDisplay || !pickupNotesDisplay || !dropoffTypeDisplay || !dropoffNotesDisplay || !bookNowBtn || !clearFormBtn ) { console.error("UI elements missing!"); return; }

    // Show loading state
    resultsArea.style.display = 'block';
    quoteDetailsDisplay.style.display = 'none';
    loadingIndicator.style.display = 'block';
    errorDisplay.textContent = '';

    const endpoint = '/.netlify/functions/whatsapp-webhook';
    console.log(`Sending data to endpoint: ${endpoint}`);
    console.log('Data being sent:', data);

    try {
        const response = await fetch(endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) { throw new Error(result.message || `Request failed with status ${response.status}`); }

        console.log('Received response from server:', result);

        // --- Display SUCCESS results in HTML ---
        priceDisplay.textContent = result.price || 'N/A';
        distanceDisplay.textContent = result.distance || '---';
        durationDisplay.textContent = result.duration || 'N/A';
        result.isPickupAirport ? pickupTypeRow.style.display = 'flex' : pickupTypeRow.style.display = 'none';
        if(result.isPickupAirport) pickupTypeDisplay.textContent = result.pickupType ? result.pickupType.charAt(0).toUpperCase() + result.pickupType.slice(1) : 'N/A';
        result.isPickupAirport ? pickupNotesRow.style.display = 'flex' : pickupNotesRow.style.display = 'none';
        if(result.isPickupAirport) pickupNotesDisplay.textContent = result.pickupNotes || 'None';
        result.isDropoffAirport ? dropoffTypeRow.style.display = 'flex' : dropoffTypeRow.style.display = 'none';
        if(result.isDropoffAirport) dropoffTypeDisplay.textContent = result.dropoffType ? result.dropoffType.charAt(0).toUpperCase() + result.dropoffType.slice(1) : 'N/A';
        result.isDropoffAirport ? dropoffNotesRow.style.display = 'flex' : dropoffNotesRow.style.display = 'none';
        if(result.isDropoffAirport) dropoffNotesDisplay.textContent = result.dropoffNotes || 'None';

        quoteDetailsDisplay.style.display = 'block'; // Show the quote details section

    } catch (error) {
        // --- Handle ERROR response ---
        console.error(`Error submitting ${data.action} request:`, error);
        errorDisplay.textContent = error.message || `An unknown error occurred during ${data.action}.`;
        quoteDetailsDisplay.style.display = 'none';
    } finally {
        // Runs whether fetch succeeded or failed
        console.log('Fetch request finished.');
        if (loadingIndicator) loadingIndicator.style.display = 'none'; // Hide loading
        // Restore the correct Submit button state
        if (activeSubmitButton) {
             if(activeSubmitButton.dataset.originalText) {
                activeSubmitButton.disabled = false;
                activeSubmitButton.innerText = activeSubmitButton.dataset.originalText;
             } else { // Fallback if original text wasn't stored
                 activeSubmitButton.disabled = false;
                 activeSubmitButton.innerText = 'Search';
             }
        }
    }
}

// Note: initAutocomplete is called automatically by the Google Maps script callback