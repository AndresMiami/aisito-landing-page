// Import functions from the maps.js module (if this file imports from elsewhere, keep those)
// Example: import { showError } from './errorHandling.js';

// Export the function for modular use
export function initAutocomplete() {
    console.log("initAutocomplete callback fired.");

    // Check if the necessary components from the Google Maps API are loaded
    if (
        typeof google === "undefined" ||
        typeof google.maps === "undefined" ||
        typeof google.maps.places === "undefined"
        // No longer need to check for PlaceAutocompleteElement
        // typeof google.maps.places.PlaceAutocompleteElement === "undefined"
    ) {
        console.error(
            "Google Maps API or Places library not loaded correctly for initAutocomplete."
        );
        // You might want to call showError here if you have access to that function and elements
        // Example: if (typeof showError !== 'undefined' && elements && elements.bookingForm) { showError(elements, 'general', 'Maps API failed to load.'); }
        return;
    }

    // Get references to the STANDARD INPUT elements using their IDs
    const fromLocationInput = document.getElementById("from-location");
    const toAddressInput = document.getElementById("to-address");

    // Define the fields you need when a place is selected.
    const placeFields = [
        "address_components",
        "geometry",
        "name",
        "formatted_address",
        "types",
        "place_id", // Often useful to get the place ID
        // Add any other fields your application needs
    ];

    // Define Autocomplete options
    const autocompleteOptions = {
        fields: placeFields,
        types: ['geocode', 'establishment'], // Or other types as needed (e.g., address, establishment)
        componentRestrictions: { country: "us" }, // Apply country filter
        // bias: ... // You could add location biasing options here if needed
        // strictBounds: true, // Or restrict results to bounds
    };


    // Initialize Autocomplete on the STANDARD INPUT elements
    if (fromLocationInput) {
        console.log("Initializing Autocomplete on fromLocationInput.");
        // Create a new Autocomplete instance and link it to the input
        const fromAutocomplete = new google.maps.places.Autocomplete(fromLocationInput, autocompleteOptions);

        // *** MODIFIED: Add listener for the 'place_changed' event on the Autocomplete instance ***
        // This event fires when the user selects a place from the predictions dropdown
        fromAutocomplete.addListener("place_changed", () => {
            console.log("Place changed in from-location input.");
            const place = fromAutocomplete.getPlace(); // Get the selected place details
            console.log("Selected place:", place);
            // *** Your logic to handle the selected place goes here ***
            // This 'place' object contains the details you requested in placeFields
            // You would typically update other parts of your form or application based on this data.
            // Example: document.getElementById('from-address-lat').value = place.geometry.location.lat();
            // Example: document.getElementById('from-address-lng').value = place.geometry.location.lng();

             // You might also want to trigger form validation or update UI elements here
             // Example: validateForm(elements); // If validateForm is accessible here
        });

         // If you have a "Get Current Location" button for this input, ensure its logic
         // correctly populates the standard input element and clears any related errors.
         // (Your dashboard.js seems to handle this by calling getCurrentLocation)
         // The getCurrentLocation function itself also needs to set the value on the standard input.
         // Example: document.getElementById(inputId).value = geocodedAddress;
    } else {
        console.warn("From location input element not found in initAutocomplete.");
        // Handle the case where the element is not found (e.g., show an error message)
        // Example: if (typeof showError !== 'undefined' && elements && elements.bookingForm) { showError(elements, 'from-location', 'Autocomplete input not found.'); }
    }


    if (toAddressInput) {
        console.log("Initializing Autocomplete on toAddressInput.");
         // Create a new Autocomplete instance and link it to the input
        const toAutocomplete = new google.maps.places.Autocomplete(toAddressInput, autocompleteOptions);

         // *** MODIFIED: Add listener for the 'place_changed' event on the Autocomplete instance ***
         toAutocomplete.addListener("place_changed", () => {
            console.log("Place changed in to-address input.");
            const place = toAutocomplete.getPlace(); // Get the selected place details
            console.log("Selected place:", place);
            // *** Your logic to handle the selected place goes here ***
             // You might also want to trigger form validation or update UI elements here
         });
    } else {
         console.warn("To address input element not found in initAutocomplete.");
         // Handle the case where the element is not found
         // Example: if (typeof showError !== 'undefined' && elements && elements.bookingForm) { showError(elements, 'to-address', 'Autocomplete input not found.'); }
    }

    // Note: The loadGoogleMapsScript function should ensure the API script is loaded with the 'places' library
    // and the 'callback=initAutocomplete' parameter in its URL. This function is typically called once
    // when your page loads or when the DOM is ready.

    // Example of how loadGoogleMapsScript might be structured (assuming it's in this file or imported):
    /*
    export function loadGoogleMapsScript(elements) { // Pass elements if needed for error reporting
         if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
             console.log("Google Maps script already loaded.");
             return; // Script is already on the page
         }

         const script = document.createElement('script');
         const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key
         // Ensure libraries=places and callback=initAutocomplete are in the URL
         script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
         script.async = true;
         script.defer = true;
         script.onerror = () => {
             console.error("Failed to load Google Maps script.");
             // Handle the error, maybe show a message to the user
             // Example: if (typeof showError !== 'undefined' && elements && elements.bookingForm) { showError(elements, 'general', 'Failed to load maps service.'); }
         };
         document.head.appendChild(script);
         console.log("Google Maps script added to head.");
     }
    */

    // Keep the getCurrentLocation function if you are using it
    // Make sure it correctly sets the value on the standard input element by its ID
    /*
    export function getCurrentLocation(inputId, elements) {
         console.log("Attempting to get current location for input:", inputId);
         if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(
                 async (position) => {
                     const pos = {
                         lat: position.coords.latitude,
                         lng: position.coords.longitude,
                     };
                     console.log("Geolocation successful:", pos);

                     // Use Google Geocoding service to get an address from coordinates
                     const geocoder = new google.maps.Geocoder();
                     geocoder.geocode({ location: pos }, (results, status) => {
                         if (status === "OK" && results[0]) {
                             const address = results[0].formatted_address;
                             console.log("Geocoded address:", address);
                             // Set the geocoded address on the standard input element
                             const inputElement = document.getElementById(inputId);
                             if (inputElement) {
                                 inputElement.value = address;
                                 console.log("Input value set to geocoded address.");
                                 // Trigger an input event if necessary for your form logic/validation
                                 // inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                             } else {
                                 console.warn("Target input element not found for geolocation result.");
                             }
                              // Clear any general error message related to getting location
                              // if (typeof clearError !== 'undefined') { clearError('general'); }

                         } else {
                             console.error("Geocoder failed due to: " + status);
                             // Show an error message to the user
                             // if (typeof showError !== 'undefined' && elements && elements.bookingForm) { showError(elements, inputId || 'general', 'Could not geocode location.'); }
                         }
                     });
                      // Clear any button-specific error message
                      // if (typeof clearError !== 'undefined') { clearError('get-location-button'); }
                 },
                 (error) => {
                     console.error("Geolocation failed due to: " + error.message);
                     // Show an error message to the user
                      // if (typeof showError !== 'undefined' && elements && elements.bookingForm) { showError(elements, inputId || 'general', 'Geolocation denied or failed.'); }
                      // if (typeof clearError !== 'undefined') { clearError('get-location-button'); } // Clear the button error specifically
                 }
             );
         } else {
             // Browser doesn't support Geolocation
             console.error("Browser doesn't support Geolocation");
              // if (typeof showError !== 'undefined' && elements && elements.bookingForm) { showError(elements, inputId || 'general', 'Your browser does not support Geolocation.'); }
              // if (typeof clearError !== 'undefined') { clearError('get-location-button'); }
         }
     }
    */

    // If you import showError from errorHandling.js and use it in this file,
    // ensure you have access to the elements object where showError might need it,
    // or modify showError to not strictly require the elements object for all cases.
    // Example: import { showError, clearError } from './errorHandling.js';
}

// Make it globally accessible for the Google Maps API callback
window.initAutocomplete = initAutocomplete;

// Note: The window.initAutocomplete assignment in dashboard.js
// makes the function globally accessible for the Google Maps API callback.