// maps.js
// This module handles the loading of the Google Maps API,
// initialization of the Places Autocomplete service,
// and related location-based functionalities like Geolocation.

// Import getElementRefs from dashboard.js
import { getElementRefs } from './dashboard.js';
// Import showError from the errorHandling.js module
import { showError } from './errorHandling.js';


// --- Helper Functions (related to Maps/Location) ---

// Toggles the visibility of airport-related fields (like flight number, baggage claim notes)
// based on whether a location is identified as an airport.
function updateAirportFieldVisibility(addressInputId, isAirport, elements) {
    let typeContainerId, notesContainerId, hiddenInputId;
    let typeInput, notesInput;
    console.log(`Updating airport fields for ${addressInputId}. Is Airport: ${isAirport}`);

    if (addressInputId === "from-location") {
        const activePanelId = document.querySelector(".tab-panel:not(.hidden)")?.id;
        if (activePanelId === "panel-oneway") {
            typeContainerId = "pickup-type-container"; // Ensure these IDs match your HTML structure
            notesContainerId = "pickup-notes-container"; // Ensure these IDs match your HTML structure
            hiddenInputId = "isPickupAirportOneWay"; // Ensure these IDs match your HTML structure
            typeInput = document.getElementById("pickup-type"); // Ensure these IDs match your HTML structure
            notesInput = document.getElementById("pickup-notes"); // Ensure these IDs match your HTML structure
        } else if (activePanelId === "panel-experience-plus") {
            typeContainerId = "pickup-type-container-hourly"; // Ensure these IDs match your HTML structure
            notesContainerId = "pickup-notes-container-hourly"; // Ensure these IDs match your HTML structure
            hiddenInputId = "isPickupAirportHourly"; // Ensure these IDs match your HTML structure
            typeInput = document.getElementById("pickup-type-hourly"); // Ensure these IDs match your HTML structure
            notesInput = document.getElementById("pickup-notes-hourly"); // Ensure these IDs match your HTML structure
        } else {
            console.warn(`No active panel found for updating airport fields for ${addressInputId}.`);
            return;
        }
    } else if (addressInputId === "to-address") {
        typeContainerId = "dropoff-type-container"; // Ensure these IDs match your HTML structure
        notesContainerId = "dropoff-notes-container"; // Ensure these IDs match your HTML structure
        hiddenInputId = "isDropoffAirportOneWay"; // Ensure these IDs match your HTML structure
        typeInput = document.getElementById("dropoff-type"); // Ensure these IDs match your HTML structure
        notesInput = document.getElementById("dropoff-notes"); // Ensure these IDs match your HTML structure
    } else {
        console.warn(`Unknown address input ID (${addressInputId}) for airport fields visibility update.`);
        return;
    }

    const typeContainer = document.getElementById(typeContainerId);
    const notesContainer = document.getElementById(notesContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);

    if (!typeContainer || !notesContainer) {
        console.warn(`Airport-related elements (e.g., #${typeContainerId}) not found for ${addressInputId}. Skipping visibility update.`);
        return;
    }

    if (isAirport) {
        typeContainer.classList.remove("hidden");
        notesContainer.classList.remove("hidden");
        if (hiddenInput) hiddenInput.value = "true";
    } else {
        typeContainer.classList.add("hidden");
        notesContainer.classList.add("hidden");
        if (hiddenInput) hiddenInput.value = "false";
        if (typeInput) typeInput.selectedIndex = 0;
        if (notesInput) notesInput.value = "";
    }
}

// Attempts to get the user's current geographical location using the browser's Geolocation API
export async function getCurrentLocation(inputId, elements) { // Exported here
    console.log(`getCurrentLocation called for input: ${inputId} at ${new Date().toISOString()}`);
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        console.warn("Geolocation not supported by browser.");
        return;
    }

    if (typeof google === "undefined" || typeof google.maps === "undefined" || typeof google.maps.Geocoder === "undefined") {
        console.error("Google Maps API or Geocoding service not loaded. Cannot geocode location.");
        alert("Mapping service is not available to find address.");
        return;
    }

    // Note: getCurrentPosition is asynchronous
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };

        try {
            const response = await new Promise((resolve, reject) => {
                geocoder.geocode({ location: latlng }, (results, status) => {
                    if (status === "OK" && results[0]) {
                        resolve(results);
                    } else {
                        reject(new Error(`Geocoding failed with status: ${status}`));
                    }
                });
            });
            const address = response[0].formatted_address;
            // Target the underlying input element within the gmp-place-autocomplete
            const placeAutocompleteElement = document.getElementById(inputId);
             // Ensure the element is the new type
            if (placeAutocompleteElement instanceof google.maps.places.PlaceAutocompleteElement) {
                // Set the address value on the element, which updates the internal input
                placeAutocompleteElement.value = address;

                // Geolocation doesn't typically return airport types,
                // so we assume it's not an airport location for this scenario.
                if (document.getElementById("pickup-type-container") || document.getElementById("dropoff-type-container")) {
                    updateAirportFieldVisibility(inputId, false, elements);
                }
                 // Optional: You might want to trigger a 'gmp-placeselect' like behavior
                 // if setting the value programmatically should behave like a user selecting a place.
                 // However, the element's value setter usually just updates the text field.
                 // For full place details, you might need to perform a separate Place Details request
                 // using the formatted_address if needed elsewhere, but for just setting the text
                 // and hiding airport fields, setting the value is sufficient here.

            } else {
                console.error(`Input field "${inputId}" not found or is not a PlaceAutocompleteElement in the DOM.`);
            }
        } catch (error) {
            console.error("Error geocoding location:", error);
            // Use the imported showError function
            showError(elements, inputId, `Unable to retrieve address: ${error.message}`);
        }
    }, (error) => {
        console.error("Geolocation error:", error);
        // Use the imported showError function
        showError(elements, inputId, "Unable to retrieve your location.");
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
}

// Dynamically loads the Google Maps API script
export async function loadGoogleMapsScript(elements) { // Exported here
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
        console.log("Google Maps script tag already exists. Skipping loading.");
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/get-maps-key');
        const data = await response.json();
        const apiKey = data.apiKey;

        if (!apiKey) {
            throw new Error("API key not received from Netlify function.");
        }

        const script = document.createElement('script');
        script.id = "google-maps-script";
        // Ensure the 'places' library is requested
        // The 'callback=initAutocomplete' is still used to signal when the script is loaded and initAutocomplete should run
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
        script.async = true;
        script.defer = true; // Using defer is generally good practice

        script.onload = () => {
            console.log("Google Maps API script loaded successfully.");
        };

        script.onerror = () => {
            console.error("Google Maps Script Load Error.");
            // Use the imported showError function
            showError(elements, "from-location", "Address lookup service failed to load.");
            showError(elements, "to-address", "Address lookup service failed to load.");
        };

        document.head.appendChild(script);
    } catch (error) {
        console.error("Error during Google Maps Script Loading Process:", error);
        // Use the imported showError function
        showError(elements, "from-location", `Map service error: ${error.message}`);
        showError(elements, "to-address", `Map service error: ${error.message}`);
    }
}

// Google Maps Autocomplete Callback
// This function is called by the Google Maps API script once it's loaded
export function initAutocomplete() { // Exported here
    console.log("initAutocomplete callback fired.");
    // Check if the necessary components from the Google Maps API are loaded
    if (typeof google === "undefined" || typeof google.maps === "undefined" || typeof google.maps.places === "undefined" || typeof google.maps.places.PlaceAutocompleteElement === "undefined") {
        console.error("Google Maps API, Places library, or PlaceAutocompleteElement not loaded correctly for initAutocomplete.");
        return;
    }

    // Get references to the new <gmp-place-autocomplete> elements
    const fromLocationElement = document.getElementById("from-location");
    const toAddressElement = document.getElementById("to-address");

    // Define the fields you need when a place is selected.
    // This is done when fetching details *after* a selection, not on initialization.
     const placeFields = ["address_components", "geometry", "name", "formatted_address", "types"];


    if (fromLocationElement instanceof google.maps.places.PlaceAutocompleteElement) {
        console.log("Configuring fromLocationElement.");
        // Configure the element properties using setAttribute for attributes
        // or setting properties directly where supported (like locationBias).
        // componentRestrictions is not supported directly as a property or attribute.
        // Use address-filter attribute for country restriction.
        fromLocationElement.setAttribute("address-filter", "country:us");

        // Add the event listener for when a place is selected from the autocomplete suggestions.
        fromLocationElement.addEventListener("gmp-placeselect", async (event) => {
            console.log("Place selected in from-location.");
            // The event.placePrediction property holds a PlacePrediction object.
            const placePrediction = event.placePrediction;
            if (!placePrediction) {
                console.warn("Autocomplete selected but no place prediction available.");
                return;
            }

             try {
                 // Fetch the full Place object with the required fields using the prediction's place ID.
                const place = await placePrediction.toPlace().fetchFields({
                    fields: placeFields, // Specify the fields you need
                });

                console.log("Fetched Place details for from-location:", place);
                const elements = getElementRefs(); // Get element references when needed

                 // Now 'place' is a full Place object. You can access its properties.
                // Update airport field visibility based on the fetched place types.
                if (document.getElementById("pickup-type-container") || document.getElementById("pickup-notes-container")) {
                    updateAirportFieldVisibility("from-location", !!(place && place.types && place.types.includes("airport")), elements);
                }
                 // You might also want to update the form's internal value or state
                 // with the formatted address from the place object here,
                 // although the element itself manages the text input.
                 // elements.fromLocationInput.value = place.formattedAddress; // Example if you still needed the original input value
            } catch (error) {
                console.error("Error fetching place details for from-location:", error);
                 const elements = getElementRefs();
                 showError(elements, "from-location", "Could not retrieve place details for selected location.");
            }
        });
    } else {
         console.warn("From location element with ID 'from-location' not found or is not a PlaceAutocompleteElement after Maps API loaded.");
    }


     if (toAddressElement instanceof google.maps.places.PlaceAutocompleteElement) {
         console.log("Configuring toAddressElement.");
         // Configure the element properties.
         toAddressElement.setAttribute("address-filter", "country:us");

         toAddressElement.addEventListener("gmp-placeselect", async (event) => {
             console.log("Place selected in to-address.");
            const placePrediction = event.placePrediction;
            if (!placePrediction) {
                console.warn("Autocomplete selected but no place prediction available.");
                return;
            }

             try {
                 // Fetch the full Place object
                const place = await placePrediction.toPlace().fetchFields({
                    fields: placeFields, // Specify the fields you need
                });

                console.log("Fetched Place details for to-address:", place);
                const elements = getElementRefs(); // Get element references when needed

                 // Update airport field visibility based on the fetched place types.
                if (document.getElementById("dropoff-type-container") || document.getElementById("dropoff-notes-container")) {
                    updateAirportFieldVisibility("to-address", !!(place && place.types && place.types.includes("airport")), elements);
                }
                 // elements.toAddressInput.value = place.formattedAddress; // Example
             } catch (error) {
                 console.error("Error fetching place details for to-address:", error);
                 const elements = getElementRefs();
                 showError(elements, "to-address", "Could not retrieve place details for selected location.");
             }
         });
     } else {
          console.warn("To address element with ID 'to-address' not found or is not a PlaceAutocompleteElement after Maps API loaded.");
     }

     // Note: The Geolocation button listener is already in initializeEventListeners in dashboard.js
     // and calls getCurrentLocation, which has been updated to handle the new element type.
}

// Removed the duplicate export statement at the end.
// loadGoogleMapsScript, getCurrentLocation, and initAutocomplete are exported where defined.