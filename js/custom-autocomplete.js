// custom-autocomplete.js
// This file implements the programmatic Autocomplete Data API

// Global session token for billing efficiency 
// Use the one created in the main script if available
let sessionToken = window.googleSessionToken || null;

// Expose the function to the global scope immediately
window.initCustomAutocomplete = async function() {
  console.log("Initializing custom autocomplete with programmatic API");
  
  try {
    // Create a session token if not already created
    if (!sessionToken) {
      sessionToken = new google.maps.places.AutocompleteSessionToken();
    }
    
    // Initialize your autocomplete functionality
    const fromInput = document.getElementById("from-location");
    const toInput = document.getElementById("to-address");
    const fromDropdown = document.getElementById("from-location-dropdown");
    const toDropdown = document.getElementById("to-address-dropdown");
    
    if (fromInput && fromDropdown) {
      setupAutocomplete(fromInput, fromDropdown, "from-location");
    }
    
    if (toInput && toDropdown) {
      setupAutocomplete(toInput, toDropdown, "to-address");
    }
    
    console.log("Custom autocomplete initialized successfully");
  } catch (error) {
    console.error("Error initializing custom autocomplete:", error);
  }
}

// Initialize the custom autocomplete functionality
async function initCustomAutocomplete( ) {
  console.log("Initializing custom autocomplete with programmatic API");
  
  try {
    // Create a session token if not already created
    if (!sessionToken) {
      if (typeof AutocompleteSessionToken !== "undefined") {
        sessionToken = new google.maps.places.AutocompleteSessionToken();
      } else {
        console.error("AutocompleteSessionToken is undefined. Ensure proper initialization.");
        return;
      }
    }
    
    // Import the Places library with the new API
    const { AutocompleteSuggestion, Place } = await google.maps.importLibrary("places");
    
    // Get references to the input elements
    const fromInput = document.getElementById("from-location");
    const toInput = document.getElementById("to-address");
    
    // Get references to the dropdown containers
    const fromDropdown = document.getElementById("from-location-dropdown");
    const toDropdown = document.getElementById("to-address-dropdown");
    
    // Set up event listeners for the from input
    if (fromInput && fromDropdown) {
      setupAutocomplete(fromInput, fromDropdown, "from-location");
    } else {
      console.error("From location input or dropdown not found");
    }
    
    // Set up event listeners for the to input
    if (toInput && toDropdown) {
      setupAutocomplete(toInput, toDropdown, "to-address");
    } else {
      console.error("To address input or dropdown not found");
    }
    
    // Hide dropdowns when clicking outside
    document.addEventListener("click", (event) => {
      if (!fromInput.contains(event.target) && !fromDropdown.contains(event.target)) {
        fromDropdown.classList.add("hidden");
      }
      if (!toInput.contains(event.target) && !toDropdown.contains(event.target)) {
        toDropdown.classList.add("hidden");
      }
    });
    
    console.log("Custom autocomplete initialized successfully");
    
  } catch (error) {
    console.error("Error initializing custom autocomplete:", error);
  }
}

// Set up autocomplete for an input field
function setupAutocomplete(input, dropdown, inputId) {
  // Define the Miami area bounds to bias results towards Miami
  const miamiArea = new google.maps.LatLngBounds(
    new google.maps.LatLng(25.6, -80.5),
    new google.maps.LatLng(26.2, -80.0)
  );
  
  // Create autocomplete service
  const autocompleteService = new google.maps.places.AutocompleteService();
  const placesService = new google.maps.places.PlacesService(document.createElement('div'));
  
  // Add input event listener
  let debounceTimer;
  input.addEventListener("input", () => {
    // Clear previous timer
    clearTimeout(debounceTimer);
    
    // Set a new timer to avoid too many API calls
    debounceTimer = setTimeout(() => {
      if (input.value.length < 3) {
        dropdown.classList.add("hidden");
        return;
      }
      
      autocompleteService.getPlacePredictions({
        input: input.value,
        sessionToken: sessionToken,
        types: ["establishment", "geocode", "airport", "lodging", "point_of_interest"],
        componentRestrictions: { country: "us" },
        bounds: miamiArea,
        strictBounds: false
      }, (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          dropdown.classList.add("hidden");
          return;
        }
        
        // Display the suggestions - passing predictions directly
        displaySuggestions(predictions, dropdown, input, inputId, placesService);
      });
    }, 300); // 300ms debounce
  });
  
  // Add focus event to show suggestions again if there's input
  input.addEventListener("focus", () => {
    if (input.value.length >= 3) {
      // Reuse the input event handler
      input.dispatchEvent(new Event("input"));
    }
  });
}

// Display suggestions in the dropdown
function displaySuggestions(predictions, dropdown, input, inputId, placesService) {
  // Clear previous suggestions
  dropdown.innerHTML = "";
  
  if (!predictions || predictions.length === 0) {
    dropdown.classList.add("hidden");
    return;
  }
  
  // Create suggestion elements
  predictions.forEach((prediction) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    
    // Check if it's an airport
    const isAirport = prediction.types && prediction.types.includes("airport");
    
    // Create main text element
    const mainText = document.createElement("div");
    mainText.className = "suggestion-main-text";
    mainText.textContent = prediction.structured_formatting?.main_text || prediction.description;
    
    if (isAirport) {
      mainText.classList.add("airport-text");
    }
    
    // Create secondary text element
    const secondaryText = document.createElement("div");
    secondaryText.className = "suggestion-secondary-text";
    secondaryText.textContent = prediction.structured_formatting?.secondary_text || "";
    
    // Add elements to item
    item.appendChild(mainText);
    item.appendChild(secondaryText);
    
    // Add airport icon if it's an airport
    if (isAirport) {
      const airportIcon = document.createElement("span");
      airportIcon.className = "airport-icon";
      airportIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z"/></svg>';
      item.appendChild(airportIcon);
    }
    
    // Add click event listener
    item.addEventListener("click", () => {
      // Set input value
      input.value = prediction.structured_formatting?.main_text || prediction.description;
      
      // Hide dropdown
      dropdown.classList.add("hidden");
      
      // Get place details
      placesService.getDetails({
        placeId: prediction.place_id,
        fields: ['address_components', 'geometry', 'name', 'formatted_address', 'types', 'place_id']
      }, (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          console.error("Error fetching place details:", status);
          return;
        }
        
        // Store location data as data attributes
        input.dataset.latitude = place.geometry?.location.lat();
        input.dataset.longitude = place.geometry?.location.lng();
        input.dataset.placeId = place.place_id;
        input.dataset.address = place.formatted_address;
        
        // Check if it's an airport
        const isAirport = place.types?.includes("airport");
        
        // Update airport field visibility
        updateAirportFieldVisibility(inputId, isAirport);
        
        // Trigger input event for form validation
        const inputEvent = new Event("input", { bubbles: true });
        input.dispatchEvent(inputEvent);
        
        // Create a new session token after selection
        sessionToken = new google.maps.places.AutocompleteSessionToken();
        
        console.log(`Selected place: ${place.name}`);
      });
    });
    
    // Add keyboard navigation
    item.addEventListener("mouseenter", () => {
      // Remove active class from all items
      dropdown.querySelectorAll(".suggestion-item").forEach((el) => {
        el.classList.remove("active");
      });
      // Add active class to this item
      item.classList.add("active");
    });
    
    // Add item to dropdown
    dropdown.appendChild(item);
  });
  
  // Show dropdown
  dropdown.classList.remove("hidden");
}

// Function to update airport field visibility
function updateAirportFieldVisibility(addressInputId, isAirport) {
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

  // Some containers might not exist yet in the form, this is expected
  if (!typeContainer || !notesContainer) {
    console.log(`Airport-related elements (e.g., #${typeContainerId}) not found for ${addressInputId}. This might be normal if they get created dynamically.`);
  }

  if (isAirport) {
    // Add airport styling to input
    document.getElementById(addressInputId).classList.add("airport-input");
    
    // Display airport-specific fields if they exist
    if (typeContainer) typeContainer.classList.remove("hidden");
    if (notesContainer) notesContainer.classList.remove("hidden");
    if (hiddenInput) hiddenInput.value = "true";
    
    // Trigger an event that can be listened for to create fields if needed
    const airportEvent = new CustomEvent("airport-selected", {
      detail: {
        inputId: addressInputId,
        isAirport: true
      },
      bubbles: true
    });
    document.getElementById(addressInputId).dispatchEvent(airportEvent);
  } else {
    // Remove airport styling from input
    document.getElementById(addressInputId).classList.remove("airport-input");
    
    // Hide airport-specific fields if they exist
    if (typeContainer) typeContainer.classList.add("hidden");
    if (notesContainer) notesContainer.classList.add("hidden");
    if (hiddenInput) hiddenInput.value = "false";
    if (typeInput) typeInput.selectedIndex = 0;
    if (notesInput) notesInput.value = "";
    
    // Trigger an event that can be listened for
    const airportEvent = new CustomEvent("airport-selected", {
      detail: {
        inputId: addressInputId,
        isAirport: false
      },
      bubbles: true
    });
    document.getElementById(addressInputId).dispatchEvent(airportEvent);
  }
}

// Add keyboard navigation for the dropdowns
function addKeyboardNavigation() {
  const inputs = ["from-location", "to-address"];
  
  inputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}-dropdown`);
    
    if (!input || !dropdown) return;
    
    input.addEventListener("keydown", (event) => {
      if (dropdown.classList.contains("hidden")) {
        // If dropdown is hidden and user presses down arrow, show it
        if (event.key === "ArrowDown" && input.value.length >= 3) {
          event.preventDefault();
          input.dispatchEvent(new Event("input"));
          return;
        }
        return;
      }
      
      const items = dropdown.querySelectorAll(".suggestion-item");
      const activeItem = dropdown.querySelector(".suggestion-item.active");
      let activeIndex = -1;
      
      if (activeItem) {
        activeIndex = Array.from(items).indexOf(activeItem);
      }
      
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (activeIndex < items.length - 1) {
            if (activeItem) activeItem.classList.remove("active");
            items[activeIndex + 1].classList.add("active");
            items[activeIndex + 1].scrollIntoView({ block: "nearest" });
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (activeIndex > 0) {
            if (activeItem) activeItem.classList.remove("active");
            items[activeIndex - 1].classList.add("active");
            items[activeIndex - 1].scrollIntoView({ block: "nearest" });
          }
          break;
        case "Enter":
          event.preventDefault();
          if (activeItem) {
            activeItem.click();
          }
          break;
        case "Escape":
          event.preventDefault();
          dropdown.classList.add("hidden");
          break;
      }
    });
  });
}

// IMPORTANT: Move this line to the top of the file
// window.initCustomAutocomplete = initCustomAutocomplete;

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", () => {
    initCustomAutocomplete();
});

// DON'T repeat this here - it should be at the top of the file
// window.initCustomAutocomplete = initCustomAutocomplete; // Remove this line
