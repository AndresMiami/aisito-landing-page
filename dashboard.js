// dashboard.js (Modified)

// --- Global variables ---
// (Keep your existing map-related globals if needed elsewhere,
// otherwise they might not be necessary for just the form logic shown here)
// let map;
// let directionsService;
// let directionsRenderer;

// --- Configuration (from generated code) ---
const config = {
    // FORM_ENDPOINT: "https://formspree.io/your-endpoint", // Keep commented out unless switching to Formspree
    MAX_NOTES_LENGTH: 500, // Example, adjust if needed
    placeholders: {
      oneWay: "Optional: Add flight number, luggage details, or specific instructions...",
      hourly: "Optional: Describe your ideal route, planned stops, music/AC preferences...",
      experience: "Optional: Any special interests or requests for this experience?",
      defaultExp: "Optional notes or preferences..."
    }
  };
  
  // --- Element References (Combined & Updated) ---
  function getElementRefs() {
      const refs = {};
      // Form and Tabs (Keep relevant ones from your original)
      refs.bookingForm = document.getElementById("booking-form"); // Assuming main form ID
      refs.tabNavigationContainer = document.getElementById("tab-navigation");
      refs.tabNavigationButtons = refs.tabNavigationContainer?.querySelectorAll(".tab-button");
      refs.formTabPanels = refs.bookingForm?.querySelectorAll(".tab-panel");
  
      // One-Way Elements
      refs.oneWayPanel = document.getElementById("panel-oneway");
      refs.fromLocationInput = document.getElementById("from-location"); // Use the main one
      refs.toAddressInput = document.getElementById("to-address"); // Use ID from HTML
      refs.oneWayPickupDateInput = document.getElementById("pickup-date-oneway");
      refs.oneWayPickupTimeInput = document.getElementById("pickup-time-oneway");
      refs.vehicleSelectionOneway = document.getElementById("vehicle-selection-oneway"); // Container for cards
      refs.bookingPreferenceInput = document.getElementById("booking-preference"); // Added for validation logic
  
      // Experience+ Elements (Add these)
      refs.experiencePlusPanel = document.getElementById("panel-experience-plus");
      refs.serviceDropdown = document.getElementById("experience-dropdown");
      refs.hourlyDescription = document.getElementById("hourly-description");
      refs.durationContainer = document.getElementById("duration-container");
      refs.durationSelect = document.getElementById("duration-hourly");
      refs.hourlyDateTimeContainer = document.getElementById("date-time-container-hourly");
      refs.hourlyPickupDateInput = document.getElementById("pickup-date-hourly");
      refs.hourlyPickupTimeInput = document.getElementById("pickup-time-hourly");
      refs.hourlyPickupTimeLabel = document.getElementById("pickup-time-label-hourly");
      refs.datePreferenceContainer = document.getElementById("date-preference-container");
      refs.experienceOptionsContainer = document.getElementById("experience-options-container");
      refs.commonExperienceFieldsContainer = document.getElementById("common-experience-fields");
      refs.experienceNameInput = document.getElementById("experience-name");
      refs.experienceGuestsInput = document.getElementById("experience-guests");
      refs.experienceEmailInput = document.getElementById("experience-email");
      refs.experiencePhoneInput = document.getElementById("experience-phone");
      refs.wynwoodNightOptions = document.getElementById("wynwood-night-options");
      refs.wynwoodDinnerPrefRadios = document.querySelectorAll("#wynwood-night-options input[name=\"dinner_style_preference\"]");
      refs.wynwoodOtherRestaurantContainer = document.getElementById("wynwood-other-restaurant-container");
      refs.wynwoodOtherDinnerRadio = document.getElementById("wynwood-dinner-other-style");
      refs.waterSkyOptions = document.getElementById("water-sky-options");
      // ... (add refs for other experience options if needed) ...
  
      // Common Elements
      refs.submitButton = document.getElementById("submit-button");
      refs.submitButtonText = refs.submitButton?.querySelector(".button-text");
      refs.submitButtonSpinner = refs.submitButton?.querySelector(".spinner");
      refs.confirmationMessage = document.getElementById("confirmation-message");
  
      // Quote Result Elements (Keep from your original if needed for quote display)
      refs.resultsArea = document.getElementById("quote-results-area");
      refs.loadingIndicator = document.getElementById("loading-indicator");
      refs.errorDisplay = document.getElementById("quote-error");
      refs.quoteDetailsDisplay = document.getElementById("quote-details");
      // ... (add other quote display refs if they exist) ...
  
      if (!refs.submitButton) {
          console.warn("Submit button (#submit-button) not found in the DOM.");
      }

      return refs;
  }
  
  // --- Initialize Flatpickr (from generated code) ---
  function initializeFlatpickr(elements) {
    // Use window.flatpickr to check if the library is globally available
    if (!window.flatpickr) {
      console.error("Flatpickr library not loaded.");
      return;
    }
    const commonDateConfig = { altInput: true, altFormat: "D, M j, Y", dateFormat: "Y-m-d", minDate: "today" };
    const commonTimeConfig = { enableTime: true, noCalendar: true, dateFormat: "H:i", altInput: true, altFormat: "h : i K", time_24hr: false, minuteIncrement: 10 };
  
    if (elements.oneWayPickupDateInput) flatpickr(elements.oneWayPickupDateInput, commonDateConfig);
    if (elements.oneWayPickupTimeInput) flatpickr(elements.oneWayPickupTimeInput, commonTimeConfig);
    if (elements.hourlyPickupDateInput) flatpickr(elements.hourlyPickupDateInput, commonDateConfig);
    if (elements.hourlyPickupTimeInput) flatpickr(elements.hourlyPickupTimeInput, commonTimeConfig);
    console.log("Flatpickr initialized.");
  }
  
  // --- Helper Functions (Error Handling, Button State - from generated code) ---
  
  function showError(elements, fieldId, message) {
    const errorSpan = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);

    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.classList.remove("hidden");
    }
    if (inputElement) {
        inputElement.classList.add("ring-red-500", "ring-1");
    }
  }

  function clearError(fieldId) {
    const errorSpan = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);

    if (errorSpan) {
        errorSpan.textContent = "";
        errorSpan.classList.add("hidden");
    }
    if (inputElement) {
        inputElement.classList.remove("ring-red-500", "ring-1");
    }
  }

  function clearAllErrors(elements) {
      const errorSpans = elements.bookingForm?.querySelectorAll("[id$=\"-error\"]");
      errorSpans?.forEach(span => { span.textContent = ""; span.classList.add("hidden"); });
      const errorInputs = elements.bookingForm?.querySelectorAll(".ring-red-500");
      errorInputs?.forEach(el => el.classList.remove("ring-red-500", "ring-1", "rounded-md", "p-1"));
      elements.bookingForm?.querySelectorAll("[aria-invalid=\"true\"]").forEach(el => el.removeAttribute("aria-invalid"));
      elements.bookingForm?.querySelectorAll("fieldset[aria-describedby]").forEach(el => el.removeAttribute("aria-describedby"));
      clearError("submit-button");
      clearError("vehicle_type_oneway");
  }
  
  function determineButtonText(elements) {
    const activeTabButton = elements.tabNavigationContainer?.querySelector(".active-tab");
    const activePanelId = activeTabButton ? activeTabButton.getAttribute("data-tab-target") : null;
    const selectedService = elements.serviceDropdown?.value || "";

    if (activePanelId === "#panel-oneway") return "Continue"; // Set "Continue" for the one-way tab
    else if (activePanelId === "#panel-experience-plus") {
        if (selectedService === "hourly_chauffeur") return "Request Hourly Service"; // For hourly chauffeur
        else if (selectedService !== "") return "Request Experience"; // For other curated experiences
        else return "Select Service"; // Default text if no service is selected
    }
    return "Submit"; // Fallback text
  }

  function resetSubmitButton(elements) {
    if (!elements || !elements.submitButton) {
        console.warn("Submit button is not initialized yet or elements object is undefined.");
        return; // Exit early if the button is not ready
    }
    elements.submitButton.disabled = false;
    if (elements.submitButtonSpinner) elements.submitButtonSpinner.classList.add("hidden");
    if (elements.submitButtonText) {
        elements.submitButtonText.textContent = determineButtonText(elements);
        elements.submitButtonText.classList.remove("hidden");
    }
  }
  
  function switchTab(targetPanelId, elements) {
    elements.formTabPanels?.forEach(panel => panel.classList.add("hidden"));
    elements.tabNavigationButtons?.forEach(button => {
        button.classList.remove("active-tab");
        button.setAttribute("aria-selected", "false");
    });

    const targetPanel = document.querySelector(targetPanelId);
    const targetButton = elements.tabNavigationContainer?.querySelector(`[data-tab-target="${targetPanelId}"]`);

    if (targetPanel) targetPanel.classList.remove("hidden");
    if (targetButton) {
        targetButton.classList.add("active-tab");
        targetButton.setAttribute("aria-selected", "true");
    }

    resetSubmitButton(elements); // Update button text after switching tabs
  }
  
  // --- Airport Field Visibility (Keep from your original, ensure IDs match HTML) ---
  function updateAirportFieldVisibility(addressInputId, isAirport) {
      let typeContainerId, notesContainerId, hiddenInputId;
      let typeInput, notesInput;
      console.log(`Updating airport fields for ${addressInputId}. Is Airport: ${isAirport}`);
  
      // Determine IDs based on which input triggered the change
      if (addressInputId === "from-location") {
          const activePanelId = document.querySelector(".tab-panel:not(.hidden)")?.id;
          if (activePanelId === "panel-oneway") {
              // Assume IDs for airport fields related to "from" in one-way panel
              typeContainerId = "pickup-type-container"; // Example ID, adjust if needed
              notesContainerId = "pickup-notes-container"; // Example ID, adjust if needed
              hiddenInputId = "isPickupAirportOneWay"; // Example ID, adjust if needed
              typeInput = document.getElementById("pickup-type"); // Example ID, adjust if needed
              notesInput = document.getElementById("pickup-notes"); // Example ID, adjust if needed
          } else if (activePanelId === "panel-experience-plus") {
               // Assume IDs for airport fields related to "from" in experience+ panel (hourly)
               typeContainerId = "pickup-type-container-hourly"; // Example ID, adjust if needed
               notesContainerId = "pickup-notes-container-hourly"; // Example ID, adjust if needed
               hiddenInputId = "isPickupAirportHourly"; // Example ID, adjust if needed
               typeInput = document.getElementById("pickup-type-hourly"); // Example ID, adjust if needed
               notesInput = document.getElementById("pickup-notes-hourly"); // Example ID, adjust if needed
          } else return;
      } else if (addressInputId === "to-address") { // Only applies to one-way
          typeContainerId = "dropoff-type-container"; // Example ID, adjust if needed
          notesContainerId = "dropoff-notes-container"; // Example ID, adjust if needed
          hiddenInputId = "isDropoffAirportOneWay"; // Example ID, adjust if needed
          typeInput = document.getElementById("dropoff-type"); // Example ID, adjust if needed
          notesInput = document.getElementById("dropoff-notes"); // Example ID, adjust if needed
      } else { console.warn(`Unknown address input ID for airport fields: ${addressInputId}`); return; }
  
      const typeContainer = document.getElementById(typeContainerId);
      const notesContainer = document.getElementById(notesContainerId);
      const hiddenInput = document.getElementById(hiddenInputId);
  
      // IMPORTANT: Check if these airport-related elements actually EXIST in your current HTML.
      // If you haven"t added them back, this function will error or do nothing.
      if (!typeContainer || !notesContainer /*|| !hiddenInput*/ ) {
          console.warn(`Airport-related elements (e.g., #${typeContainerId}) not found for ${addressInputId}. Skipping visibility update.`);
          return;
      }
  
      // Toggle visibility
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
  
  
  // --- Google Maps Autocomplete (Modified to be called by callback) ---
  function initAutocomplete() {
      // Check if google.maps is loaded (redundant if callback works, but good safeguard)
      if (typeof google === "undefined" || typeof google.maps === "undefined" || typeof google.maps.places === "undefined") {
          console.error("Google Maps API not loaded correctly. Autocomplete cannot initialize.");
          // Display error to user
          showError(getElementRefs(), "from-location", "Address lookup service failed to load. Please refresh.");
          showError(getElementRefs(), "to-address", "Address lookup service failed to load. Please refresh.");
          return;
      }
  
      console.log("Google Maps API loaded via callback, initializing Autocomplete.");
      const fromLocationInput = document.getElementById("from-location");
      const toAddressInput = document.getElementById("to-address"); // ID from the integrated HTML
  
      const options = {
          // bounds: defaultBounds, // Optional: Bias results to Miami area
          componentRestrictions: { country: "us" }, // Optional: Restrict to US
          fields: ["address_components", "geometry", "icon", "name", "formatted_address", "types"],
          strictBounds: false, // Optional: Set true if using bounds
      };
  
      if (fromLocationInput) {
          try {
              const acFrom = new google.maps.places.Autocomplete(fromLocationInput, options);
              acFrom.addListener("place_changed", () => {
                  const place = acFrom.getPlace();
                  // Check if airport-related elements exist before calling update
                  if (document.getElementById("pickup-type-container")) { // Check if airport fields are present
                    updateAirportFieldVisibility("from-location", !!(place && place.types && place.types.includes("airport")));
                  } else {
                    console.log("Airport fields not found for \"from-location\", skipping visibility update.");
                  }
              });
          } catch (e) { console.error("Autocomplete failed (from-location)", e); }
        } else { console.error("Input 'from-location' not found"); }
  
     if (toAddressInput) {
          try {
              const acTo = new google.maps.places.Autocomplete(toAddressInput, options);
              acTo.addListener("place_changed", () => {
                  const place = acTo.getPlace();
                   // Check if airport-related elements exist before calling update
                  if (document.getElementById("dropoff-type-container")) { // Check if airport fields are present
                    updateAirportFieldVisibility("to-address", !!(place && place.types && place.types.includes("airport")));
                  } else {
                    console.log("Airport fields not found for \"to-address\", skipping visibility update.");
                  }
              });
          } catch (e) { console.error("Autocomplete failed (to-address)", e); }
        } else { console.error("Input 'to-address' not found"); }
  
      // Call other initial setup functions AFTER maps API is ready
      const elementRefs = getElementRefs();
      initializeFlatpickr(elementRefs);
      initializeEventListeners(elementRefs, config.placeholders, config);
      initializeValidationListeners(elementRefs); // Added for validation logic
      switchTab("#panel-oneway", elementRefs, config.placeholders); // Set initial tab
  }
  
  // --- Geolocation (Keep from your original, ensure IDs match HTML) ---
  async function getCurrentLocation(inputId) {
      console.log(`getCurrentLocation called for input: ${inputId} at ${new Date().toISOString()}`);
      if (!navigator.geolocation) { alert("Geolocation is not supported by your browser."); return; }
  
      // Check if google.maps is loaded before using geocoder
      if (typeof google === "undefined" || typeof google.maps === "undefined") {
          console.error("Google Maps API not loaded, cannot geocode.");
          alert("Mapping service is not available to find address.");
          return;
      }
  
      navigator.geolocation.getCurrentPosition( async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Geolocation retrieved: Lat ${latitude}, Lng ${longitude}`);
          const geocoder = new google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };
          try {
              const response = await new Promise((resolve, reject) => {
                  geocoder.geocode({ location: latlng }, (results, status) => {
                      if (status === "OK" && results[0]) { resolve(results); }
                      else { reject(new Error(`Geocoding failed: ${status}`)); }
                  });
              });
              const address = response[0].formatted_address;
              console.log(`Geocoded address: ${address}`);
              const inputField = document.getElementById(inputId);
              if (inputField) {
                  inputField.value = address;
                  // Check if airport-related elements exist before calling update
                  if (document.getElementById("pickup-type-container") || document.getElementById("dropoff-type-container")) {
                      updateAirportFieldVisibility(inputId, false); // Assume not an airport when geolocating
                  } else {
                      console.log("Airport fields not found, skipping visibility update after geolocation.");
                  }
              }
              else { console.error(`Input field "${inputId}" not found.`); }
          } catch (error) {
              console.error("Error geocoding location:", error);
              alert(`Unable to retrieve address: ${error.message}`);
          }
      }, (error) => {
            console.error("Geolocation error:", error);
           let errorMessage = "Unable to retrieve your location.";
           switch(error.code) {
               case error.PERMISSION_DENIED: errorMessage = "Location access denied."; break;
               case error.POSITION_UNAVAILABLE: errorMessage = "Location information unavailable."; break;
               case error.TIMEOUT: errorMessage = "Location request timed out."; break;
               default: errorMessage = `An unknown error occurred (Code: ${error.code}).`; break;
           }
           alert(errorMessage);
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }
  
  
  // --- Experience+ Specific Logic (from generated code) ---
  function handleWynwoodDinnerChoice(elements) {
    // Removed dinner preference logic for Wynwood Art Tour
    console.log("Dinner preferences removed for Wynwood Art Tour.");
  }
  
  // --- UI Update Functions (from generated code, adapted) ---
  function updateExperiencePlusPanelUI(elements, placeholders) {
      if (!elements.experiencePlusPanel || !elements.serviceDropdown) {
          console.warn("Experience Plus Panel or Service Dropdown is missing.");
          return;
      }
  
      const selectedValue = elements.serviceDropdown.value;
      console.log("Selected Service Value:", selectedValue);
  
      const showHourly = selectedValue === "hourly_chauffeur";
      const showCuratedExperience = selectedValue !== "" && !showHourly;
  
      console.log("Show Hourly:", showHourly);
      console.log("Show Curated Experience:", showCuratedExperience);
  
      elements.hourlyDescription?.classList.toggle("hidden", !showHourly);
      elements.durationContainer?.classList.toggle("hidden", !showHourly);
      elements.hourlyDateTimeContainer?.classList.toggle("hidden", !showHourly);
      elements.datePreferenceContainer?.classList.toggle("hidden", !showCuratedExperience);
      elements.commonExperienceFieldsContainer?.classList.toggle("hidden", !showCuratedExperience);
      elements.experienceOptionsContainer?.classList.toggle("hidden", !showCuratedExperience);

      console.log("Experience Plus Panel:", elements.experiencePlusPanel);
      console.log("Service Dropdown:", elements.serviceDropdown);
      console.log("Selected Value:", selectedValue);
      console.log("Hourly Description Element:", elements.hourlyDescription);
      console.log("Experience Options Container:", elements.experienceOptionsContainer);
  
      if (elements.hourlyPickupTimeLabel) {
          elements.hourlyPickupTimeLabel.textContent = "Start Time";
      }
  
      const allExperienceOptionDivs = [
          elements.wynwoodNightOptions,
          elements.waterSkyOptions
      ];
  
      allExperienceOptionDivs.forEach(el => el?.classList.add("hidden"));
  
      if (showCuratedExperience && elements.experienceOptionsContainer) {
          if (selectedValue === "wynwood_night" && elements.wynwoodNightOptions) {
              console.log("Displaying Wynwood Night Art & Club Options");
              elements.wynwoodNightOptions.classList.remove("hidden");
              handleWynwoodDinnerChoice(elements);
          } else if (selectedValue === "water_sky" && elements.waterSkyOptions) {
              console.log("Displaying Premier SUV & Yacht Day Options");
              elements.waterSkyOptions.classList.remove("hidden");
          }
      } else {
          if (elements.wynwoodOtherRestaurantContainer) {
              elements.wynwoodOtherRestaurantContainer.classList.add("hidden");
              const otherInput = elements.wynwoodOtherRestaurantContainer.querySelector("input");
              if (otherInput) {
                  otherInput.value = "";
                  clearError("wynwood-other-restaurant");
              }
          }
      }
  
      resetSubmitButton(elements);
      clearAllErrors(elements);
  }

  function validateForm(elements) {
    let isValid = true;
    clearError("from-location");
    clearError("to-address");

    if (!elements.fromLocationInput?.value.trim()) {
        showError(elements, "from-location", "Please enter a 'From' location.");
        isValid = false;
    }
    if (!elements.toAddressInput?.value.trim()) {
        showError(elements, "to-address", "Please enter a 'To' address.");
        isValid = false;
    }

    return isValid;
  }
  
  // --- NEW: Load Google Maps API Script Dynamically ---
  async function loadGoogleMapsScript() {
      // Check if the script tag is already in the DOM
      if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
          console.log("Google Maps script tag already exists.");
          return; // Exit if script is already in the DOM
      }
  
      console.log("Attempting to load Google Maps script...");
      try {
          // Fetch the API key
          const response = await fetch('/.netlify/functions/get-maps-key');
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Failed to fetch API key (Status: ${response.status})`);
          }
  
          const data = await response.json();
          const apiKey = data.apiKey;
  
          if (!apiKey) {
              throw new Error("API key not received from Netlify function.");
          }
  
          // Create and append the script tag
          const script = document.createElement('script');
          script.id = "google-maps-script"; // Assign an ID for easier debugging
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
          script.async = true;
          script.defer = true;
  
          // Define onload and onerror handlers inside the block
          script.onload = () => {
              console.log("Google Maps API script loaded successfully.");
          };
  
          script.onerror = () => {
              console.error("Failed to load Google Maps API script.");
              // Display a user-friendly error message
              const elements = getElementRefs();
              showError(elements, "from-location", "Address lookup service failed to load.");
              showError(elements, "to-address", "Address lookup service failed to load.");
          };
  
          document.head.appendChild(script);
          console.log("Google Maps script tag added to head.");
      } catch (error) {
          console.error("Error loading Google Maps script or fetching API key:", error);
          // Display a user-friendly error message
          const elements = getElementRefs();
          showError(elements, "from-location", `Map service error: ${error.message}`);
          showError(elements, "to-address", `Map service error: ${error.message}`);
      }
  }
  
  // --- Validation and Redirection Logic ---
  function validateAndEnableButton(elements) {
    const fromLocation = elements.fromLocationInput?.value.trim();
    const toAddress = elements.toAddressInput?.value.trim();
    const vehicleSelected = document.querySelector('input[name="vehicle_type_oneway"]:checked');
    const bookingPreference = elements.bookingPreferenceInput?.value;
  
    const isValid = fromLocation && toAddress && vehicleSelected && bookingPreference;
  
    const submitButton = elements.submitButton;
    if (isValid) {
      submitButton.disabled = false;
      submitButton.classList.remove('bg-gray-300');
      submitButton.classList.add('bg-[--color-gold]', 'hover:bg-[--color-gold-dark]');
    } else {
      submitButton.disabled = true;
      submitButton.classList.add('bg-gray-300');
      submitButton.classList.remove('bg-[--color-gold]', 'hover:bg-[--color-gold-dark]');
    }
  }
  
  function initializeValidationListeners(elements) {
    const fieldsToValidate = [
      elements.fromLocationInput,
      elements.toAddressInput,
      elements.bookingPreferenceInput,
      ...document.querySelectorAll('input[name="vehicle_type_oneway"]'),
    ];
  
    fieldsToValidate.forEach(field => {
      field?.addEventListener('input', () => validateAndEnableButton(elements));
      field?.addEventListener('change', () => validateAndEnableButton(elements));
    });
  }
  
  function redirectToSummaryPage(elements) {
    const fromLocation = elements.fromLocationInput?.value.trim();
    const toAddress = elements.toAddressInput?.value.trim();
    const vehicleSelected = document.querySelector('input[name="vehicle_type_oneway"]:checked')?.value;
    const bookingPreference = elements.bookingPreferenceInput?.value;
    const pickupDate = elements.oneWayPickupDateInput?.value || '';
    const pickupTime = elements.oneWayPickupTimeInput?.value || '';
  
    const queryParams = new URLSearchParams({
      from: fromLocation,
      to: toAddress,
      vehicle: vehicleSelected,
      preference: bookingPreference,
      date: pickupDate,
      time: pickupTime,
    });
  
    window.location.href = `/summary.html?${queryParams.toString()}`;
  }
  
  // --- Main Execution ---
  document.addEventListener("DOMContentLoaded", () => {
      console.log("DOM fully loaded and parsed.");
      const elementRefs = getElementRefs();

      if (!elementRefs.bookingForm) {
          console.error("Booking form (#booking-form) not found. Script initialization incomplete.");
          return;
      }

      loadGoogleMapsScript(); // Load the Google Maps API script

      // Add validation listeners
      initializeValidationListeners(elementRefs);

      // Add redirection logic on form submission
      elementRefs.bookingForm?.addEventListener('submit', (event) => {
          event.preventDefault();
          redirectToSummaryPage(elementRefs);
      });

      resetSubmitButton(elementRefs); // Call the function after initialization
  });
  
  // Make initAutocomplete globally accessible for the Maps API callback
  window.initAutocomplete = initAutocomplete;
