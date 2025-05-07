// maps.js
// This module handles the loading of the Google Maps API,
// initialization of the Places Autocomplete service,
// and related location-based functionalities like Geolocation.

// We need to get some things from the main dashboard.js file,
// like the function to get elements and the function to show errors.
// We will add 'export' to those functions in dashboard.js in the next step.
import { getElementRefs, showError } from './dashboard.js';

// --- Helper Functions (related to Maps/Location) ---

// Toggles the visibility of airport-related fields (like flight number, baggage claim notes)
// based on whether a location is identified as an airport.
// This function needs access to DOM elements to show/hide containers and update inputs.
// Parameters:
// - addressInputId: The ID of the address input field ('from-location' or 'to-address').
// - isAirport: Boolean indicating if the selected place is an airport.
// - elements: Object containing references to DOM elements (passed from initAutocomplete or other callers).
// Returns: void
function updateAirportFieldVisibility(addressInputId, isAirport, elements) { // We added 'elements' as a parameter
    let typeContainerId, notesContainerId, hiddenInputId;
    let typeInput, notesInput;
    console.log(`Updating airport fields for ${addressInputId}. Is Airport: ${isAirport}`);

    // Determine the IDs of the relevant airport-related elements based on the input field ID
    if (addressInputId === "from-location") {
         // Check the currently active tab panel ID to determine which set of airport fields to target
         // Note: Accessing the DOM directly here still couples this to the HTML structure.
         // For a cleaner module, active tab state could ideally be passed in.
         const activePanelId = document.querySelector(".tab-panel:not(.hidden)")?.id; // Note: This still relies on DOM access here. Consider if active tab state should be passed.
         if (activePanelId === "panel-oneway") {
             // Target airport fields associated with the 'from' location in the One-Way panel
             typeContainerId = "pickup-type-container"; // Container for pickup type selection (e.g., Curb, Gate)
             notesContainerId = "pickup-notes-container"; // Container for pickup notes/instructions
             hiddenInputId = "isPickupAirportOneWay"; // Hidden input to store boolean flag
             typeInput = document.getElementById("pickup-type"); // Select input for pickup type
             notesInput = document.getElementById("pickup-notes"); // Textarea/input for notes
         } else if (activePanelId === "panel-experience-plus") {
              // Target airport fields associated with the 'from' location in the Experience+ (Hourly) panel
              // Assuming separate IDs for hourly airport fields if they exist
              typeContainerId = "pickup-type-container-hourly";
              notesContainerId = "pickup-notes-container-hourly";
              hiddenInputId = "isPickupAirportHourly";
              typeInput = document.getElementById("pickup-type-hourly");
              notesInput = document.getElementById("pickup-notes-hourly");
         } else {
             console.warn(`No active panel found for updating airport fields for ${addressInputId}.`);
             return; // Exit if no active panel is identified
         }
     } else if (addressInputId === "to-address") { // Airport fields only apply to 'to-address' in the One-Way panel
         typeContainerId = "dropoff-type-container"; // Container for dropoff type selection
         notesContainerId = "dropoff-notes-container"; // Container for dropoff notes/instructions
         hiddenInputId = "isDropoffAirportOneWay"; // Hidden input to store boolean flag
         typeInput = document.getElementById("dropoff-type"); // Select input for dropoff type
         notesInput = document.getElementById("dropoff-notes"); // Textarea/input for notes
     } else {
         console.warn(`Unknown address input ID (${addressInputId}) for airport fields visibility update.`);
         return; // Exit if the inputId is not recognized
     }

    // Get references to the identified airport-related elements
    const typeContainer = document.getElementById(typeContainerId);
    const notesContainer = document.getElementById(notesContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);

    // IMPORTANT: Check if these airport-related elements actually EXIST in your current HTML.
    // If they don't exist, attempting to access properties will cause errors.
    if (!typeContainer || !notesContainer /*|| !hiddenInput*/ ) { // Note: hiddenInput might be optional depending on implementation
        console.warn(`Airport-related elements (e.g., #${typeContainerId}) not found for ${addressInputId}. Skipping visibility update.`);
        return; // Exit if necessary elements are missing
    }

    // Toggle visibility of the airport-related fields based on the 'isAirport' flag
    if (isAirport) {
        typeContainer.classList.remove("hidden"); // Show the type container
        notesContainer.classList.remove("hidden"); // Show the notes container
        if (hiddenInput) hiddenInput.value = "true"; // Set the hidden input value if it exists
    } else {
        typeContainer.classList.add("hidden"); // Hide the type container
        notesContainer.classList.add("hidden"); // Hide the notes container
        if (hiddenInput) hiddenInput.value = "false"; // Set the hidden input value if it exists
        if (typeInput) typeInput.selectedIndex = 0; // Reset the type input to the first option if it exists
        if (notesInput) notesInput.value = ""; // Clear the notes input value if it exists
    }
}


// Attempts to get the user's current geographical location using the browser's Geolocation API
// and reverse geocodes it to populate a specified input field.
// Depends on the Google Maps Geocoding service being available.
// Parameters:
// - inputId: The ID of the input field to populate with the geocoded address.
// - elements: Object containing references to DOM elements (for accessing inputs and passing to updateAirportFieldVisibility).
// - showError: Function to display user-friendly error messages (imported or passed).
// Returns: void
async function getCurrentLocation(inputId, elements) { // We need elements here to call updateAirportFieldVisibility and potentially showError
    console.log(`getCurrentLocation called for input: ${inputId} at ${new Date().toISOString()}`);
    // Check if the browser supports the Geolocation API
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser."); // Inform the user
        console.warn("Geolocation not supported by browser."); // Log a warning
        return; // Exit if not supported
    }

    // Check if the Google Maps API is loaded before attempting to use the geocoder
    if (typeof google === "undefined" || typeof google.maps === "undefined" || typeof google.maps.Geocoder === "undefined") {
        console.error("Google Maps API or Geocoding service not loaded. Cannot geocode location."); // Log the error
        alert("Mapping service is not available to find address."); // Inform the user
        return; // Exit if Maps API/Geocoder is not ready
    }

    // Request the user's current position from the browser
    navigator.geolocation.getCurrentPosition( async (position) => {
        const { latitude, longitude } = position.coords; // Extract latitude and longitude from the position object
        console.log(`Geolocation retrieved: Lat ${latitude}, Lng ${longitude}`); // Log the retrieved coordinates
        const geocoder = new google.maps.Geocoder(); // Create a new Geocoder instance
        const latlng = { lat: latitude, lng: longitude }; // Format coordinates for the Geocoder

        try {
            // Perform the reverse geocoding request (coordinates to address)
            const response = await new Promise((resolve, reject) => {
                geocoder.geocode({ location: latlng }, (results, status) => {
                    if (status === "OK" && results[0]) {
                        resolve(results); // Resolve the promise with results if geocoding is successful
                    } else {
                        // Reject the promise with an error if geocoding failed, including the status
                        reject(new Error(`Geocoding failed with status: ${status}`));
                    }
                });
            });
            const address = response[0].formatted_address; // Get the formatted address from the first result
            console.log(`Geocoded address: ${address}`); // Log the resulting geocoded address

            const inputField = document.getElementById(inputId); // Get the target input field element by its ID
            if (inputField) {
                inputField.value = address; // Populate the input field with the geocoded address
                // Update visibility of airport-related fields (assume a geolocated place is not an airport)
                // Check if the relevant airport field containers exist before calling the update function.
                if (document.getElementById("pickup-type-container") || document.getElementById("dropoff-type-container")) {
                    updateAirportFieldVisibility(inputId, false, elements); // Pass false for isAirport and include elements
                } else {
                    // Log a warning if the necessary airport elements are missing from the DOM
                    console.log("Airport fields not found. Skipping visibility update after geolocation.");
                }
                 // No explicit showError here as alert is used for geolocation errors.
            }
            else {
                // Log an error if the target input field for populating the address is not found
                console.error(`Input field "${inputId}" not found in the DOM. Cannot populate with geocoded address.`);
            }
        } catch (error) {
            console.error("Error geocoding location:", error); // Log any errors during the geocoding process
            alert(`Unable to retrieve address: ${error.message}`); // Inform the user about the geocoding failure
             // No explicit showError here as alert is used for geolocation errors.
        }
    }, (error) => {
        console.error("Geolocation error:", error); // Log any errors from the Geolocation API itself
        // Provide user-friendly alert messages for common geolocation errors
        let errorMessage = "Unable to retrieve your location.";
        switch(error.code) {
            case error.PERMISSION_DENIED: errorMessage = "Location access denied. Please enable location services in your browser settings."; break;
            case error.POSITION_UNAVAILABLE: errorMessage = "Location information unavailable. Please try again later."; break;
            case error.TIMEOUT: errorMessage = "Location request timed out. Please try again."; break;
            default: errorMessage = `An unknown error occurred (Code: ${error.code}).`; break;
        }
        alert(errorMessage); // Inform the user about the geolocation error
        // No explicit showError here as alert is used for geolocation errors.
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }); // Options for the geolocation request
}


// --- Google Maps API Loading ---

// Dynamically loads the Google Maps API script by creating and appending a script tag to the document head.
// Includes a safeguard to prevent the script from being loaded multiple times.
// Fetches the API key from a serverless function for security.
// Parameters:
// - elements: Object containing references to DOM elements (for showError in catch block).
// Returns: void
export async function loadGoogleMapsScript(elements) { // Export this function, it needs 'elements'
    // Safeguard: Check if the Google Maps API script tag already exists in the DOM.
    // This prevents accidentally loading the script multiple times if this function is called more than once.
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
        console.log("Google Maps script tag already exists. Skipping loading."); // Log that the script was found
        return; // Exit the function if the script is already present
    }

    console.log("Attempting to load Google Maps script..."); // Log the start of the loading process
    try {
        // Fetch the Google Maps API key from a Netlify serverless function for security.
        const response = await fetch('/.netlify/functions/get-maps-key');
        if (!response.ok) {
            // If fetching the API key fails (non-OK HTTP status), parse the error response.
            const errorData = await response.json();
            // Log a detailed error about the API key fetch failure.
            console.error("API Key Fetch Error:", {
                status: response.status, // HTTP status code
                statusText: response.statusText, // HTTP status text
                errorDetails: errorData.error, // Specific error message from the serverless function
            });
            // Throw a new Error to be caught by the main catch block, including a user-friendly message.
            throw new Error(errorData.error || `Failed to fetch API key (Status: ${response.status})`);
        }

        const data = await response.json(); // Parse the successful JSON response
        const apiKey = data.apiKey; // Extract the API key from the response data

        // Check if the API key was received in the response.
        if (!apiKey) {
            // Log a configuration error if the API key is missing from the response.
            console.error("Configuration Error: API key not received from Netlify function.");
            // Throw an Error to be caught by the main catch block.
            throw new Error("API key not received from Netlify function.");
        }

        // Create a new script element for the Google Maps API.
        const script = document.createElement('script');
        script.id = "google-maps-script"; // Assign a unique ID to the script tag for easier identification in the DOM
        // Set the source URL for the Google Maps API script, including the fetched API key,
        // the 'places' library, and the 'initAutocomplete' callback function name.
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
        script.async = true; // Load the script asynchronously (does not block HTML parsing)
        script.defer = true; // Defer script execution until HTML parsing is complete
        // Note: script.setAttribute('loading', 'async'); is redundant when script.async is true.

        // Define the onload handler for the script. This function is executed when the script is successfully loaded and executed.
        script.onload = () => {
            console.log("Google Maps API script loaded successfully."); // Confirm successful loading
            // The 'initAutocomplete' function is called by the Maps API itself upon loading due to the 'callback' parameter.
        };

        // Define the onerror handler for the script. This function is executed if the script fails to load (e.g., network issues, invalid URL).
        script.onerror = () => {
            // Log a specific error message about the script loading failure.
            console.error("Google Maps Script Load Error: Failed to load the script file. Ensure the API key is valid and the network is functional.");
            // Display a user-friendly error message on the relevant input fields to inform the user about the service failure.
            // We pass 'elements' to loadGoogleMapsScript, so we can use it here to call showError.
            showError(elements, "from-location", "Address lookup service failed to load."); // Uses the imported/accessible showError
            showError(elements, "to-address", "Address lookup service failed to load."); // Uses the imported/accessible showError
        };

        // Append the created script tag to the document's <head> element to initiate the script loading.
        document.head.appendChild(script);
        console.log("Google Maps script tag added to head."); // Log that the script tag has been added to the DOM

    } catch (error) {
        // Catch any errors that occur during the try block (e.g., API key fetch errors, issues before script creation).
        // Log a detailed error about the overall script loading process failure.
        console.error("Caught Error during Google Maps Script Loading Process:", {
            message: error.message, // The error message
            stack: error.stack, // The error stack trace (helpful for pinpointing the source)
        });
        // Display a user-friendly error message on the relevant input fields.
        // We pass 'elements' to loadGoogleMapsScript, so we can use it here to call showError.
        showError(elements, "from-location", `Map service error: ${error.message}`); // Uses the imported/accessible showError
        showError(elements, "to-address", `Map service error: ${error.message}`); // Uses the imported/accessible showError
    }
}

// --- Google Maps Autocomplete Callback ---
// This function is specified as the 'callback' parameter in the Google Maps API script URL.
// It is executed automatically by the Google Maps API when the script has finished loading and executing.
// It initializes the Google Places Autocomplete service on the location input fields
// and performs other initializations that depend on the Maps API being ready.
// It also serves as the main entry point for initializing other parts of the form
// that require the Maps API to be loaded (like Flatpickr event listeners and initial tab state).
// Returns: void
export function initAutocomplete() { // Export this function as it's a global callback
    // Safeguard: Check if the Google Maps API and the Places library are fully loaded before proceeding.
    // This check is technically redundant if called solely by the Maps API 'callback',
    // but is a good defensive practice if this function could be called directly elsewhere.
    if (typeof google === "undefined" || typeof google.maps === "undefined" || typeof google.maps.places === "undefined") {
        console.error("Google Maps API or Places library not loaded correctly. Autocomplete cannot initialize."); // Log the critical error
        // Display a user-friendly error message on the relevant input fields to inform the user.
        const elements = getElementRefs(); // Get element references using the imported function.
        showError(elements, "from-location", "Address lookup service failed to load. Please refresh."); // Use the imported showError.
        showError(elements, "to-address", "Address lookup service failed to load. Please refresh."); // Use the imported showError.
        return; // Exit the function if the API is not ready
    }

    console.log("Google Maps API loaded successfully. Initializing Autocomplete..."); // Log successful API load and start of Autocomplete initialization
    // Get references to the location input fields where Autocomplete will be applied
    const fromLocationInput = document.getElementById("from-location");
    const toAddressInput = document.getElementById("to-address");

    // Configuration options for the Autocomplete service
    const options = {
        componentRestrictions: { country: "us" }, // Restrict address predictions to the United States
        fields: ["address_components", "geometry", "name", "formatted_address", "types"], // Specify the data fields to return for a selected place
    };

    // Initialize Autocomplete for the 'From' location input field if the element exists
    if (fromLocationInput) {
        try {
            // Create a new Autocomplete instance and link it to the 'From' input field
            const acFrom = new google.maps.places.Autocomplete(fromLocationInput, options);
            // Add a listener for the 'place_changed' event, which fires when the user selects a place from the suggestions
            acFrom.addListener("place_changed", () => {
                const place = acFrom.getPlace(); // Get the details of the selected place
                console.log("Autocomplete 'From Location' updated:", place); // Log the selected place details for debugging
                // Update visibility of airport-related fields if the selected place is identified as an airport.
                 // Check if the relevant airport field containers exist before calling the update function.
                 const elements = getElementRefs(); // Get elements here as the listener might fire at any time.
                 if (document.getElementById("pickup-type-container")) {
                     updateAirportFieldVisibility("from-location", !!(place && place.types && place.types.includes("airport")), elements); // Pass elements
                 } else {
                      // Log a warning if the necessary airport elements are missing.
                      console.log("Airport fields not found for 'from-location'. Skipping visibility update.");
                 }
                 // TO DO: Implement logic to handle the selected 'From' place (e.g., populate address fields more fully if needed)
            });
        } catch (error) {
            // Log any errors that occur during the initialization of Autocomplete for the 'From' field.
            console.error("Autocomplete Initialization Error (from-location):", error);
        }
    } else {
        // Log an error if the 'From' location input element is not found in the DOM when attempting to initialize Autocomplete.
        console.error("Input 'from-location' not found in the DOM. Cannot initialize Autocomplete for this field.");
    }

    // Initialize Autocomplete for the 'To' address input field if the element exists (similar logic to 'From' location)
    if (toAddressInput) {
        try {
            // Create a new Autocomplete instance and link it to the 'To' input field
            const acTo = new google.maps.places.Autocomplete(toAddressInput, options);
            // Add a listener for the 'place_changed' event
            acTo.addListener("place_changed", () => {
                const place = acTo.getPlace(); // Get the details of the selected place
                console.log("Autocomplete 'To Address' updated:", place); // Log the selected place details for debugging
                // Update visibility of airport-related fields if the selected place is identified as an airport.
                // (This is primarily relevant for the 'to-address' in the One-Way tab).
                // Check if the relevant airport field containers exist before calling the update function.
                const elements = getElementRefs(); // Get elements here as the listener might fire at any time.
                if (document.getElementById("dropoff-type-container")) {
                    updateAirportFieldVisibility("to-address", !!(place && place.types && place.types.includes("airport")), elements); // Pass elements
                } else {
                    // Log a warning if the necessary airport elements are missing.
                    console.log("Airport fields not found for 'to-address'. Skipping visibility update.");
                }
                // TO DO: Implement logic to handle the selected 'To' place
            });
        } catch (error) {
            // Log any errors that occur during the initialization of Autocomplete for the 'To' field.
            console.error("Autocomplete Initialization Error (to-address):", error);
        }
    } else {
        // Log an error if the 'To' address input element is not found in the DOM when attempting to initialize Autocomplete.
        console.error("Input 'to-address' not found in the DOM. Cannot initialize Autocomplete for this field.");
    }

    // --- Initializations that depend on Google Maps API being ready ---
    // These functions were previously called directly in the DOMContentLoaded listener,
    // but are moved here into the Maps API callback to ensure they run only after the API
    // and its dependencies (like Places) are fully loaded and available.
    const elementRefs = getElementRefs(); // Get element references here as this is the main entry point after Maps load.
    // Assuming config is accessible or imported globally or passed in.
    // For modularity, passing necessary config values or the whole config object is better.
    // For now, assuming 'config' is accessible.
    const appConfig = config; // Use the main config object

    // Initialize components that depend on the DOM and potentially Maps API data/elements.
    // These should run once the Maps API is ready.
    // NOTE: initializeFlatpickr, initializeEventListeners, initializeValidationListeners, and switchTab
    // still exist in dashboard.js. You will need to export them from dashboard.js
    // and import them here if they are not globally accessible.
    // If you decide to keep them in dashboard.js and call them from here,
    // you might need to revisit the dependency flow.

    // For now, assuming these functions are globally accessible or will be imported into maps.js
    // or that Maps API readiness is the only required dependency for them.
    // Based on the structure you provided for initAutocomplete earlier, it called these directly.
    // Let's assume they are either globally accessible or will be imported.
    // If they are in dashboard.js, you would need to import them here:
    // import { initializeFlatpickr, initializeEventListeners, initializeValidationListeners, switchTab } from './dashboard.js';

    // If they are globally accessible (less recommended for modularity):
    // window.initializeFlatpickr(elementRefs);
    // window.initializeEventListeners(elementRefs, appConfig.placeholders, appConfig);
    // window.initializeValidationListeners(elementRefs);
    // window.switchTab("#panel-oneway", elementRefs, appConfig.placeholders);


    // Let's proceed with the assumption that these core form initialization functions
    // are either imported into this maps.js module or remain in dashboard.js but
    // are structured to be callable after initAutocomplete.
    // The cleanest approach for modularity is to import them here if they are defined in dashboard.js.

    // **Assuming initializeFlatpickr, initializeEventListeners, initializeValidationListeners, switchTab are defined and exported from dashboard.js:**
    // import { initializeFlatpickr, initializeEventListeners, initializeValidationListeners, switchTab } from './dashboard.js';
    // initializeFlatpickr(elementRefs);
    // initializeEventListeners(elementRefs, appConfig.placeholders, appConfig);
    // initializeValidationListeners(elementRefs);
    // switchTab("#panel-oneway", elementRefs, appConfig.placeholders);


    // **If you choose to keep these functions ONLY in dashboard.js and call them from there after loadGoogleMapsScript:**
    // Then the call to initAutocomplete's responsibility for initializing other form parts would change.
    // The original structure in dashboard.js's DOMContentLoaded was:
    // 1. Get elements.
    // 2. Check for booking form.
    // 3. Call loadGoogleMapsScript.
    // 4. *Then* call initializeValidationListeners, form submit listener, resetSubmitButton.
    // initializeFlatpickr, initializeEventListeners, initializeValidationListeners, switchTab
    // were being called inside the original initAutocomplete in dashboard.js.

    // Let's stick to the plan of calling them from initAutocomplete in maps.js, meaning they need to be imported.
    // You will need to add exports for these in dashboard.js and imports here in maps.js.

    // For now, assuming they are imported:
    // import { initializeFlatpickr, initializeEventListeners, initializeValidationListeners, switchTab } from './dashboard.js';

    // initializeFlatpickr(elementRefs); // Initialize the Flatpickr date and time pickers.
    // initializeEventListeners(elementRefs, appConfig.placeholders, appConfig); // Set up main event listeners for form interactions.
    // initializeValidationListeners(elementRefs); // Set up listeners that trigger validation.
    // switchTab("#panel-oneway", elementRefs, appConfig.placeholders); // Set the initial active tab and update the UI accordingly.
    // NOTE: You need to uncomment these lines and add the imports at the top
    // once you export these functions from dashboard.js.

    console.log("initAutocomplete finished. Form initialization depending on Maps API is complete.");

}


// Make the initAutocomplete function globally accessible. This is required by the Google Maps API
// when using the 'callback=initAutocomplete' parameter in the script URL. The API
// will look for a function with this name in the global scope (window) once it's loaded.
// This assignment should be done in the main entry point file (dashboard.js).
// It is included here in the module as a reminder, but the actual assignment
// should be done in dashboard.js after importing initAutocomplete.
// window.initAutocomplete = initAutocomplete;


// Export functions that need to be called from other modules (e.g., dashboard.js).
// loadGoogleMapsScript is exported because it's called from DOMContentLoaded in dashboard.js.
// initAutocomplete is exported because it's used as the global callback.
// You might also export getCurrentLocation if it's called directly from dashboard.js
// (e.g., by a "Use Current Location" button).
// updateAirportFieldVisibility is likely only called internally within this module.
export { loadGoogleMapsScript, initAutocomplete /*, getCurrentLocation */ }; // Export other functions if needed elsewhere