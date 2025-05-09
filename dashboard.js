// dashboard.js
console.log("dashboard.js script started."); // Added debug log

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
 export function getElementRefs() { // Exported here
    const refs = {};
    // Main form and tab navigation elements
    refs.bookingForm = document.getElementById("booking-form"); // The main form element by its ID
    refs.tabNavigationContainer = document.getElementById("tab-navigation"); // Container for the tab buttons
    refs.tabNavigationButtons = refs.tabNavigationContainer?.querySelectorAll(".tab-button"); // NodeList of all tab buttons
    refs.formTabPanels = refs.bookingForm?.querySelectorAll(".tab-panel"); // NodeList of all tab content panels

    // One-Way Specific Elements
    refs.oneWayPanel = document.getElementById("panel-oneway"); // The One-Way booking panel element
    // Reference the gmp-place-autocomplete elements directly
    refs.fromLocationInput = document.getElementById("from-location"); // gmp-place-autocomplete element
    refs.toAddressInput = document.getElementById("to-address"); // gmp-place-autocomplete element

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
    refs.evergladesOptions = document.getElementById('everglades-options'); // Reference for Everglades options
    refs.keysEscapeOptions = document.getElementById('keys-escape-options'); // Reference for Keys Escape options
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

    // Initialize pickers for Hourly fields if the corresponding input elements exist
    // One-Way pickers are initialized when 'Book for later' button is clicked
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
        elements.submitButton.setAttribute('aria-disabled', 'false'); // Update ARIA attribute
        elements.submitButton.removeAttribute('title'); // Remove title attribute
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
        elements.submitButton.setAttribute('aria-disabled', 'true'); // Update ARIA attribute
        elements.submitButton.setAttribute('aria-busy', 'true'); // Indicate busy state for accessibility
        elements.submitButton.setAttribute('title', 'Processing...'); // Add a title for hover state

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
          return; // Exit the function if required elements is missing
      }

      const selectedValue = elements.serviceDropdown.value; // Get the value of the currently selected service from the dropdown
      console.log("Selected Service Value:", selectedValue);

      // Determine which main sections within the Experience+ panel should be shown based on the selected service.
      const showHourly = selectedValue === "hourly_chauffeur"; // True if 'Hourly Chauffeur' is selected
      const showCuratedExperience = selectedValue !== "" && !showHourly; // True if any option other than default or Hourly is selected

      console.log("Show Hourly Sections:", showHourly);
      console.log("Show Curated Experience Sections:", showCuratedExperience);

      // Use optional chaining and check for element existence before toggling classes
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
                  clearError("wynwood-other-restaurant"); // Clear any validation error for this specific input
              }
          }
      }

      // Reset the submit button text and clear all previous validation errors after updating the UI.
      resetSubmitButton(elements);
      clearAllErrors(elements); // Clear errors after tab switch
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
        // Corrected selector to include gmp-place-autocomplete
        firstFocusableElement = targetPanel.querySelector("input:not([type=\"hidden\"]):not(.sr-only):not(:disabled), select:not(:disabled), textarea:not([disabled]), button:not([disabled]), gmp-place-autocomplete:not(:disabled)");
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
    // Use optional chaining for safety
    const oneWayElements = [
        elements.toAddressInput?.closest(".relative"), // Container for 'To' address
        elements.scheduledBookingInputsContainer, // Container for One-Way scheduled date/time inputs
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

         // Ensure the correct booking preference button is active or neither if no default
         // Check if either button has the 'active' class, otherwise default to 'Request now' or leave both inactive
         const requestNowActive = elements.requestNowButton?.classList.contains('active');
         const bookLaterActive = elements.bookLaterButton?.classList.contains('active');

         if (!requestNowActive && !bookLaterActive) {
             // Default to 'Request now' if neither is active on tab switch
             elements.requestNowButton?.classList.add('active');
             elements.bookingPreferenceInput.value = 'ASAP';
             elements.scheduledBookingInputsContainer?.classList.add('hidden');
         } else if (requestNowActive) {
             // If 'Request now' was active, ensure scheduled inputs are hidden
             elements.scheduledBookingInputsContainer?.classList.add('hidden');
         } else if (bookLaterActive) {
             // If 'Book for later' was active, ensure scheduled inputs are shown and Flatpickr initialized
             elements.scheduledBookingInputsContainer?.classList.remove('hidden');
             // Re-initialize Flatpickr if needed (the event listener handles this, but good to be sure)
             // This part is handled by the click listener for bookLaterButton now,
             // but ensure the container is visible.
         }


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
         // Clear any errors related to the One-Way vehicle selection
         clearError('vehicle_type_oneway');


        // Ensure the service dropdown is the primary element to focus when entering the Experience+ tab.
        firstFocusableElement = elements.serviceDropdown || firstFocusableElement;
    }

    // Use a small timeout to ensure the newly visible elements are ready to receive focus.
    setTimeout(() => {
        if (firstFocusableElement) {
            firstFocusableElement.focus({ preventScroll: true }); // Set focus without changing scroll position initially
            // Use a slightly longer delay before scrolling to give focus time to settle
            setTimeout(() => {
                 firstFocusableElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Smoothly scroll the element into the center of the viewport
            }, 100); // 100ms delay for scroll
        }
    }, 50); // 50ms delay for initial focus attempt

    // Reset the submit button state and clear any validation errors after the tab switch.
    resetSubmitButton(elements);
    clearAllErrors(elements); // Ensure all errors are cleared on tab switch
  }


  // Validates the form based on the currently active tab and the inputs within that tab.
  // Displays user-friendly error
// --- Event Listener Setup ---
// Sets up all necessary event listeners for tab switching, form submission,
// input changes, etc.
// Parameters:
// - elements: Object containing references to DOM elements.
// - placeholders: Object containing placeholder texts (from config).
// - config: Application configuration object.
// Returns: void
function initializeEventListeners(elements, placeholders, config) {
    console.log("Event listeners initialized.");

    // Event listeners for tab switching buttons
    elements.tabNavigationContainer?.addEventListener('click', (event) => {
        const button = event.target.closest('.tab-button');
        // Check if the clicked element is a tab button and not already the active tab
        if (button && button.dataset.tabTarget && !button.classList.contains('active-tab')) {
            // Call the switchTab function with the target panel ID
            switchTab(button.dataset.tabTarget, elements, placeholders);
        }
    });

    // Event listener for the Experience+ service dropdown to update UI
    elements.serviceDropdown?.addEventListener('change', () => {
        updateExperiencePlusPanelUI(elements, placeholders);
    });

    // Event listeners for One-Way booking preference buttons ('Request now' / 'Book for later')
    elements.requestNowButton?.addEventListener('click', () => {
        console.log("'Request now' button clicked.");
        clearError('booking-time'); // Clear any previous error for this button group
        elements.requestNowButton.classList.add('active'); // Add active styling
        elements.bookLaterButton?.classList.remove('active'); // Remove active styling from the other button
        elements.scheduledBookingInputsContainer?.classList.add('hidden'); // Hide the scheduled date/time inputs
        elements.bookingPreferenceInput.value = 'ASAP'; // Set the hidden input value

        // Clear scheduled inputs and destroy flatpickr instances if they exist
        // This prevents submitting old scheduled data if the user switches back to ASAP
        if (elements.oneWayPickupDateInput) elements.oneWayPickupDateInput.value = '';
        if (elements.oneWayPickupTimeInput) elements.oneWayPickupTimeInput.value = '';
        // Destroy Flatpickr instances to clean up resources and prevent potential issues
        if (elements.flatpickrInstances && elements.flatpickrInstances.oneWayDate) { elements.flatpickrInstances.oneWayDate.destroy(); delete elements.flatpickrInstances.oneWayDate; }
        if (elements.flatpickrInstances && elements.flatpickrInstances.oneWayTime) { elements.flatpickrInstances.oneWayTime.destroy(); delete elements.flatpickrInstances.oneWayTime; }
        // Clear errors specifically for the scheduled date/time inputs
        clearError('pickup-date-oneway');
        clearError('pickup-time-oneway');
        // Reset submit button state as form validity might change
        resetSubmitButton(elements);
    });

    elements.bookLaterButton?.addEventListener('click', () => {
        console.log("'Book for later' button clicked.");
        clearError('booking-time'); // Clear any previous error for this button group
        elements.bookLaterButton.classList.add('active'); // Add active styling
        elements.requestNowButton?.classList.remove('active'); // Remove active styling from the other button
        elements.scheduledBookingInputsContainer?.classList.remove('hidden'); // Show the scheduled date/time inputs
        elements.bookingPreferenceInput.value = 'Scheduled'; // Set the hidden input value

        // Initialize Flatpickr for one-way inputs if not already done
        // This ensures Flatpickr is only initialized when the user needs it
        // Store Flatpickr instances on the elements object for later destruction
        elements.flatpickrInstances = elements.flatpickrInstances || {}; // Ensure the object exists

        if (!elements.flatpickrInstances.oneWayDate && elements.oneWayPickupDateInput) {
            const commonDateConfig = { altInput: true, altFormat: "D, M j, Y", dateFormat: "Y-m-d", enableTime: false, minDate: "today" };
            elements.flatpickrInstances.oneWayDate = flatpickr(elements.oneWayPickupDateInput, commonDateConfig);
        }
        if (!elements.flatpickrInstances.oneWayTime && elements.oneWayPickupTimeInput) {
             const commonTimeConfig = { enableTime: true, noCalendar: true, dateFormat: "H:i", altInput: true, altFormat: "h : i K", time_24hr: false, minuteIncrement: 10 };
             elements.flatpickrInstances.oneWayTime = flatpickr(elements.oneWayPickupTimeInput, commonTimeConfig);
        }
        // Focus the date input after revealing the scheduled inputs for better UX
        setTimeout(() => elements.oneWayPickupDateInput?.focus(), 50);
         // Reset submit button state as form validity might change
         resetSubmitButton(elements);
    });


    // Add input event listeners for real-time error clearing on key fields
    // This helps clear validation errors as the user types or changes input
    // Include gmp-place-autocomplete elements in the selector
    elements.bookingForm?.querySelectorAll('input:not([type="radio"]):not([type="button"]), select, textarea, gmp-place-autocomplete').forEach(input => {
        let targetId = input.id || input.name; // Use ID or name as a fallback for error targeting
        if (!targetId) return; // Skip if no ID or name is available

        // Determine the event type based on the input type for optimal performance
        // 'input' is good for text fields, 'change' for selects, dates, times, etc.
        // gmp-place-autocomplete fires 'input' events as the user types
        const eventType = (input.tagName === 'INPUT' || input.tagName === 'GMP-PLACE-AUTOCOMPLETE' && !['number', 'email', 'tel', 'date', 'time'].includes(input.type)) ? 'input' : 'change';

        // Add the event listener to clear the error when the input changes
        input.addEventListener(eventType, () => {
            console.log(`Input event on ${targetId}, clearing error.`);
            clearError(targetId);
            // Re-evaluate submit button state on input change
            resetSubmitButton(elements);
        });
        // Also clear the error when the input loses focus (blur)
        input.addEventListener('blur', () => {
             console.log(`Blur event on ${targetId}, clearing error.`);
             clearError(targetId);
             // Re-evaluate submit button state on blur (useful for required fields)
             resetSubmitButton(elements);
        });
    });

    // Add listeners to specific radio groups (excluding vehicle_type_oneway, handled separately)
    // This clears the group's error when a radio button within it is selected
    ['dinner_style_preference', 'motivation', 'lounge_interest', 'date_preference'].forEach(name => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            radio.addEventListener('change', () => {
                console.log(`Radio change event on ${name}, clearing error.`);
                clearError(name); // Clear error for the group using the name
                // Special handling for Wynwood 'Other' dinner preference
                if (name === 'dinner_style_preference' && elements.wynwoodNightOptions && !elements.wynwoodNightOptions.classList.contains('hidden')) {
                    handleWynwoodDinnerChoice(elements);
                }
                 // Re-evaluate submit button state on radio change
                 resetSubmitButton(elements);
            });
        });
    });

     // Add listener for vehicle card selection (clears error on change)
     // This clears the specific error message for the vehicle type group
     const vehicleCardRadios = document.querySelectorAll('.vehicle-card input[type="radio"][name="vehicle_type_oneway"]');

     vehicleCardRadios.forEach(radio => {
         radio.addEventListener('change', () => {
             console.log("Vehicle radio change event, clearing error for vehicle_type_oneway.");
             clearError('vehicle_type_oneway'); // Clear the specific error for the vehicle group
             // Re-evaluate submit button state on vehicle selection change
             resetSubmitButton(elements);
         });
     });

     // Add event listener for the "Get Current Location" button if it exists
     const getLocationButton = document.getElementById("get-location-button"); // Get the button reference here
     if (getLocationButton) {
         getLocationButton.addEventListener('click', (event) => {
             console.log("'Get Current Location' button clicked.");
             event.preventDefault(); // Prevent default button behavior (like form submission)
             // Call the getCurrentLocation function from maps.js for the 'from-location' input
             // Need elements here, so get them inside the listener or pass them
             const elements = getElementRefs(); // Get elements when button is clicked
             getCurrentLocation('from-location', elements); // Pass elements to getCurrentLocation
         });
     }


    console.log("Event listeners initialized.");
}


// --- Main Initialization Logic ---
// This function runs when the DOM is fully loaded.
function initializeDashboard() {
    console.log("DOM fully loaded. Initializing dashboard.");
    // Get references to all necessary DOM elements
    const elements = getElementRefs();

    // Initialize Flatpickr date/time pickers (Hourly pickers are initialized here, One-Way deferred)
    // Note: One-Way pickers are now initialized when 'Book for later' button is clicked
    initializeFlatpickr(elements);

    // Initialize all event listeners for UI interactions and form handling
    initializeEventListeners(elements, config.placeholders, config);

    // --- Crucial Step: Load Google Maps Script ---
    // Call the function from maps.js to dynamically load the Google Maps API script.
    // This is necessary for the Places Autocomplete service to work.
    // Pass elements so that showError can be called from maps.js if the script fails to load.
    loadGoogleMapsScript(elements);


    // Set up the initial active tab state (e.g., default to the One-Way tab)
    // Find the button that is initially marked as active (e.g., via CSS class)
    const defaultTabButton = elements.tabNavigationContainer?.querySelector('.tab-button.active-tab');
    if (defaultTabButton) {
         // Get the target panel ID from the data attribute of the default active button
         const defaultPanelId = defaultTabButton.getAttribute('data-tab-target');
         if (defaultPanelId) {
             // Use a small timeout to ensure other initializations (like element references and event listeners)
             // have completed before switching the tab and potentially focusing an element.
             setTimeout(() => {
                 switchTab(defaultPanelId, elements, config.placeholders);
             }, 0); // 0ms timeout pushes the task to the end of the current event loop
         }
    } else {
        // Fallback: if no default active tab is specified in the HTML, default to the first panel found.
        const firstPanel = elements.formTabPanels?.[0];
        if (firstPanel) {
             const firstPanelId = '#' + firstPanel.id;
             setTimeout(() => {
                switchTab(firstPanelId, elements, config.placeholders);
             }, 0);
        }
    }

    // Initial update of the submit button text based on the default active tab
    resetSubmitButton(elements);

    // Note: The "Get Current Location" button listener is now added inside initializeEventListeners
    // to ensure it's set up alongside other form element listeners.
}

// Ensure the dashboard initializes only after the DOM is fully loaded.
// This is the main entry point for the module script.
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Make initAutocomplete globally accessible for the Google Maps API callback
// This is crucial if you are loading the Maps script using the `callback=initAutocomplete` parameter
// in the script URL (which loadGoogleMapsScript in maps.js does).
// We assign the imported initAutocomplete function to the window object.
window.initAutocomplete = initAutocomplete;

// Note: The getElementRefs function is exported so it can be used by maps.js
// Export other functions from dashboard.js if they need to be called from other modules.
// For example, if maps.js needed to call switchTab or updateExperiencePlusPanelUI,
// you would export them here. Based on the current maps.js, only getElementRefs is needed.
// The button state functions (setLoadingButton, resetSubmitButton) are passed directly to sendFormData.
// export { getElementRefs }; // Removed duplicate export

