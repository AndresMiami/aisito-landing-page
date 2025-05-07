// dashboard.js
// This script handles the dynamic behavior and form submissions
// for the luxury vehicle booking dashboard page, including tab switching,
// form validation, Google Maps Autocomplete integration, and data processing.
// It aims to provide a responsive and user-friendly booking experience.
//
// NOTE: This script is tightly coupled with the booking dashboard's HTML structure and relies on
// external dependencies like Google Maps API (Places library) and Flatpickr.
// Ensure these are correctly included and the necessary HTML elements with matching IDs exist
// for the script to function correctly.

// Import functions from the maps.js module
import { loadGoogleMapsScript, initAutocomplete, getCurrentLocation } from './maps.js';

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

    return refs;
}
  
  // --- Initialize Flatpickr ---
  // Initializes the Flatpickr date and time pickers for relevant input fields.
  // Assumes the Flatpickr library is loaded globally (included via <script> tag).
  // Parameters:
  // - elements: Object containing references to DOM elements from getElementRefs().
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

  // Displays a validation or API error message below a specific form field.
  // Also applies visual styling and ARIA attributes for accessibility.
  // Parameters:
  // - elements: Object containing references to DOM elements.
  // - fieldId: The ID of the form field the error is related to.
  // - message: The error message to display.
  // Returns: void
  export function showError(elements, fieldId, message) {
    const errorSpanId = `${fieldId}-error`; // Construct the ID of the error message span
    const errorSpan = document.getElementById(errorSpanId); // Get the error span element
    // Get the input element by ID; might be null for radio/button groups where error is on a container/fieldset
    const inputElement = document.getElementById(fieldId); 
    let labelText = fieldId; // Default label text if no corresponding label found

      // --- Specific handling for different field types ---
      // Handle validation message display and styling for the Booking Time button group
      if (fieldId === 'booking-time') {
           labelText = 'Pickup Time Choice'; // Use a descriptive label for this group
           const bookingTimeErrorSpan = document.getElementById('booking-time-error'); // Get the specific error span for the buttons
           if (bookingTimeErrorSpan) {
               bookingTimeErrorSpan.textContent = message; // Display the error message directly
               bookingTimeErrorSpan.classList.remove('hidden'); // Make the error message visible
           }
           // Add error styling to the buttons or their container to highlight the issue
           elements.requestNowButton?.classList.add('border-red-500');
           elements.bookLaterButton?.classList.add('border-red-500');
           return; // Exit the function after handling this specific case
       }

      // Handle validation message display and styling for the Vehicle Type radio button group
      if (fieldId === 'vehicle_type_oneway') {
         labelText = 'Vehicle Type'; // Use a descriptive label for this group
         const fieldset = document.querySelector('#vehicle-selection-oneway fieldset'); // Find the fieldset container for the radio buttons
         const fieldsetErrorSpan = fieldset ? fieldset.querySelector('#vehicle-type-oneway-error') : null; // Find the associated error span within the fieldset
         if (fieldsetErrorSpan) {
             fieldsetErrorSpan.textContent = message; // Display the error message
             fieldsetErrorSpan.classList.remove('hidden'); // Make the error message visible
         }
         if (fieldset) {
             // Apply styling to the fieldset to indicate an error within the group
             fieldset.classList.add('ring-red-500', 'ring-1', 'rounded-md', 'p-1');
         }
         return; // Exit the function after handling this specific case
      }

      // --- General handling for standard inputs (text, select, textarea, etc.) ---
      // Attempt to find a label element associated with the input for a more user-friendly error message
      const labelElement = document.querySelector(`label[for="${fieldId}"]`) || document.getElementById(`${fieldId}-label`);
      if (labelElement) { 
          // Use the label's text content, removing potential '*' for required fields and trimming whitespace
          labelText = labelElement.textContent.replace('*', '').trim(); 
      }
      // Fallback labels for specific fields if a standard label[for] or id-label is not found
      else if (fieldId === 'date_preference') labelText = 'Preferred Timing';
      else if (fieldId === 'motivation') labelText = 'Occasion';
      else if (fieldId === 'dinner_style_preference') labelText = 'Dinner Preference';
      else if (fieldId === 'lounge_interest') labelText = 'Lounge Interest';
      else if (fieldId === 'wynwood-other-restaurant') labelText = 'Other Cuisine / Restaurant Request';
      else if (fieldId === 'pickup-date-oneway') labelText = 'Date'; // Label for the one-way pickup date input
      else if (fieldId === 'pickup-time-oneway') labelText = 'Time'; // Label for the one-way pickup time input


      // Construct the full error message including the field label for clarity
    const fullMessage = `${labelText}: ${message}`;

    // Display the message in the designated error span if it exists
    if (errorSpan) {
      errorSpan.textContent = fullMessage; // Set the text content of the error span
      errorSpan.classList.remove('hidden'); // Make the error message visible
    } else { 
        // Log a warning if the expected error span element is missing from the HTML
        console.warn(`Error span not found for ID: ${errorSpanId}. Cannot display error message: "${fullMessage}"`); 
    }

    // Apply visual styling and ARIA attributes to the input element itself to highlight the error and improve accessibility
    if (inputElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(inputElement.tagName)) {
      inputElement.classList.add('ring-red-500', 'ring-1'); // Add a red ring around the input field
      inputElement.setAttribute('aria-invalid', 'true'); // Set ARIA attribute to indicate the input has an invalid value

      // Update the aria-describedby attribute to link the input element to its error message for screen readers
      let describedBy = inputElement.getAttribute('aria-describedby') || ''; // Get existing aria-describedby value
      if (!describedBy.includes(errorSpanId)) {
           // Add the current error span's ID to aria-describedby, ensuring previous IDs are kept if they exist
          inputElement.setAttribute('aria-describedby', describedBy ? `${describedBy} ${errorSpanId}` : errorSpanId);
      }
    }
  }

  // Clears the error message, visual styling, and ARIA attributes for a specific form field.
  // Parameters:
  // - fieldId: The ID of the form field to clear the error for.
  // Returns: void
export function clearError(fieldId) {
    const errorSpanId = `${fieldId}-error`;
    const errorSpan = document.getElementById(errorSpanId);
    const inputElement = document.getElementById(fieldId);

    if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.classList.add('hidden');
    }

    if (inputElement) {
        inputElement.classList.remove('ring-red-500', 'ring-1');
        inputElement.removeAttribute('aria-invalid');
    }
}

  // Clears all validation and form-related error messages, visual styling, and ARIA attributes across the entire form.
  // Parameters:
  // - elements: Object containing references to DOM elements.
  // Returns: void
  function clearAllErrors(elements) {
    // Find all elements within the booking form with an ID ending in '-error' (convention for error spans)
    const errorSpans = elements.bookingForm?.querySelectorAll('[id$="-error"]');
    // For each identified error span, clear its text content and hide it
    errorSpans?.forEach(span => { span.textContent = ''; span.classList.add('hidden'); });

    // Find all elements within the booking form that have error styling classes (ring-red-500 or border-red-500)
    const errorInputs = elements.bookingForm?.querySelectorAll('.ring-red-500, .border-red-500');
    // For each identified element with error styling, remove the styling classes
    errorInputs?.forEach(el => el.classList.remove('ring-red-500', 'ring-1', 'rounded-md', 'p-1', 'border-red-500')); // Include removal for button/fieldset styling

    // Find all elements within the booking form with the ARIA invalid attribute
    elements.bookingForm?.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute('aria-invalid'));
    // Find all fieldset elements within the booking form with the ARIA describedby attribute (used for radio groups)
    elements.bookingForm?.querySelectorAll('fieldset[aria-describedby]').forEach(el => el.removeAttribute('aria-describedby'));

    // Explicitly call clearError for specific known error indicators that might not be caught by the general selectors
    clearError('submit-button'); // Clear any error message specifically for the submit button
    clearError('vehicle_type_oneway'); // Clear errors for the vehicle type fieldset/group
    clearError('booking-time'); // Clear errors for the booking time button group
  }

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

      // Toggle the 'hidden' class on main sections within the Experience+ panel.
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
        firstFocusableElement = targetPanel.querySelector("input:not([type=\"hidden\"]):not(.sr-only):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not([disabled])");
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
            firstFocusableElement.focus(); // Set focus to the first interactive element
        }
    }, 50); // 50ms delay

    // Reset the submit button state and clear any validation errors after the tab switch.
    resetSubmitButton(elements);
    clearAllErrors(elements);
  }


  // Validates the form based on the currently active tab and the inputs within that tab.
  // Displays user-friendly error messages next to invalid fields and logs validation failures.
  // Parameters:
  // - elements: Object containing references to DOM elements.
  // Returns: Boolean - true if the form is valid, false otherwise.
  function validateForm(elements) {
      let isValid = true; // Assume the form is valid initially
      const activeTabButton = elements.tabNavigationContainer?.querySelector('.active-tab'); // Get the active tab button
      const activePanelId = activeTabButton ? activeTabButton.getAttribute('data-tab-target') : null; // Get the ID of the active panel

      clearAllErrors(elements); // Always clear all previous errors before performing new validation

      // --- Validation logic for fields that are always visible regardless of the tab ---
      // Validate the 'From' location input field.
      if (!elements.fromLocationInput?.value.trim()) {
          showError(elements, 'from-location', 'Please enter a "From" location.'); // Display a user-friendly error message next to the input
          console.warn("Validation Failed: 'From' location is empty."); // Log the validation failure for debugging
          isValid = false; // Set the overall form validity to false
      }

      // --- Validation logic specific to the One-Way tab ---
      if (activePanelId === '#panel-oneway') {
          // Validate the 'To' address input field for the One-Way service.
          if (!elements.toAddressInput?.value.trim()) {
              showError(elements, 'to-address', 'Please enter a "To" address.');
              console.warn("Validation Failed: 'To' address is empty for One Way.");
              isValid = false;
          }

          // Validate that a Time Preference ('Request now' or 'Book for later') has been selected.
          const bookingPref = elements.bookingPreferenceInput?.value;
          if (!bookingPref) {
              showError(elements, 'booking-time', 'Please select "Request now" or "Book for later".'); // Error displayed below the buttons
              console.warn("Validation Failed: Booking time preference not selected for One Way.");
              isValid = false;
          } else if (bookingPref === 'Scheduled') {
              // If 'Book for later' is selected, validate the specific Date and Time input fields.
              if (!elements.oneWayPickupDateInput?.value) {
                  showError(elements, 'pickup-date-oneway', 'Please select a date.');
                  console.warn("Validation Failed: One-Way pickup date is empty.");
                  isValid = false;
              }
              if (!elements.oneWayPickupTimeInput?.value) {
                  showError(elements, 'pickup-time-oneway', 'Please select a time.');
                  console.warn("Validation Failed: One-Way pickup time is empty.");
                  isValid = false;
              }
          } // If bookingPref is 'ASAP', no date/time validation is needed here.

          // Validate that a Vehicle Type has been selected for the One-Way service.
          const vehicleSelectedOneway = document.querySelector('input[name="vehicle_type_oneway"]:checked');
          if (!vehicleSelectedOneway) {
              showError(elements, 'vehicle_type_oneway', 'Please select a vehicle type.'); // Error displayed near the vehicle cards fieldset
              console.warn("Validation Failed: No vehicle type selected for One Way.");
              isValid = false;
          }

      } else if (activePanelId === '#panel-experience-plus') {
          // --- Validation logic specific to the Experience+ tab ---
          const selectedService = elements.serviceDropdown.value; // Get the selected service value
          if (!selectedService) {
              showError(elements, 'experience-dropdown', 'Please select a Service.'); // Error for the service dropdown
              console.warn("Validation Failed: No service selected in Experience+ dropdown.");
              isValid = false;
          } else if (selectedService === 'hourly_chauffeur') {
              // Validation for the Hourly Chauffeur service.
              if (!elements.durationSelect?.value) {
                  showError(elements, 'duration-hourly', 'Please select duration.');
                  console.warn("Validation Failed: Hourly duration not selected.");
                  isValid = false;
              }
              if (!elements.hourlyPickupDateInput?.value) {
                  showError(elements, 'pickup-date-hourly', 'Please select a date.');
                  console.warn("Validation Failed: Hourly pickup date is empty.");
                  isValid = false;
              }
              if (!elements.hourlyPickupTimeInput?.value) {
                  showError(elements, 'pickup-time-hourly', 'Please select a start time.');
                  console.warn("Validation Failed: Hourly pickup time is empty.");
                  isValid = false;
              }
          } else { // Validation for Curated Experiences (any selected service that is not Hourly)
              // Validate common contact and guest fields for curated experiences.
              if (!elements.experienceNameInput?.value.trim()) {
                  showError(elements, 'experience-name', 'Name required.');
                  console.warn("Validation Failed: Experience name is empty.");
                  isValid = false;
              }
              if (!elements.experienceGuestsInput?.value || parseInt(elements.experienceGuestsInput.value, 10) < 1) {
                  showError(elements, 'experience-guests', 'Min 1 guest.');
                  console.warn("Validation Failed: Invalid number of guests.");
                  isValid = false;
              }
              if (!elements.experienceEmailInput?.value.trim()) {
                  showError(elements, 'experience-email', 'Email required.');
                  console.warn("Validation Failed: Experience email is empty.");
                  isValid = false;
              } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elements.experienceEmailInput.value.trim())) {
                 // Basic email format validation
                  showError(elements, 'experience-email', 'Invalid email format.');
                  console.warn("Validation Failed: Invalid email format for experience.");
                  isValid = false;
              }
              if (!elements.experiencePhoneInput?.value.trim()) {
                  showError(elements, 'experience-phone', 'Phone required.');
                  console.warn("Validation Failed: Experience phone is empty.");
                  isValid = false;
              } else if (!/^\+?[\d\s()-]{10,20}$/.test(elements.experiencePhoneInput.value) || !/[\d]{10}/.test(elements.experiencePhoneInput.value.replace(/\D/g, ''))) {
                 // Basic phone format check: allows +, digits, spaces, (), - and requires at least 10 digits after removing non-digits
                  showError(elements, 'experience-phone', 'Invalid phone format (minimum 10 digits).');
                  console.warn("Validation Failed: Invalid phone format for experience.");
                  isValid = false;
              }
              const datePrefSelected = document.querySelector('input[name="date_preference"]:checked');
              if (!datePrefSelected) {
                  showError(elements, 'date_preference', 'Please select timing preference.');
                  console.warn("Validation Failed: Date preference not selected for curated experience.");
                  isValid = false;
              }

              // --- Specific validation for Wynwood Night experience if selected ---
              if (selectedService === 'wynwood_night') {
                  const motivationSelected = document.querySelector('#wynwood-night-options input[name="motivation"]:checked');
                  const dinnerPrefSelected = document.querySelector('#wynwood-night-options input[name="dinner_style_preference"]:checked');
                  const loungeSelected = document.querySelector('#wynwood-night-options input[name="lounge_interest"]:checked');

                  if (!motivationSelected) {
                      showError(elements, 'motivation', 'Occasion required.');
                      console.warn("Validation Failed: Wynwood occasion not selected.");
                      isValid = false;
                  }
                  if (!dinnerPrefSelected) {
                      showError(elements, 'dinner_style_preference', 'Dinner preference required.');
                      console.warn("Validation Failed: Wynwood dinner preference not selected.");
                      isValid = false;
                  }
                  // If the 'Other' dinner preference is selected, validate the 'Other Restaurant' text input.
                  if (elements.wynwoodOtherDinnerRadio?.checked) {
                      const otherRestaurantInput = document.getElementById('wynwood-other-restaurant');
                      if (!otherRestaurantInput?.value.trim()) {
                          showError(elements, 'wynwood-other-restaurant', 'Please specify other preference.');
                          console.warn("Validation Failed: Wynwood 'Other' restaurant preference is empty.");
                          isValid = false;
                      }
                  }
                  if (!loungeSelected) {
                      showError(elements, 'lounge_interest', 'Lounge interest required.');
                      console.warn("Validation Failed: Wynwood lounge interest not selected.");
                      isValid = false;
                  }
              }
              // Add validation for other experiences here if their options are added to the HTML and JS
          }
      } else {
            // This case should ideally not be reached if tab switching logic is correct.
            // Log an error if no active tab panel is identified to help diagnose UI issues.
            isValid = false;
            console.error("Validation Error: No active tab panel identified for validation.");
          }

      // Log a general message indicating the overall validation outcome.
      if (!isValid) {
          console.warn("Form validation failed. Errors have been displayed to the user.");
      } else {
          console.log("Form validation passed. Ready to submit.");
      }

      return isValid; // Return the final validation result (true or false)
  }

  // --- Form Data Processing ---
  // Gathers and structures the form data into a JavaScript object suitable for submission.
  // Includes data specific to the active tab and selected service/experience.
  // Parameters:
  // - elements: Object containing references to DOM elements.
  // Returns: Object - A data object containing the collected form data.
  function processFormData(elements) {
      const formData = new FormData(elements.bookingForm); // Create a FormData object from the form
      let serviceType = ''; // Variable to store the determined service type
      const activeTabButton = elements.tabNavigationContainer?.querySelector('.active-tab'); // Get the active tab button
      const activePanelId = activeTabButton ? activeTabButton.getAttribute('data-tab-target') : null; // Get the ID of the active panel

      // Start building the data object with the 'From' location (always present)
      const dataObject = {
          'from-location': formData.get('from-location')?.trim(), // Get and trim the 'From' location value
      };

      // Add data specific to the One-Way tab if it's the active panel
      if (activePanelId === '#panel-oneway') {
          serviceType = 'One Way';
          dataObject.service_type = serviceType; // Add the service type
          dataObject['to-address'] = formData.get('to-address')?.trim(); // Get and trim the 'To' address
          dataObject.vehicle_type = formData.get('vehicle_type_oneway'); // Get the value of the selected vehicle radio button

          // Add booking preference ('ASAP' or 'Scheduled') and conditional date/time for scheduled bookings
          dataObject.booking_preference = formData.get('booking_preference');
          if (dataObject.booking_preference === 'Scheduled') {
              dataObject['pickup-date'] = formData.get('pickup-date-oneway');
              dataObject['pickup-time'] = formData.get('pickup-time-oneway');
          }
      } else if (activePanelId === '#panel-experience-plus') {
          // --- Data processing specific to the Experience+ tab ---
          const selectedServiceValue = elements.serviceDropdown.value; // Get the selected service value from the dropdown
          if (selectedServiceValue === 'hourly_chauffeur') {
              serviceType = 'Hourly';
              dataObject.service_type = serviceType;
              dataObject.experience_name = "Hourly Chauffeur"; // Set a consistent name for Hourly service
              dataObject['duration-hourly'] = formData.get('duration-hourly'); // Get hourly duration
              dataObject['pickup-date'] = formData.get('pickup-date-hourly'); // Get hourly pickup date
              dataObject['pickup-time'] = formData.get('pickup-time-hourly'); // Get hourly pickup time
          } else if (selectedServiceValue) {
              serviceType = 'Experience';
              dataObject.service_type = serviceType;
              // Get the text of the selected option from the dropdown for the experience name
              dataObject.experience_name = elements.serviceDropdown.options[elements.serviceDropdown.selectedIndex].text;
              dataObject.date_preference = formData.get('date_preference'); // Get selected date preference
              dataObject.name = formData.get('name')?.trim(); // Get and trim name
              dataObject.guests = formData.get('guests'); // Get number of guests
              dataObject.email = formData.get('email')?.trim(); // Get and trim email
              dataObject.phone = formData.get('phone')?.trim(); // Get and trim phone

              // Add data specific to the Wynwood Night experience if selected
              if (selectedServiceValue === 'wynwood_night') {
                  dataObject.motivation = formData.get('motivation'); // Get motivation selection
                  dataObject.dinner_style_preference = formData.get('dinner_style_preference'); // Get dinner preference selection
                  if (formData.get('dinner_style_preference') === 'Other') {
                        // Include the 'Other Restaurant' text if 'Other' preference is selected
                      dataObject.other_restaurant_request = formData.get('other_restaurant_request')?.trim();
                  }
                  dataObject.lounge_interest = formData.get('lounge_interest'); // Get lounge interest selection
              }
              // Add data processing for other experiences here if their options are included
          }
      }

      // Clean up the data object by removing properties with null, undefined, or empty string values.
      // This keeps the submitted data clean and avoids sending unnecessary empty fields.
      Object.keys(dataObject).forEach(key => {
           if (dataObject[key] === null || dataObject[key] === undefined || dataObject[key] === '') {
              // Special case: keep other_restaurant_request only if dinner style is 'Other', otherwise delete it if empty.
              if (key === 'other_restaurant_request' && dataObject.dinner_style_preference !== 'Other') {
                  delete dataObject[key];
              } else if (key !== 'other_restaurant_request') { // For all other keys, delete if the value is empty.
                  delete dataObject[key];
              }
           }
      });


      console.log("Final Data Object for Submission:", dataObject); // Log the final data object being submitted
      return dataObject; // Return the processed data object
    }

  // --- Form Submission ---
  // Handles the asynchronous submission of the form data to the configured endpoint.
  // Updates the UI to show loading state and displays confirmation or error messages.
  // Parameters:
  // - dataObject: The structured data object to submit (from processFormData).
  // - elements: Object containing references to DOM elements for UI updates.
  // - config: Application configuration object, including the FORM_ENDPOINT.
  // Returns: void
  function sendFormData(dataObject, elements, config) {
      // Set the submit button to a loading state while the submission is in progress.
      setLoadingButton(elements);
      // Clear any previous error message specifically for the submit button.
      clearError('submit-button');

       // Check if the form submission endpoint is configured.
       // In development, this check prevents actual submission if the placeholder is still used.
       if (!config.FORM_ENDPOINT || config.FORM_ENDPOINT === "https://formspree.io/your-endpoint" || config.FORM_ENDPOINT === "YOUR_FORMSPREE_ENDPOINT") {
            // If the endpoint is not configured, log the data and show a dev mode alert instead of submitting.
            setTimeout(() => { // Use a timeout to simulate async behavior before the alert
               console.warn("Formspree endpoint not configured. Data logged to console instead of submitting.");
               alert("DEV MODE: Form endpoint not set. Data logged to console.\n\n" + JSON.stringify(dataObject, null, 2));
               resetSubmitButton(elements); // Reset the button state after the alert
            }, 1000); // Delay of 1 second
            return; // Exit the function
        }

       // Use the Fetch API to send the form data asynchronously to the configured endpoint.
      fetch(config.FORM_ENDPOINT, {
        method: 'POST', // Use the POST method for form submission
        body: JSON.stringify(dataObject), // Send the data object as a JSON string in the request body
        headers: { 
            'Content-Type': 'application/json', // Indicate that the request body is JSON
            'Accept': 'application/json' // Request a JSON response
         }
      }).then(response => {
        // Check if the HTTP response status indicates success (e.g., 2xx)
        if (response.ok) {
            // On successful submission, hide the form content and show a confirmation message.
            const formContentContainer = elements.bookingForm.closest('.p-6'); // Find the closest container holding the form content
            const tabNav = elements.tabNavigationContainer; // Get the tab navigation container
            if (formContentContainer) formContentContainer.classList.add('hidden'); // Hide the form content
            if (tabNav) tabNav.classList.add('hidden'); // Hide the tab navigation
            if (elements.confirmationMessage) {
                elements.confirmationMessage.classList.remove('hidden'); // Show the confirmation message
                // Scroll the confirmation message into view for better user experience
                elements.confirmationMessage.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // On submission failure (non-OK status), parse the JSON response to get error details.
            response.json().then(data => {
                 // Construct an error message from the response data or a default message.
                const errorMessage = data?.errors?.map(err => err.message).join(', ') || data?.error || `Submission failed with status ${response.status}. Please check details and try again.`;
                showError(elements, 'submit-button', `Submission Error: ${errorMessage}`); // Display the error message near the submit button
                resetSubmitButton(elements); // Reset the button state from loading
            }).catch(() => {
                 // Handle cases where the response is not OK, and the body is not valid JSON.
                showError(elements, 'submit-button', `Submission Error: Server returned status ${response.status}. Please try again.`);
                resetSubmitButton(elements);
            });
        }
      }).catch(error => {
        // Handle network errors (e.g., no internet connection)
        console.error('Network error during form submission:', error); // Log the network error
        showError(elements, 'submit-button', 'Network Error: Could not connect to the server. Please check your internet connection and try again.'); // Display a user-friendly network error message
        resetSubmitButton(elements); // Reset the button state
      });
    }

    // --- Event Listener Setup ---
    // Initializes various event listeners for form interactions, tab switching, and input changes.
    // This function is called after the Google Maps API is loaded (within initAutocomplete).
    // Parameters:
    // - elements: Object containing references to DOM elements.
    // - placeholders: Object containing placeholder texts (from config).
    // - config: Application configuration object.
    // Returns: void
     function initializeEventListeners(elements, placeholders, config) {
       // Add event listener for clicks on the tab navigation container to handle tab switching.
       elements.tabNavigationContainer?.addEventListener('click', (event) => {
           const button = event.target.closest('.tab-button'); // Find the closest tab button element that was clicked
           // Check if a tab button was clicked, if it has a data-tab-target, and if it's not already the active tab.
           if (button && button.dataset.tabTarget && !button.classList.contains('active-tab')) {
               // Switch to the target tab panel specified in the data-tab-target attribute.
               switchTab(button.dataset.tabTarget, elements, placeholders);
           }
       });

       // Add event listener for changes in the Experience+ service dropdown to update the UI.
       elements.serviceDropdown?.addEventListener('change', () => {
           updateExperiencePlusPanelUI(elements, placeholders); // Update the visibility of fields based on the selected service
       });

       // NEW: Add event listeners for the One-Way Time Preference buttons ('Request now' and 'Book for later').
       elements.requestNowButton?.addEventListener('click', () => {
           clearError('booking-time'); // Clear any validation error for the booking time choice
           elements.requestNowButton.classList.add('active'); // Mark the 'Request now' button as active
           elements.bookLaterButton?.classList.remove('active'); // Ensure the 'Book for later' button is not active
           elements.scheduledBookingInputsContainer?.classList.add('hidden'); // Hide the date/time inputs for scheduled booking
           elements.bookingPreferenceInput.value = 'ASAP'; // Set the hidden input value to 'ASAP'
           // Clear any values in the scheduled date/time inputs and destroy their Flatpickr instances if they exist.
           if (elements.oneWayPickupDateInput) elements.oneWayPickupDateInput.value = '';
           if (elements.oneWayPickupTimeInput) elements.oneWayPickupTimeInput.value = '';
           if (elements.flatpickrInstances.oneWayDate) { elements.flatpickrInstances.oneWayDate.destroy(); delete elements.flatpickrInstances.oneWayDate; }
           if (elements.flatpickrInstances.oneWayTime) { elements.flatpickrInstances.oneWayTime.destroy(); delete elements.flatpickrInstances.oneWayTime; }
           clearError('pickup-date-oneway'); // Clear any error for the date input
           clearError('pickup-time-oneway'); // Clear any error for the time input
       });

       elements.bookLaterButton?.addEventListener('click', () => {
           clearError('booking-time'); // Clear any validation error for the booking time choice
           elements.bookLaterButton.classList.add('active'); // Mark the 'Book for later' button as active
           elements.requestNowButton?.classList.remove('active'); // Ensure the 'Request now' button is not active
           elements.scheduledBookingInputsContainer?.classList.remove('hidden'); // Show the date/time inputs for scheduled booking
           elements.bookingPreferenceInput.value = 'Scheduled'; // Set the hidden input value to 'Scheduled'

           // Initialize Flatpickr instances for the one-way date/time inputs if they haven't been initialized yet.
           if (!elements.flatpickrInstances.oneWayDate && elements.oneWayPickupDateInput) {
               const commonDateConfig = { altInput: true, altFormat: "D, M j, Y", dateFormat: "Y-m-d", enableTime: false, minDate: "today" };
               elements.flatpickrInstances.oneWayDate = flatpickr(elements.oneWayPickupDateInput, commonDateConfig);
           }
           if (!elements.flatpickrInstances.oneWayTime && elements.oneWayPickupTimeInput) {
                const commonTimeConfig = { enableTime: true, noCalendar: true, dateFormat: "H:i", altInput: true, altFormat: "h : i K", time_24hr: false, minuteIncrement: 10 };
               elements.flatpickrInstances.oneWayTime = flatpickr(elements.oneWayPickupTimeInput, commonTimeConfig);
           }
           // Set focus to the date input after revealing it for better user flow.
           setTimeout(() => elements.oneWayPickupDateInput?.focus(), 50); // Use a small delay to ensure element is visible and focusable
       });

       // 'Get Current Location' button listeners
       elements.getLocationButton?.addEventListener("click", async () => {
           console.log("Get Current Location button clicked.");
           try {
               // Call the imported getCurrentLocation function
               await getCurrentLocation("from-location"); // Replace "from-location" with the correct input ID if needed
               console.log("Location successfully retrieved and populated.");
           } catch (error) {
               console.error("Failed to get current location:", error);
               showError(elements, "from-location", "Unable to retrieve location. Please try again."); // Display a user-friendly error
           }
       });

       // Add listeners to standard input, select, and textarea elements to clear their specific error messages when the user interacts with them.
       elements.bookingForm?.querySelectorAll('input:not([type="radio"]):not([type="button"]):not([type="hidden"]), select, textarea').forEach(input => {
           let targetId = input.id || input.name; // Get the ID or name of the input for error clearing
           if (!targetId) return; // Skip if no ID or name is available

           // Special handling for date/time inputs initialized by Flatpickr - clear error on 'change' event.
           if (targetId === 'pickup-date-oneway' || targetId === 'pickup-time-oneway' || targetId === 'pickup-date-hourly' || targetId === 'pickup-time-hourly') {
               input.addEventListener('change', () => clearError(targetId)); // Flatpickr triggers 'change'
           } else {
               // For other inputs, clear error on 'input' (for text changes) and 'change' (for select/checkbox/radio)
               const eventType = (input.tagName === 'INPUT' && !['number', 'email', 'tel'].includes(input.type)) ? 'input' : 'change'; // Determine appropriate event type
               input.addEventListener(eventType, () => clearError(targetId));
               input.addEventListener('blur', () => clearError(targetId)); // Also clear error when the input loses focus
           }
       });

       // Add listeners to specific radio button groups (excluding vehicle_type_oneway, handled separately) to clear errors on 'change'.
       ['dinner_style_preference', 'motivation', 'lounge_interest', 'date_preference'].forEach(name => {
           document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
               radio.addEventListener('change', () => {
                   clearError(name); // Clear the error associated with the radio group name
                   // If the dinner style preference changes for Wynwood, call the specific handler.
                   if (name === 'dinner_style_preference' && elements.wynwoodNightOptions && !elements.wynwoodNightOptions.classList.contains('hidden')) {
                       handleWynwoodDinnerChoice(elements);
                   }
               });
           });
       });

        // Add listener for vehicle card radio button selection to clear the vehicle type error on 'change'.
        const vehicleCardRadios = document.querySelectorAll('.vehicle-card input[type="radio"][name="vehicle_type_oneway"]');
        vehicleCardRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                clearError('vehicle_type_oneway'); // Clear the specific error for the vehicle selection group
            });
        });


       // Add event listener for the main form submission.
       elements.bookingForm?.addEventListener('submit', (event) => {
           event.preventDefault(); // Prevent the default browser form submission

           // Validate the form. If valid, process and send the data. Otherwise, display errors.
           if (validateForm(elements)) {
               const data = processFormData(elements); // Process the form data into an object
               sendFormData(data, elements, config); // Send the processed data to the endpoint
           } else {
               // If validation fails, find the first element with an error and focus it for accessibility.
               // This includes inputs with aria-invalid, elements with border-red-500, or fieldsets with ring-red-500.
               const firstErrorField = elements.bookingForm.querySelector('[aria-invalid="true"], .border-red-500, fieldset.ring-red-500 input[type="radio"], fieldset.ring-red-500 input[type="checkbox"]');
               const firstFieldsetError = elements.bookingForm.querySelector('fieldset.ring-red-500'); // Check for fieldsets with errors
               const firstButtonError = elements.bookingForm.querySelector('.booking-time-button.border-red-500'); // Check for time preference buttons with errors

               // Determine the element to focus, prioritizing standard inputs/buttons, then radio/checkbox within fieldsets.
               let elementToFocus = firstErrorField || firstButtonError;
               if (!elementToFocus && firstFieldsetError) {
                   elementToFocus = firstFieldsetError.querySelector('input[type="radio"], input[type="checkbox"]');
               }

               // If an element with an error is found, focus it and scroll it into view.
               if (elementToFocus) {
                   elementToFocus.focus({ preventScroll: true }); // Set focus without changing scroll position initially
                   elementToFocus.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Smoothly scroll the element into the center of the viewport
               }
               // Display a general error message near the submit button indicating that there are errors to review.
                showError(elements, 'submit-button', 'Please review the errors above.');
           }
       });

        // Accessibility Boost: Add a change listener to vehicle card radio buttons to dynamically
        // update their 'aria-checked' attribute based on their checked state. This helps screen readers.
        vehicleCardRadios.forEach(radio => {
            radio.setAttribute('aria-checked', radio.checked ? 'true' : 'false'); // Set initial state
            radio.addEventListener('change', () => {
                // Update all vehicle card radios' aria-checked state when any one changes
                vehicleCardRadios.forEach(r => {
                    r.setAttribute('aria-checked', r.checked ? 'true' : 'false');
                });
            });
        });


       console.log("Event listeners initialized.");
    }


  // --- Main Execution ---
  // This block runs when the initial HTML document has been completely loaded and parsed.
  // It serves as the entry point for initializing the form's dynamic functionality.
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed. Initializing script...");
    const elementRefs = getElementRefs(); // Get references to all necessary DOM elements

    // Crucial check: Ensure the main booking form element exists.
    if (!elementRefs.bookingForm) {
        console.error("Booking form (#booking-form) not found in the DOM. Script initialization incomplete.");
        return; // Stop script execution if the main form is missing
    }

    // Initialize non-map related components and event listeners FIRST.
    initializeFlatpickr(elementRefs);
    initializeEventListeners(elementRefs, config.placeholders, config);
    initializeValidationListeners(elementRefs);

    // Set the initial active tab and update UI.
    switchTab("#panel-oneway", elementRefs, config.placeholders);

    // Make initAutocomplete globally accessible before loading the script.
    window.initAutocomplete = initAutocomplete;

    // Now, dynamically load the Google Maps script.
    loadGoogleMapsScript();

    resetSubmitButton(elementRefs); // Set the initial state and text of the submit button.

    console.log("Dashboard initialization complete (excluding async Maps load).");
});
  
  // Make the initAutocomplete function globally accessible. This is required by the Google Maps API
  // when using the 'callback=initAutocomplete' parameter in the script URL. The API
  // will look for a function with this name in the global scope (window) once it's loaded.
  window.initAutocomplete = initAutocomplete;