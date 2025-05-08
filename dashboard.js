// dashboard.js
// This script handles the dynamic behavior and form submissions
// for the luxury vehicle booking dashboard page, including tab switching,
// form validation, Google Maps Autocomplete integration, and orchestrating
// the use of modularized components for element references,
// error handling, validation, and submission.
// It aims to provide a responsive and user-friendly booking experience.
//
// NOTE: This script is tightly coupled with the booking dashboard's HTML structure and relies on
// external dependencies like Google Maps API (Places library) and Flatpickr.
// Ensure these are correctly included and the necessary HTML elements with matching IDs exist
// for the script to function correctly.

// Import functions from the maps.js module
import { loadGoogleMapsScript, initAutocomplete, getCurrentLocation } from './maps.js';
// Import error handling functions from the new errorHandling.js module
import { showError, clearError, clearAllErrors } from './errorHandling.js';
// Import form validation function from the new formValidation.js module
import { validateForm } from './formValidation.js';
// Import form data processing and submission functions from the new formSubmission.js module
import { processFormData, sendFormData } from './formSubmission.js';


// --- Global variables ---
// (Keep your existing map-related globals if needed elsewhere,
// otherwise they might not be necessary for just the form logic shown here)
// let map;
// let directionsService;
// let directionsRenderer;

 // --- Configuration ---
// Application-wide configuration settings.
const config = {
    // FORM_ENDPOINT: "https://formspree.io/your-endpoint", // Endpoint for form submissions (currently commented out - REPLACE THIS IN PRODUCTION)
    MAX_NOTES_LENGTH: 500, // Maximum character limit for notes/instructions fields (example)
    placeholders: {
      // Custom placeholder texts for different service types or fields
      oneWay: "Optional: Add flight number, luggage details, or specific instructions...",
      hourly: "Optional: Describe your ideal route, planned stops, music/AC preferences...",
      experience: "Optional: Any special interests or requests for this experience?",
      defaultExp: "Optional notes or preferences..."
    }
  };

  // --- Element References ---
  // Gathers and returns references to key DOM elements used throughout the script.
  // Calling this function after DOMContentLoaded ensures elements exist in the page structure.
  // Returns: An object containing references to DOM elements.
 export function getElementRefs() {
    const refs = {};
    // Main form and tab navigation elements
    refs.bookingForm = document.getElementById("booking-form"); // The main form element by its ID
    refs.tabNavigationContainer = document.getElementById("tab-navigation"); // Container for the tab buttons
    refs.tabNavigationButtons = refs.tabNavigationContainer?.querySelectorAll(".tab-button"); // NodeList of all tab buttons
    refs.formTabPanels = refs.bookingForm?.querySelectorAll(".tab-panel"); // NodeList of all tab content panels

    // One-Way Specific Elements
    refs.oneWayPanel = document.getElementById("panel-oneway"); // The One-Way booking panel element
    refs.fromLocationInput = document.getElementById("from-location"); // Input field for the starting location
    refs.toAddressInput = document.getElementById("to-address"); // Input field for the destination address
    refs.requestNowButton = document.getElementById('request-now-button');
    refs.bookLaterButton = document.getElementById('book-later-button');
    refs.scheduledBookingInputsContainer = document.getElementById('scheduled-booking-inputs'); // Container for scheduled date/time inputs
    refs.bookingPreferenceInput = document.getElementById('booking-preference'); // Hidden input to store 'ASAP' or 'Scheduled'
    refs.oneWayPickupDateInput = document.getElementById("pickup-date-oneway"); // Date input for One-Way scheduled booking
    refs.oneWayPickupTimeInput = document.getElementById("pickup-time-oneway"); // Time input for One-Way scheduled booking
    refs.vehicleSelectionOneway = document.getElementById("vehicle-selection-oneway"); // Container div for vehicle selection cards

    // Experience+ Specific Elements
    refs.experiencePlusPanel = document.getElementById("panel-experience-plus"); // The Experience+ booking panel element
    refs.serviceDropdown = document.getElementById("experience-dropdown"); // Dropdown to select the experience or service type
    refs.hourlyDescription = document.getElementById("hourly-description"); // Description text element for Hourly Chauffeur service
    refs.durationContainer = document.getElementById("duration-container"); // Container for the hourly duration selection input
    refs.durationSelect = document.getElementById("duration-hourly"); // Select input for hourly duration
    refs.hourlyDateTimeContainer = document.getElementById("date-time-container-hourly"); // Container for hourly date/time inputs
    refs.hourlyPickupDateInput = document.getElementById("pickup-date-hourly"); // Date input for hourly service
    refs.hourlyPickupTimeInput = document.getElementById("pickup-time-hourly"); // Time input for hourly service
    refs.hourlyPickupTimeLabel = document.getElementById("pickup-time-label-hourly"); // Label element for hourly pickup time
    refs.datePreferenceContainer = document.getElementById("date-preference-container"); // Container for date preference radio buttons (Curated experiences)
    refs.experienceOptionsContainer = document.getElementById("experience-options-container"); // Container for divs holding specific experience options
    refs.commonExperienceFieldsContainer = document.getElementById("common-experience-fields"); // Container for common contact/guest fields in Experience+
    refs.experienceNameInput = document.getElementById("experience-name"); // Input field for the user's name in Experience+
    refs.experienceGuestsInput = document.getElementById("experience-guests"); // Input field for the number of guests
    refs.experienceEmailInput = document.getElementById("experience-email"); // Input field for the user's email
    refs.experiencePhoneInput = document.getElementById("experience-phone"); // Input field for the user's phone number
    refs.wynwoodNightOptions = document.getElementById("wynwood-night-options"); // Div containing specific options for the Wynwood Night experience
    refs.wynwoodDinnerPrefRadios = document.querySelectorAll("#wynwood-night-options input[name=\"dinner_style_preference\"]"); // Radio buttons for Wynwood dinner preference
    refs.wynwoodOtherRestaurantContainer = document.getElementById("wynwood-other-restaurant-container"); // Container for the 'Other' restaurant input field
    refs.wynwoodOtherDinnerRadio = document.getElementById("wynwood-dinner-other-style"); // The 'Other' dinner preference radio button
    refs.waterSkyOptions = document.getElementById("water-sky-options"); // Div containing specific options for Water & Sky experience
    refs.evergladesOptions = document.getElementById('everglades-options');
    refs.keysEscapeOptions = document.getElementById('keys-escape-options');
    refs.getLocationButton = document.getElementById("get-location-button"); // Reference to the "Get Current Location" button

    // Common Submission/Feedback Elements
    refs.submitButton = document.getElementById("submit-button"); // The form submission button
    refs.submitButtonText = refs.submitButton?.querySelector(".button-text"); // Span element holding the submit button text
    refs.submitButtonSpinner = refs.submitButton?.querySelector(".spinner"); // Element for the loading spinner within the button
    refs.confirmationMessage = document.getElementById("confirmation-message"); // Message div shown after successful form submission

    // Add references to the button state helper functions so they can be passed to sendFormData
    // Note: These functions are defined below in this file and are NOT moved to formSubmission.js
    refs.setLoadingButton = setLoadingButton;
    refs.resetSubmitButton = resetSubmitButton;


    return refs;
}

  // --- Initialize Flatpickr ---
  // Initializes the Flatpickr date and time pickers for relevant input fields.
  // Assumes the Flatpickr library is loaded globally (included via <script> tag).
  // Parameters:
  // - elements: Object containing references to DOM elements from getElementRefs()..
  // Returns: void
  function initializeFlatpickr(elements) {
    // Check if Flatpickr library is available
    if (!window.flatpickr) {
      console.error("Flatpickr library not loaded. Date/time pickers cannot be initialized.");
      return;
    }
    // Configuration objects for date and time pickers with common settings
    const commonDateConfig = { altInput: true, altFormat: "D, M j, Y", dateFormat: "Y-m-d", minDate: "today" };
    const commonTimeConfig = { enableTime: true, noCalendar: true, dateFormat: "H:i", altInput: true, altFormat: "h : i K", time_24hr: false, minuteIncrement: 10 };

    // Initialize pickers for One-Way and Hourly fields if the corresponding input elements exist
    if (elements.oneWayPickupDateInput) flatpickr(elements.oneWayPickupDateInput, commonDateConfig);
    if (elements.oneWayPickupTimeInput) flatpickr(elements.oneWayPickupTimeInput, commonTimeConfig);
    if (elements.hourlyPickupDateInput) flatpickr(elements.hourlyPickupDateInput, commonDateConfig);
    if (elements.hourlyPickupTimeInput) flatpickr(elements.hourlyPickupTimeInput, commonTimeConfig);
    console.log("Flatpickr initialized for relevant inputs.");
  }

  // --- Helper Functions (Error Handling) ---
  // These functions have been moved to errorHandling.js
  // export function showError(elements, fieldId, message) { ... }
  // export function clearError(fieldId) { ... }
  // function clearAllErrors(elements) { ... }


  // Determines the appropriate text to display on the submit button based on the active tab and selected service.
  // Provides clear calls to action for the user.
  // Parameters:
  // - elements: Object containing references to DOM elements.
  // Returns: string - A string representing the desired button text.
  function determineButtonText(elements) {
       // Find the currently active tab button element
        const activeTabButton = elements.tabNavigationContainer?.querySelector('.active-tab');
       // Get the data-tab-target attribute value from the active button to identify the current panel
        const activePanelId = activeTabButton ? activeTabButton.getAttribute('data-tab-target') : null;
       // Get the selected value from the experience dropdown if it exists
        const selectedService = elements.serviceDropdown?.value || '';

       // Logic to determine the button text based on the active panel ID
        if (activePanelId === '#panel-oneway') {
           return 'Continue'; // Button text for the One-Way tab
       } else if (activePanelId === '#panel-experience-plus') {
            // Logic specific to the Experience+ tab, based on the selected service
            if (selectedService === 'hourly_chauffeur') return 'Request Hourly Service'; // Text when Hourly Chauffeur is selected
            else if (selectedService !== '') return 'Request Experience'; // Text when any other curated experience is selected
            else return 'Select Service'; // Default text when no service is selected in the Experience+ tab
        }
        return 'Submit'; // Fallback text if no active panel is identified or other unexpected state
  }

  // Resets the submit button to its default enabled state (unless validation prevents it later)
  // and updates its text to reflect the current form state.
  // Parameters:
  // - elements: Object containing references to DOM elements.
  // Returns: void
  function resetSubmitButton(elements) {
       // Check if the submit button element reference exists
        if (!elements.submitButton) {
            console.warn("Submit button element not found for reset.");
            return; // Exit the function if the button element is not available
        }
        elements.submitButton.disabled = false; // Enable the submit button
       // Hide the loading spinner if it is currently visible
        if (elements.submitButtonSpinner) elements.submitButtonSpinner.classList.add('hidden');
       // Update the text displayed on the button
        if (elements.submitButtonText) {
          elements.submitButtonText.textContent = determineButtonText(elements); // Set text based on current form state
          elements.submitButtonText.classList.remove('hidden'); // Ensure the text is visible
        }
    }

  // Sets the submit button to a loading state, typically used while a form submission is in progress.
  // Disables the button and shows a spinner.
  // Parameters:
  // - elements: Object containing references to DOM elements.
  // Returns: void
  function setLoadingButton(elements) {
       // Check if the submit button element reference exists
        if (!elements.submitButton) {
           console.warn("Submit button element not found for setting loading state.");
           return; // Exit the function if the button element is not available
        }
        elements.submitButton.disabled = true; // Disable the submit button to prevent multiple clicks
       // Hide the regular button text
        if (elements.submitButtonText) elements.submitButtonText.classList.add('hidden');
       // Show the loading spinner
        if (elements.submitButtonSpinner) elements.submitButtonSpinner.classList.remove('hidden');
    }

    // Handles the conditional visibility and required state of the "Other Restaurant" input field
    // within the Wynwood Night experience options, based on whether the "Other" dinner preference radio is selected.
    // Parameters:
    // - elements: Object containing references to DOM elements.
    // Returns: void
    function handleWynwoodDinnerChoice(elements) {
        // Ensure the necessary elements ('Other' radio and its container) exist
        if (!elements.wynwoodOtherDinnerRadio || !elements.wynwoodOtherRestaurantContainer) {
            // console.warn("Wynwood 'Other' dinner preference elements not found. Skipping conditional logic.");
            return; // Exit if elements are missing
        }
        // Check if the "Other" dinner preference radio button is currently selected
        const showOtherInput = elements.wynwoodOtherDinnerRadio.checked;
        // Toggle the 'hidden' class on the container of the 'Other Restaurant' input based on the radio state
        elements.wynwoodOtherRestaurantContainer.classList.toggle('hidden', !showOtherInput);

        // Find the actual input element within the container
        const otherInput = elements.wynwoodOtherRestaurantContainer.querySelector('input');
        if (otherInput) {
            // Set the 'required' HTML attribute for the input based on whether the 'Other' option is selected
            otherInput.required = showOtherInput;
            // If the 'Other' option is no longer selected, clear the input's value and any associated error message
            if (!showOtherInput) {
                otherInput.value = '';
                clearError('wynwood-other-restaurant'); // Clear any validation error for this specific input
            }
        }
    }




  // --- Google Maps Autocomplete Callback ---
  // This function is specified as the 'callback' parameter in the Google Maps API script URL.
  // It is executed automatically by the Google Maps API when the script has finished loading.
  // It initializes the Google Places Autocomplete service on the location input fields
  // and performs other initializations that depend on the Maps API being ready.
  // Returns: void
  // --- Geolocation Functionality ---
  // Attempts to get the user's current geographical location using the browser's Geolocation API
  // and reverse geocodes it to populate a specified input field.
  // Depends on the Google Maps Geocoding service being available.
  // Parameters:
  // - inputId: The ID of the input field to populate with the geocoded address.
  // Returns: void


  // --- Experience+ Specific Logic ---
  // Handles the conditional visibility and required state of the "Other Restaurant" input field
  // within the Wynwood Night experience options. This is called when the dinner preference changes.
  // Parameters:
  // - elements: Object containing references to DOM elements.
  // Returns: void
// --- UI Update Functions ---
 // Updates the visibility of UI elements within the Experience+ panel based on the selected service type
  // (Hourly Chauffeur vs. curated experiences) and specific curated experience options.
  // Parameters:
  // - elements: Object containing references to DOM elements.
  // - placeholders: Object containing placeholder texts (from config), although not directly used here, passed for consistency.
  // Returns: void
  function updateExperiencePlusPanelUI(elements, placeholders) {
      console.log("updateExperiencePlusPanelUI called");
      console.log("Experience Plus Panel Element:", elements.experiencePlusPanel);
      console.log("Service Dropdown Element:", elements.serviceDropdown);

      // Ensure essential elements for this function to operate exist.
      if (!elements.experiencePlusPanel || !elements.serviceDropdown) {
          console.warn("Experience Plus Panel or Service Dropdown is missing. Cannot update UI.");
          return; // Exit the function if required elements are missing
      }

      const selectedValue = elements.serviceDropdown.value; // Get the value of the currently selected service from the dropdown
      console.log("Selected Service Value:", selectedValue);

      // Determine which main sections within the Experience+ panel should be shown based on the selected service.
      const showHourly = selectedValue === "hourly_chauffeur"; // True if 'Hourly Chauffeur' is selected
      const showCuratedExperience = selectedValue !== "" && !showHourly; // True if any option other than default or Hourly is selected

      console.log("Show Hourly Sections:", showHourly);
      console.log("Show Curated Experience Sections:", showCuratedExperience);

      elements.hourlyDescription?.classList.toggle("hidden", !showHourly); // Show/hide the description for hourly service
      elements.durationContainer?.classList.toggle("hidden", !showHourly); // Show/hide the container for hourly duration selection
      elements.hourlyDateTimeContainer?.classList.toggle("hidden", !showHourly); // Show/hide the container for hourly date/time inputs
      elements.datePreferenceContainer?.classList.toggle("hidden", !showCuratedExperience); // Show/hide date preference options for curated experiences
      elements.commonExperienceFieldsContainer?.classList.toggle("hidden", !showCuratedExperience); // Show/hide common contact and guest fields
      elements.experienceOptionsContainer?.classList.toggle("hidden", !showCuratedExperience); // Show/hide the container holding specific experience option divs

      // Ensure the label for the hourly time input is set correctly if it exists.
      if (elements.hourlyPickupTimeLabel) {
          elements.hourlyPickupTimeLabel.textContent = "Start Time"; // Label is specifically "Start Time" for hourly
      }

      // Define an array of all specific experience option containers.
      const allExperienceOptionDivs = [
          elements.wynwoodNightOptions,
          elements.waterSkyOptions,
           elements.evergladesOptions, // Include other experience divs here
           elements.keysEscapeOptions
      ];
      // Hide all specific experience option divs initially before deciding which one to show.
      allExperienceOptionDivs.forEach(el => el?.classList.add("hidden"));

      // If a curated experience is selected, determine which specific option div to show.
      if (showCuratedExperience && elements.experienceOptionsContainer) {
          if (selectedValue === "wynwood_night" && elements.wynwoodNightOptions) {
              console.log("Displaying Wynwood Night Art & Club Options");
              elements.wynwoodNightOptions.classList.remove("hidden"); // Show the Wynwood options div
              handleWynwoodDinnerChoice(elements); // Call specific logic for handling Wynwood dinner choice UI
          } else if (selectedValue === "water_sky" && elements.waterSkyOptions) {
              console.log("Displaying Premier SUV & Yacht Day Options");
              elements.waterSkyOptions.classList.remove("hidden"); // Show the Water & Sky options div
          } else if (selectedValue === "everglades" && elements.evergladesOptions) {
               console.log("Displaying Everglades Options");
               elements.evergladesOptions.classList.remove("hidden"); // Show Everglades options div
           } else if (selectedValue === "keys_escape" && elements.keysEscapeOptions) {
               console.log("Displaying Keys Escape Options");
               elements.keysEscapeOptions.classList.remove("hidden"); // Show Keys Escape options div
           }
      } else {
          // If no curated experience is selected (or default is selected), ensure the 'Other Restaurant' input
          // for Wynwood is hidden and its value/errors are cleared.
          if (elements.wynwoodOtherRestaurantContainer) {
              elements.wynwoodOtherRestaurantContainer.classList.add("hidden"); // Hide the container
              const otherInput = elements.wynwoodOtherRestaurantContainer.querySelector("input"); // Get the input field
              if (otherInput) {
                  otherInput.value = ""; // Clear the input value
                  clearError("wynwood-other-restaurant"); // Clear any error message for this field
              }
          }
      }

      // Reset the submit button text and clear all previous validation errors after updating the UI.
      resetSubmitButton(elements);
      clearAllErrors(elements);
  }

  // Switches the active form tab and updates the UI accordingly by showing the target panel
  // and activating the corresponding tab button. Also manages focus for accessibility.
  // Parameters:
  // - targetPanelId: The ID selector of the tab panel to switch to (e.g., '#panel-oneway').
  // - elements: Object containing references to DOM elements.
  // - placeholders: Object containing placeholder texts (from config), passed for updating UI.
  // Returns: void
  function switchTab(targetPanelId, elements, placeholders) {
    console.log("Switching to tab:", targetPanelId);

    // Hide all tab panels first.
    elements.formTabPanels?.forEach(panel => panel.classList.add("hidden"));
    // Deactivate all tab navigation buttons.
    elements.tabNavigationButtons?.forEach(button => {
        button.classList.remove("active-tab"); // Remove active styling
        button.setAttribute("aria-selected", "false"); // Update ARIA selected state
        button.removeAttribute("tabindex"); // Remove tabindex from inactive tabs (they should be navigated via the active tab)
    });

    // Find the target tab panel and its corresponding tab button using the provided ID.
    const targetPanel = document.querySelector(targetPanelId);
    const targetButton = elements.tabNavigationContainer?.querySelector(`[data-tab-target="${targetPanelId}"]`);
    let firstFocusableElement = null; // Variable to store the first focusable element in the new tab

    // Activate the target tab panel by removing the 'hidden' class.
    if (targetPanel) {
        targetPanel.classList.remove("hidden"); // Show the content panel
        // Attempt to find the first focusable element within the newly shown panel for accessibility.
        // Corrected selector: Removed extra :not() from textarea
        firstFocusableElement = targetPanel.querySelector("input:not([type=\"hidden\"]):not(.sr-only):not(:disabled), select:not(:disabled), textarea:not([disabled]), button:not([disabled])");
    } else {
         console.warn(`Target tab panel with ID ${targetPanelId} not found.`);
      }

    // Activate the corresponding tab button.
    if (targetButton) {
        targetButton.classList.add("active-tab"); // Apply active styling
        targetButton.setAttribute("aria-selected", "true"); // Update ARIA selected state
        targetButton.setAttribute("tabindex", "0"); // Make the active tab button focusable via keyboard navigation
    } else {
        console.warn(`Target tab button with data-tab-target="${targetPanelId}" not found.`);
     }


    // --- Update UI elements specific to the panels being switched from/to ---
    // Define arrays of elements that are specific to the One-Way and Experience+ panels.
    const oneWayElements = [
        elements.toAddressInput?.closest(".relative"), // Container for 'To' address
        elements.oneWayPickupDateInput?.closest(".grid"), // Grid container for One-Way date/time inputs
        elements.vehicleSelectionOneway // Container for One-Way vehicle selection cards
    ];
    const expPlusElements = [
        elements.serviceDropdown?.closest(".relative"), // Container for the service dropdown
        elements.hourlyDescription, // Hourly description element
        elements.durationContainer, // Container for hourly duration
        elements.hourlyDateTimeContainer, // Container for hourly date/time inputs
        elements.datePreferenceContainer, // Container for date preference radios
        elements.commonExperienceFieldsContainer, // Container for common contact/guest fields
        elements.experienceOptionsContainer // Container for specific experience option divs
    ];

    console.log("One Way Elements to toggle visibility:", oneWayElements);
    console.log("Experience Plus Elements to toggle visibility:", expPlusElements);

    if (targetPanelId === "#panel-oneway") {
        // If switching to the One-Way tab:
        // Show elements specific to the One-Way panel.
        oneWayElements.forEach(el => el?.classList.remove("hidden"));
        // Hide elements specific to the Experience+ panel.
        expPlusElements.forEach(el => el?.classList.add("hidden"));
        // Reset the Experience+ service dropdown value to default.
        if (elements.serviceDropdown) elements.serviceDropdown.value = "";
        // Call the UI update function for the Experience+ panel to ensure its internal state is correct (hides specific options).
        updateExperiencePlusPanelUI(elements, placeholders);
    } else if (targetPanelId === "#panel-experience-plus") {
        // If switching to the Experience+ tab:
        // Hide elements specific to the One-Way panel.
        oneWayElements.forEach(el => el?.classList.add("hidden"));
        // Show elements specific to the Experience+ panel.
        expPlusElements.forEach(el => el?.classList.remove("hidden"));
        // Call the UI update function for the Experience+ panel to show/hide relevant sections based on its current dropdown selection.
        updateExperiencePlusPanelUI(elements, placeholders);

        // Additionally, clear the selection for One-Way vehicle radio buttons when switching away.
        const oneWayRadios = document.querySelectorAll("input[name=\"vehicle_type_oneway\"]");
        oneWayRadios.forEach(radio => radio.checked = false);
        // Reset the ARIA checked attribute for vehicle cards for accessibility.
        const vehicleCardRadios = document.querySelectorAll(".vehicle-card input[type=\"radio\"][name=\"vehicle_type_oneway\"]");
        vehicleCardRadios.forEach(r => r.setAttribute("aria-checked", "false"));
        // Optional: Remove a JS class if you were using one for styling selected cards.
        // document.querySelectorAll(".vehicle-card").forEach(card => {
        //     card.classList.remove("selected-card-style");
        // });

        // Ensure the service dropdown is the primary element to focus when entering the Experience+ tab.
        firstFocusableElement = elements.serviceDropdown || firstFocusableElement;
    }

    // Use a small timeout to ensure the newly visible elements are ready to receive focus.
    setTimeout(() => {
        if (firstFocusableElement) {
            firstFocusableElement.focus({ preventScroll: true }); // Set focus without changing scroll position initially
            firstFocusableElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Smoothly scroll the element into the center of the viewport
        }
    }, 50); // 50ms delay

    // Reset the submit button state and clear any validation errors after the tab switch.
    resetSubmitButton(elements);
    clearAllErrors(elements);
  }


  // Validates the form based on the currently active tab and the inputs within that tab.
  // Displays user-friendly error
