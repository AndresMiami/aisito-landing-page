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
      const errorSpanId = `${fieldId}-error`;
      const errorSpan = document.getElementById(errorSpanId);
      const inputElement = document.getElementById(fieldId);
      let labelText = fieldId;
  
      // Special handling for the vehicle radio button group validation message
      if (fieldId === "vehicle_type_oneway") {
         labelText = "Vehicle Type";
         const fieldset = document.querySelector("#vehicle-selection-oneway fieldset");
         const fieldsetErrorSpan = fieldset ? fieldset.querySelector("#vehicle-type-oneway-error") : null;
         if (fieldsetErrorSpan) {
             fieldsetErrorSpan.textContent = message;
             fieldsetErrorSpan.classList.remove("hidden");
         }
         if (fieldset) {
             fieldset.classList.add("ring-red-500", "ring-1", "rounded-md", "p-1"); // Add styling to fieldset
         }
         return;
      }
  
      const labelElement = document.querySelector(`label[for="${fieldId}"]`) || document.getElementById(`${fieldId}-label`);
      if (labelElement) { labelText = labelElement.textContent.replace("*", "").trim(); }
      else if (fieldId === "date_preference") labelText = "Preferred Timing";
      else if (fieldId === "motivation") labelText = "Occasion";
      else if (fieldId === "dinner_style_preference") labelText = "Dinner Preference";
      else if (fieldId === "lounge_interest") labelText = "Lounge Interest";
      else if (fieldId === "wynwood-other-restaurant") labelText = "Other Cuisine / Restaurant Request";
  
      const fullMessage = `${labelText}: ${message}`;
  
      if (errorSpan) {
        errorSpan.textContent = fullMessage;
        errorSpan.classList.remove("hidden");
      } else { console.warn(`Error span not found for ID: ${errorSpanId}`); }
  
      if (inputElement && ["INPUT", "SELECT", "TEXTAREA"].includes(inputElement.tagName)) {
        inputElement.classList.add("ring-red-500", "ring-1");
        inputElement.setAttribute("aria-invalid", "true");
        let describedBy = inputElement.getAttribute("aria-describedby") || "";
        if (!describedBy.includes(errorSpanId)) {
             inputElement.setAttribute("aria-describedby", describedBy ? `${describedBy} ${errorSpanId}` : errorSpanId);
        }
      }
  }
  
  function clearError(fieldId) {
      const errorSpanId = `${fieldId}-error`;
      const errorSpan = document.getElementById(errorSpanId);
      const inputElement = document.getElementById(fieldId);
  
      if (fieldId === "vehicle_type_oneway") {
          const fieldset = document.querySelector("#vehicle-selection-oneway fieldset");
          const fieldsetErrorSpan = fieldset ? fieldset.querySelector("#vehicle-type-oneway-error") : null;
          if (fieldsetErrorSpan) {
              fieldsetErrorSpan.textContent = "";
              fieldsetErrorSpan.classList.add("hidden");
          }
          if (fieldset) {
              fieldset.classList.remove("ring-red-500", "ring-1", "rounded-md", "p-1");
          }
          return;
      }
  
      if (errorSpan) { errorSpan.textContent = ""; errorSpan.classList.add("hidden"); }
  
      if (inputElement && ["INPUT", "SELECT", "TEXTAREA"].includes(inputElement.tagName)) {
        inputElement.classList.remove("ring-red-500", "ring-1");
        inputElement.removeAttribute("aria-invalid");
        let describedBy = inputElement.getAttribute("aria-describedby");
        if (describedBy) {
            describedBy = describedBy.replace(errorSpanId, "").trim();
            if (describedBy) {
                inputElement.setAttribute("aria-describedby", describedBy);
            } else {
                inputElement.removeAttribute("aria-describedby");
            }
        }
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
      let activePanelId = "";
      const activeTabButton = elements.tabNavigationContainer?.querySelector(".active-tab");
      activePanelId = activeTabButton ? activeTabButton.getAttribute("data-tab-target") : null;
      const selectedService = elements.serviceDropdown?.value || "";
  
      if (activePanelId === "#panel-oneway") return "Continue"; // Updated from 'Get Quote' to 'Continue'
      else if (activePanelId === "#panel-experience-plus") {
        if (selectedService === "hourly_chauffeur") return "Request Hourly Service";
        else if (selectedService !== "") return "Request Experience";
        else return "Select Service";
      }
      return "Submit"; // Fallback
  }
  
  function resetSubmitButton(elements) {
      if (!elements.submitButton) return;
      elements.submitButton.disabled = false;
      if (elements.submitButtonSpinner) elements.submitButtonSpinner.classList.add("hidden");
      if (elements.submitButtonText) {
        elements.submitButtonText.textContent = determineButtonText(elements);
        elements.submitButtonText.classList.remove("hidden");
      }
  }
  
  function setLoadingButton(elements) {
      if (!elements.submitButton) return;
      elements.submitButton.disabled = true;
      if (elements.submitButtonText) elements.submitButtonText.classList.add("hidden");
      if (elements.submitButtonSpinner) elements.submitButtonSpinner.classList.remove("hidden");
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
  
  function switchTab(targetPanelId, elements, placeholders) {
      // Hide all tab panels and reset tab buttons
      elements.formTabPanels?.forEach(panel => panel.classList.add("hidden"));
      elements.tabNavigationButtons?.forEach(button => {
          button.classList.remove("active-tab");
          button.setAttribute("aria-selected", "false");
          button.removeAttribute("tabindex");
      });
  
      // Show the target panel and set the active tab button
      const targetPanel = document.querySelector(targetPanelId);
      const targetButton = elements.tabNavigationContainer?.querySelector(`[data-tab-target="${targetPanelId}"]`);
      let firstFocusableElement = null;
  
      if (targetPanel) {
          targetPanel.classList.remove("hidden");
          firstFocusableElement = targetPanel.querySelector("input:not([type=\"hidden\"]):not(.sr-only):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not([disabled])");
      }
  
      if (targetButton) {
          targetButton.classList.add("active-tab");
          targetButton.setAttribute("aria-selected", "true");
          targetButton.setAttribute("tabindex", "0");
      }
  
      // Update the button text based on the active tab
      if (targetPanelId === "#panel-oneway") {
          // Explicitly set the button text to "Continue" for the "One Way" tab
          if (elements.submitButtonText) {
              elements.submitButtonText.textContent = "Continue";
          }
      } else if (targetPanelId === "#panel-experience-plus") {
          // Dynamically update the button text for the "Experience" tab
          resetSubmitButton(elements);
      }
  
      // Focus the first focusable element in the target panel
      setTimeout(() => {
          if (firstFocusableElement) {
              firstFocusableElement.focus();
          }
      }, 50);
  
      // Clear all errors and reset the button state
      clearAllErrors(elements);
  }
  
  // --- Form Validation (Adapted from generated code) ---
  function validateForm(elements) {
      let isValid = true;
      const activeTabButton = elements.tabNavigationContainer?.querySelector(".active-tab");
      const activePanelId = activeTabButton ? activeTabButton.getAttribute("data-tab-target") : null;
  
      clearError("from-location");
      if (!elements.fromLocationInput?.value.trim()) {
        showError(elements, "from-location", "Please enter a \"From\" location.");
        isValid = false;
      }
  
      if (activePanelId === "#panel-oneway") {
        clearError("to-address");
        clearError("pickup-date-oneway");
        clearError("pickup-time-oneway");
        clearError("vehicle_type_oneway");
  
        if (!elements.toAddressInput?.value.trim()) { showError(elements, "to-address", "Please enter a \"To\" address."); isValid = false; }
        if (!elements.oneWayPickupDateInput?.value) { showError(elements, "pickup-date-oneway", "Please select a date."); isValid = false; }
        if (!elements.oneWayPickupTimeInput?.value) { showError(elements, "pickup-time-oneway", "Please select a time."); isValid = false; }
  
        const vehicleSelectedOneway = document.querySelector("input[name=\"vehicle_type_oneway\"]:checked");
        if (!vehicleSelectedOneway) {
            showError(elements, "vehicle_type_oneway", "Please select a vehicle type.");
            isValid = false;
        }
  
      } else if (activePanelId === "#panel-experience-plus") {
         const selectedService = elements.serviceDropdown.value;
         clearError("experience-dropdown");
         if (!selectedService) {
           showError(elements, "experience-dropdown", "Please select a Service.");
           isValid = false;
         } else if (selectedService === "hourly_chauffeur") {
            clearError("duration-hourly");
            clearError("pickup-date-hourly");
            clearError("pickup-time-hourly");
           if (!elements.durationSelect?.value) { showError(elements, "duration-hourly", "Please select duration."); isValid = false; }
           if (!elements.hourlyPickupDateInput?.value) { showError(elements, "pickup-date-hourly", "Please select a date."); isValid = false; }
           if (!elements.hourlyPickupTimeInput?.value) { showError(elements, "pickup-time-hourly", "Please select a start time."); isValid = false; }
         } else {
            clearError("experience-name");
            clearError("experience-guests");
            clearError("experience-email");
            clearError("experience-phone");
            clearError("date_preference");
           if (!elements.experienceNameInput?.value.trim()) { showError(elements, "experience-name", "Name required."); isValid = false; }
           if (!elements.experienceGuestsInput?.value || parseInt(elements.experienceGuestsInput.value, 10) < 1) { showError(elements, "experience-guests", "Min 1 guest."); isValid = false; }
           if (!elements.experienceEmailInput?.value.trim()) {
              showError(elements, "experience-email", "Email required."); isValid = false;
           } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elements.experienceEmailInput.value.trim())) {
              showError(elements, "experience-email", "Invalid email format."); isValid = false;
           }
           if (!elements.experiencePhoneInput?.value.trim()) {
               showError(elements, "experience-phone", "Phone required.");
               isValid = false;
           } else if (!/^\+?[\d\s()-]{10,20}$/.test(elements.experiencePhoneInput.value) || !/[\d]{10}/.test(elements.experiencePhoneInput.value.replace(/\D/g, ""))) {
             showError(elements, "experience-phone", "Invalid phone format (minimum 10 digits).");
             isValid = false;
           }
           const datePrefSelected = document.querySelector("input[name=\"date_preference\"]:checked");
           if (!datePrefSelected) { showError(elements, "date_preference", "Please select timing preference."); isValid = false; }
  
           if (selectedService === "wynwood_night") {
             clearError("motivation");
             clearError("dinner_style_preference");
             clearError("lounge_interest");
             clearError("wynwood-other-restaurant");
             const motivationSelected = document.querySelector("#wynwood-night-options input[name=\"motivation\"]:checked");
             const dinnerPrefSelected = document.querySelector("#wynwood-night-options input[name=\"dinner_style_preference\"]:checked");
             const loungeSelected = document.querySelector("#wynwood-night-options input[name=\"lounge_interest\"]:checked");
             if (!motivationSelected) { showError(elements, "motivation", "Occasion required."); isValid = false; }
             if (!dinnerPrefSelected) { showError(elements, "dinner_style_preference", "Dinner preference required."); isValid = false; }
               if (elements.wynwoodOtherDinnerRadio?.checked) {
                   const otherRestaurantInput = document.getElementById("wynwood-other-restaurant");
                   if (!otherRestaurantInput?.value.trim()) {
                       showError(elements, "wynwood-other-restaurant", "Please specify other preference.");
                       isValid = false;
                   }
               }
             if (!loungeSelected) { showError(elements, "lounge_interest", "Lounge interest required."); isValid = false; }
           }
         }
      } else {
        isValid = false;
        console.error("No active tab panel identified for validation.");
      }
  
      return isValid;
  }
  
  // --- Form Data Processing (Adapted from generated code) ---
  function processFormData(elements) {
      const formData = new FormData(elements.bookingForm);
      let serviceType = "";
      const activeTabButton = elements.tabNavigationContainer?.querySelector(".active-tab");
      const activePanelId = activeTabButton ? activeTabButton.getAttribute("data-tab-target") : null;
      const dataObject = {};
  
      dataObject.from_location = formData.get("from-location")?.trim();
  
      if (activePanelId === "#panel-oneway") {
        serviceType = "One-Way";
        dataObject.type = "one-way";
        dataObject.to_location = formData.get("to-address")?.trim();
        dataObject.pickup_date = formData.get("pickup-date-oneway");
        dataObject.pickup_time = formData.get("pickup-time-oneway");
        dataObject.vehicle_type = formData.get("vehicle_type_oneway");
        // Add airport details if they exist
        if (formData.has("isPickupAirportOneWay")) dataObject.isPickupAirport = formData.get("isPickupAirportOneWay") === "true";
        if (formData.has("pickup-type")) dataObject.pickup_type = formData.get("pickup-type");
        if (formData.has("pickup-notes")) dataObject.pickup_notes = formData.get("pickup-notes")?.trim();
        if (formData.has("isDropoffAirportOneWay")) dataObject.isDropoffAirport = formData.get("isDropoffAirportOneWay") === "true";
        if (formData.has("dropoff-type")) dataObject.dropoff_type = formData.get("dropoff-type");
        if (formData.has("dropoff-notes")) dataObject.dropoff_notes = formData.get("dropoff-notes")?.trim();
  
      } else if (activePanelId === "#panel-experience-plus") {
        const selectedServiceValue = formData.get("experience-dropdown");
        const selectedServiceText = elements.serviceDropdown.options[elements.serviceDropdown.selectedIndex]?.text || selectedServiceValue;
        dataObject.service_name = selectedServiceText;
  
        if (selectedServiceValue === "hourly_chauffeur") {
          serviceType = "Hourly";
          dataObject.type = "hourly";
          dataObject.duration_hours = formData.get("duration-hourly");
          dataObject.pickup_date = formData.get("pickup-date-hourly");
          dataObject.pickup_time = formData.get("pickup-time-hourly");
          // Add airport details if they exist
          if (formData.has("isPickupAirportHourly")) dataObject.isPickupAirport = formData.get("isPickupAirportHourly") === "true";
          if (formData.has("pickup-type-hourly")) dataObject.pickup_type = formData.get("pickup-type-hourly");
          if (formData.has("pickup-notes-hourly")) dataObject.pickup_notes = formData.get("pickup-notes-hourly")?.trim();
  
        } else { // Curated Experience
          serviceType = "Experience";
          dataObject.type = "experience";
          dataObject.date_preference = formData.get("date_preference");
          dataObject.guests = formData.get("guests");
          dataObject.name = formData.get("name")?.trim();
          dataObject.email = formData.get("email")?.trim();
          dataObject.phone = formData.get("phone")?.trim();
  
          if (selectedServiceValue === "wynwood_night") {
            dataObject.motivation = formData.get("motivation");
            dataObject.dinner_style_preference = formData.get("dinner_style_preference");
            if (formData.get("dinner_style_preference") === "Other") {
              dataObject.other_restaurant_request = formData.get("other_restaurant_request")?.trim();
            }
            dataObject.lounge_interest = formData.get("lounge_interest");
          }
        }
      }
  
      // Clean up empty/null values
      Object.keys(dataObject).forEach(key => {
           if (dataObject[key] === null || dataObject[key] === undefined || dataObject[key] === "") {
             if (key === "other_restaurant_request" && dataObject.dinner_style_preference !== "Other") {
                 delete dataObject[key];
             } else if (key !== "other_restaurant_request") {
                delete dataObject[key];
             }
           }
      });
  
      console.log("Final Data Object for Submission:", dataObject);
      return dataObject;
  }
  
  
  // --- Form Submission (KEEP YOUR ORIGINAL QUOTE LOGIC) ---
  async function submitQuoteRequest(data) {
      const resultsArea = document.getElementById("quote-results-area");
      const loadingIndicator = document.getElementById("loading-indicator");
      const errorDisplay = document.getElementById("quote-error");
      const quoteDetailsDisplay = document.getElementById("quote-details");
      const priceDisplay = document.getElementById("quote-price");
      const distanceDisplay = document.getElementById("quote-distance");
      const durationDisplay = document.getElementById("quote-duration");
      // Add back any other quote-specific elements you need to update
      // const pickupTypeRow = document.getElementById("pickup-type-row");
      // ... etc ...
  
      // Determine the correct submit button based on the data type passed
      const activeSubmitButton = data.type === "one-way"
          ? document.querySelector("#panel-oneway button[type=\"submit\"]") // More specific selector if needed
          : (data.type === "hourly" ? document.querySelector("#panel-experience-plus button[type=\"submit\"]") : null); // Adjust if experience has own button
  
       // Check if elements exist
       if ( !resultsArea || !loadingIndicator || !errorDisplay || !quoteDetailsDisplay || !priceDisplay || !distanceDisplay || !durationDisplay /* || !pickupTypeRow etc... */ ) {
           console.error("Quote UI elements missing!");
           if (activeSubmitButton) { resetSubmitButton(getElementRefs()); } // Reset button if UI fails
           return;
       }
  
       // Show loading state
       resultsArea.style.display = "block";
       quoteDetailsDisplay.style.display = "none";
       loadingIndicator.style.display = "block";
       errorDisplay.textContent = "";
  
       const endpoint = "/.netlify/functions/whatsapp-webhook"; // Your endpoint
       console.log(`Sending QUOTE data to endpoint: ${endpoint}`);
       console.log("QUOTE Data being sent:", data);
  
       try {
           const response = await fetch(endpoint, {
               method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(data),
           });
           const result = await response.json();
           if (!response.ok) { throw new Error(result.message || `Request failed with status ${response.status}`); }
  
           console.log("Received QUOTE response from server:", result);
  
           // --- Display SUCCESS results in HTML ---
           priceDisplay.textContent = result.price || "N/A";
           distanceDisplay.textContent = result.distance || "---";
           durationDisplay.textContent = result.duration || "N/A";
           // Update any other quote-specific fields based on "result"
           // e.g., if (result.isPickupAirport) { ... }
  
           quoteDetailsDisplay.style.display = "block"; // Show the quote details
  
       } catch (error) {
           console.error(`Error submitting quote request:`, error);
           errorDisplay.textContent = error.message || `An unknown error occurred getting the quote.`;
           quoteDetailsDisplay.style.display = "none";
       } finally {
           console.log("Quote Fetch request finished.");
           if (loadingIndicator) loadingIndicator.style.display = "none";
           resetSubmitButton(getElementRefs()); // Use the general reset function
       }
  }
  
  // --- Event Listener Setup (Combined & Updated) ---
  function initializeEventListeners(elements, placeholders, config) {
       // Listener for tab clicks
       elements.tabNavigationContainer?.addEventListener("click", (event) => {
           const button = event.target.closest(".tab-button");
           if (button && button.dataset.tabTarget && !button.classList.contains("active-tab")) {
               switchTab(button.dataset.tabTarget, elements, placeholders);
           }
       });
  
       // Listener for experience dropdown changes
       elements.serviceDropdown?.addEventListener("change", () => updateExperiencePlusPanelUI(elements, placeholders));
  
       // Add listeners to clear errors on input/change for standard fields
       elements.bookingForm?.querySelectorAll("input:not([type=\"radio\"]), select, textarea").forEach(input => {
           let targetId = input.id || input.name;
           if (!targetId) return;
           const eventType = (input.tagName === "INPUT" && input.type !== "number" && input.type !== "email" && input.type !== "tel") ? "input" : "change";
            input.addEventListener(eventType, () => clearError(targetId));
            input.addEventListener("blur", () => clearError(targetId));
       });
  
       // Add listeners to clear errors for specific radio groups (excluding vehicle cards)
       ["dinner_style_preference", "motivation", "lounge_interest", "date_preference"].forEach(name => {
           document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
               radio.addEventListener("change", () => {
                   clearError(name);
                   if (name === "dinner_style_preference" && elements.wynwoodNightOptions && !elements.wynwoodNightOptions.classList.contains("hidden")) {
                       handleWynwoodDinnerChoice(elements);
                   }
               });
           });
       });
  
        // Add listener for vehicle card selection (clears the group error on change)
        const vehicleCardRadios = document.querySelectorAll(".vehicle-card input[type=\"radio\"][name=\"vehicle_type_oneway\"]");
        vehicleCardRadios.forEach(radio => {
            radio.addEventListener("change", () => {
                clearError("vehicle_type_oneway");
            });
        });
  
       // Listener for the MAIN form submission
       elements.bookingForm?.addEventListener("submit", (event) => {
           event.preventDefault();
           clearAllErrors(elements);
  
           const activeTabButton = elements.tabNavigationContainer?.querySelector(".active-tab");
           const activePanelId = activeTabButton ? activeTabButton.getAttribute("data-tab-target") : null;
  
           if (validateForm(elements)) {
               const data = processFormData(elements);
  
               // Decide action based on tab/service
               if (activePanelId === "#panel-oneway") {
                   // One-Way always gets a quote first
                   setLoadingButton(elements); // Set loading state before async call
                   submitQuoteRequest(data);
               } else if (activePanelId === "#panel-experience-plus") {
                   if (data.type === "hourly") { // Check type from processed data
                       // Hourly also gets a quote first
                       setLoadingButton(elements);
                       submitQuoteRequest(data);
                   } else { // Curated Experience
                       // Submit directly (or add quote step later)
                       console.log("Submitting Experience Request (placeholder)...");
                       // Replace alert with actual submission logic if desired, e.g., sendFormData(data, elements, config);
                       alert("Experience request submitted (placeholder).\nData:\n" + JSON.stringify(data, null, 2));
                       // Potentially show confirmation message here after submission
                       // resetSubmitButton(elements); // Reset button if no async action
                   }
               }
           } else {
               // Handle validation failure - focus first error
               const firstErrorField = elements.bookingForm.querySelector("[aria-invalid=\"true\"], fieldset.ring-red-500 input[type=\"radio\"], fieldset.ring-red-500 input[type=\"checkbox\"]");
               const firstFieldsetError = elements.bookingForm.querySelector("fieldset.ring-red-500");
               let elementToFocus = firstErrorField;
               if (!elementToFocus && firstFieldsetError) {
                   elementToFocus = firstFieldsetError.querySelector("input[type=\"radio\"], input[type=\"checkbox\"]");
               }
               if (elementToFocus) {
                   elementToFocus.focus({ preventScroll: true });
                   elementToFocus.scrollIntoView({ behavior: "smooth", block: "center" });
               }
               showError(elements, "submit-button", "Please review the errors above.");
           }
       });
  
        // Accessibility Boost: Set aria-checked dynamically for vehicle cards
        vehicleCardRadios.forEach(radio => {
            radio.setAttribute("aria-checked", radio.checked ? "true" : "false");
            radio.addEventListener("change", () => {
                vehicleCardRadios.forEach(r => {
                    r.setAttribute("aria-checked", r.checked ? "true" : "false");
                });
            });
        });
  
       console.log("Event listeners initialized.");
    }
  
  // --- NEW: Load Google Maps API Script Dynamically ---
  async function loadGoogleMapsScript() {
    console.log("Attempting to load Google Maps script...");
    try {
      const response = await fetch("/.netlify/functions/get-maps-key");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch API key (Status: ${response.status})`);
      }
      const data = await response.json();
      const apiKey = data.apiKey;
  
      if (!apiKey) {
        throw new Error("API key not received from Netlify function.");
      }
  
      // Check if script already exists (e.g., due to fast refresh/HMR)
      if (document.getElementById("google-maps-script")) {
          console.log("Google Maps script tag already exists.");
          // If it exists but google.maps isn"t loaded, might need to re-trigger init
          if (typeof google === "undefined" || typeof google.maps === "undefined") {
              console.warn("Script tag exists but google.maps not loaded. Re-attempting callback trigger might be needed or check script URL.");
          } else {
               // If script exists AND google.maps is loaded, maybe initAutocomplete wasn"t called?
               // Or maybe it"s fine. Let"s assume the callback worked.
               console.log("google.maps seems loaded.");
          }
          return; // Don"t load again
      }
  
  
      const script = document.createElement("script");
      script.id = "google-maps-script"; // Add an ID to prevent duplicates
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
          console.error("Error loading the Google Maps script.");
          // Display error to user
          showError(getElementRefs(), "from-location", "Address lookup service failed to load. Check console.");
          showError(getElementRefs(), "to-address", "Address lookup service failed to load. Check console.");
      };
      document.head.appendChild(script);
      console.log("Google Maps script tag added to head.");
  
    } catch (error) {
      console.error("Error loading Google Maps script:", error);
      // Display a user-friendly error message on the page
       showError(getElementRefs(), "from-location", `Map service error: ${error.message}`);
       showError(getElementRefs(), "to-address", `Map service error: ${error.message}`);
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
      const elementRefs = getElementRefs(); // Get refs early for potential error display
  
      if (!elementRefs.bookingForm) {
          console.error("Booking form (#booking-form) not found. Script initialization incomplete.");
          return; // Stop if form isn"t found
      }
  
      // Load the Google Maps script. The callback "initAutocomplete" will handle the rest.
      loadGoogleMapsScript();
  
      // NOTE: initializeFlatpickr and initializeEventListeners are now called *inside* initAutocomplete
      // because they depend on elements that might be manipulated or need Maps API features.
  
      // Add validation listeners
      initializeValidationListeners(elementRefs);
  
      // Add redirection logic on form submission
      elementRefs.bookingForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        redirectToSummaryPage(elementRefs);
      });
  });
  
  // Make initAutocomplete globally accessible for the Maps API callback
  window.initAutocomplete = initAutocomplete;

