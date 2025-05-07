// maps.js
// This module handles the loading of the Google Maps API,
// initialization of the Places Autocomplete service,
// and related location-based functionalities like Geolocation.

import { getElementRefs, showError } from './dashboard.js';

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
            typeContainerId = "pickup-type-container";
            notesContainerId = "pickup-notes-container";
            hiddenInputId = "isPickupAirportOneWay";
            typeInput = document.getElementById("pickup-type");
            notesInput = document.getElementById("pickup-notes");
        } else if (activePanelId === "panel-experience-plus") {
            typeContainerId = "pickup-type-container-hourly";
            notesContainerId = "pickup-notes-container-hourly";
            hiddenInputId = "isPickupAirportHourly";
            typeInput = document.getElementById("pickup-type-hourly");
            notesInput = document.getElementById("pickup-notes-hourly");
        } else {
            console.warn(`No active panel found for updating airport fields for ${addressInputId}.`);
            return;
        }
    } else if (addressInputId === "to-address") {
        typeContainerId = "dropoff-type-container";
        notesContainerId = "dropoff-notes-container";
        hiddenInputId = "isDropoffAirportOneWay";
        typeInput = document.getElementById("dropoff-type");
        notesInput = document.getElementById("dropoff-notes");
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
async function getCurrentLocation(inputId, elements) {
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
            const inputField = document.getElementById(inputId);
            if (inputField) {
                inputField.value = address;
                if (document.getElementById("pickup-type-container") || document.getElementById("dropoff-type-container")) {
                    updateAirportFieldVisibility(inputId, false, elements);
                }
            } else {
                console.error(`Input field "${inputId}" not found in the DOM.`);
            }
        } catch (error) {
            console.error("Error geocoding location:", error);
            alert(`Unable to retrieve address: ${error.message}`);
        }
    }, (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location.");
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
}

// Dynamically loads the Google Maps API script
export async function loadGoogleMapsScript(elements) {
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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            console.log("Google Maps API script loaded successfully.");
        };

        script.onerror = () => {
            console.error("Google Maps Script Load Error.");
            showError(elements, "from-location", "Address lookup service failed to load.");
            showError(elements, "to-address", "Address lookup service failed to load.");
        };

        document.head.appendChild(script);
    } catch (error) {
        console.error("Error during Google Maps Script Loading Process:", error);
        showError(elements, "from-location", `Map service error: ${error.message}`);
        showError(elements, "to-address", `Map service error: ${error.message}`);
    }
}

// Google Maps Autocomplete Callback
export function initAutocomplete() {
    if (typeof google === "undefined" || typeof google.maps === "undefined" || typeof google.maps.places === "undefined") {
        console.error("Google Maps API or Places library not loaded correctly.");
        return;
    }

    const fromLocationInput = document.getElementById("from-location");
    const toAddressInput = document.getElementById("to-address");

    const options = {
        componentRestrictions: { country: "us" },
        fields: ["address_components", "geometry", "name", "formatted_address", "types"],
    };

    if (fromLocationInput) {
        const acFrom = new google.maps.places.Autocomplete(fromLocationInput, options);
        acFrom.addListener("place_changed", () => {
            const place = acFrom.getPlace();
            const elements = getElementRefs();
            if (document.getElementById("pickup-type-container")) {
                updateAirportFieldVisibility("from-location", !!(place && place.types && place.types.includes("airport")), elements);
            }
        });
    }

     if (toAddressInput) {
        const acTo = new google.maps.places.Autocomplete(toAddressInput, options);
        acTo.addListener("place_changed", () => {
            const place = acTo.getPlace();
            const elements = getElementRefs();
            if (document.getElementById("dropoff-type-container")) {
                updateAirportFieldVisibility("to-address", !!(place && place.types && place.types.includes("airport")), elements);
            }
        });
    }
}

export { loadGoogleMapsScript, initAutocomplete, getCurrentLocation };

