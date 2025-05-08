// formSubmission.js
// This module handles processing the form data and sending it for submission.

// Import error handling functions needed for displaying submission errors.
import { showError, clearError } from './errorHandling.js';

/**
 * Gathers and structures the form data into a JavaScript object suitable for submission.
 * Includes data specific to the active tab and selected service/experience.
 *
 * @param {object} elements - Object containing references to DOM elements (from getElementRefs).
 * @returns {object} - A data object containing the collected form data.
 */
export function processFormData(elements) {
    // Ensure the bookingForm element exists before creating FormData
    if (!elements.bookingForm) {
        console.error("Booking form element not found. Cannot process form data.");
        return {}; // Return an empty object or handle appropriately
    }

    const formData = new FormData(elements.bookingForm); // Create a FormData object from the form
    let serviceType = ''; // Variable to store the determined service type
    // Find the currently active tab button element
    const activeTabButton = elements.tabNavigationContainer?.querySelector('.active-tab');
    // Get the data-tab-target attribute value from the active button to identify the current panel
    const activePanelId = activeTabButton ? activeTabButton.getAttribute('data-tab-target') : null;

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

/**
 * Handles the asynchronous submission of the form data to the configured endpoint.
 * Updates the UI to show loading state and displays confirmation or error messages.
 *
 * @param {object} dataObject - The structured data object to submit (from processFormData).
 * @param {object} elements - Object containing references to DOM elements (from getElementRefs).
 * @param {object} config - Application configuration object, including the FORM_ENDPOINT.
 */
export function sendFormData(dataObject, elements, config) {
    // Helper functions for button state (assuming they are defined elsewhere or passed in)
    // For now, we'll assume they are available in the scope where sendFormData is called,
    // or we would need to import them or pass them as arguments.
    // Let's assume they are defined in dashboard.js and passed in the elements object or similar.
    // If they are simple functions, they could also be defined here.
    // Given their use with elements, keeping them in dashboard.js and passing elements is reasonable for now.

    // Set the submit button to a loading state while the submission is in progress.
    // Assuming setLoadingButton is accessible via elements or globally if needed
    if (typeof elements.setLoadingButton === 'function') {
        elements.setLoadingButton();
    } else {
        console.warn("setLoadingButton function not available.");
        // Fallback if function isn't passed or globally available
        if (elements.submitButton) {
             elements.submitButton.disabled = true;
             if (elements.submitButtonSpinner) elements.submitButtonSpinner.classList.remove('hidden');
             if (elements.submitButtonText) elements.submitButtonText.classList.add('hidden');
        }
    }

    // Clear any previous error message specifically for the submit button.
    clearError('submit-button');

     // Check if the form submission endpoint is configured.
     // In development, this check prevents actual submission if the placeholder is still used.
     if (!config.FORM_ENDPOINT || config.FORM_ENDPOINT === "https://formspree.io/your-endpoint" || config.FORM_ENDPOINT === "YOUR_FORMSPREE_ENDPOINT") {
          // If the endpoint is not configured, log the data and show a dev mode alert instead of submitting.
          setTimeout(() => { // Use a timeout to simulate async behavior before the alert
             console.warn("Formspree endpoint not configured. Data logged to console instead of submitting.");
             alert("DEV MODE: Form endpoint not set. Data logged to console.\n\n" + JSON.stringify(dataObject, null, 2));
             // Assuming resetSubmitButton is accessible
             if (typeof elements.resetSubmitButton === 'function') {
                 elements.resetSubmitButton();
             } else {
                 console.warn("resetSubmitButton function not available.");
                 // Fallback
                 if (elements.submitButton) {
                     elements.submitButton.disabled = false;
                     if (elements.submitButtonSpinner) elements.submitButtonSpinner.classList.add('hidden');
                     if (elements.submitButtonText) elements.submitButtonText.classList.remove('hidden');
                 }
             }
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
              // Assuming resetSubmitButton is accessible
              if (typeof elements.resetSubmitButton === 'function') {
                 elements.resetSubmitButton();
              } else {
                  console.warn("resetSubmitButton function not available.");
                  // Fallback
                  if (elements.submitButton) {
                      elements.submitButton.disabled = false;
                      if (elements.submitButtonSpinner) elements.submitButtonSpinner.classList.add('hidden');
                      if (elements.submitButtonText) elements.submitButtonText.classList.remove('hidden');
                  }
              }
          }).catch(() => {
               // Handle cases where the response is not OK, and the body is not valid JSON.
              showError(elements, 'submit-button', `Submission Error: Server returned status ${response.status}. Please try again.`);
               // Assuming resetSubmitButton is accessible
               if (typeof elements.resetSubmitButton === 'function') {
                  elements.resetSubmitButton();
               } else {
                   console.warn("resetSubmitButton function not available.");
                   // Fallback
                   if (elements.submitButton) {
                       elements.submitButton.disabled = false;
                       if (elements.submitButtonSpinner) elements.submitButtonSpinner.classList.add('hidden');
                       if (elements.submitButtonText) elements.submitButtonText.classList.remove('hidden');
                   }
               }
          });
      }
    }).catch(error => {
        console.error('Network error during form submission:', error);
        showError(elements, 'submit-button', 'Network Error: Could not connect to the server. Please check your internet connection and try again.');
        if (typeof elements.resetSubmitButton === 'function') {
            elements.resetSubmitButton();
        } else {
            console.warn("resetSubmitButton function not available.");
            if (elements.submitButton) {
                elements.submitButton.disabled = false;
                if (elements.submitButtonSpinner) elements.submitButtonSpinner.classList.add('hidden');
                if (elements.submitButtonText) elements.submitButtonText.classList.remove('hidden');
            }
        }
    });
}
