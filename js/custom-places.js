/**
 * Custom Google Maps Places Autocomplete
 * Implementation using the new Autocomplete Data API for full styling control
 */

class CustomPlacesAutocomplete {
  constructor() {
    // API not initialized yet
    this.isInitialized = false;
    
    // Input and dropdown references
    this.fromInput = null;
    this.toInput = null;
    this.fromDropdown = null;
    this.toDropdown = null;
    
    // Selected places data
    this.selectedPlaceFrom = null;
    this.selectedPlaceTo = null;
    
    // Active elements (during user interaction)
    this.activeInput = null;
    this.activeDropdown = null;
    
    // Configuration options
    this.options = {
      types: ['establishment', 'airport', 'lodging', 'point_of_interest', 'tourist_attraction'],
      fields: ['address_components', 'geometry', 'name', 'formatted_address', 'types', 'place_id'],
      componentRestrictions: { country: 'us' }
    };
    
    // Initialize when Google Maps API is ready
    this.waitForGoogleMaps();
  }
  
  waitForGoogleMaps() {
    // Check if Google Maps is loaded
    if (typeof google === 'undefined') {
      console.log('Waiting for Google Maps to load...');
      setTimeout(() => this.waitForGoogleMaps(), 100);
      return;
    }
    
    // Initialize the component
    this.init();
  }
  
  async init() {
    try {
      console.log('Initializing Google Maps Places API...');
      
      // Import required libraries from Google Maps API
      const { places } = await google.maps.importLibrary("places");
      
      // Create session token for API requests
      this.sessionToken = new google.maps.places.AutocompleteSessionToken();
      
      // Initialize the service
      this.placesService = new google.maps.places.AutocompleteService();
      this.placeDetailsService = new google.maps.places.PlacesService(document.createElement('div'));
      
      // Find and replace the GMP components
      this.setupInputs();
      
      // API initialization completed
      this.isInitialized = true;
      console.log('Places API initialized successfully');
    } catch (error) {
      console.error('Error initializing Places API:', error);
      setTimeout(() => this.init(), 1000);
    }
  }
  
  setupInputs() {
    // Find the GMP web components in the document
    const fromElement = document.querySelector('#from-location');
    const toElement = document.querySelector('#to-address');
    
    if (fromElement) {
      this.setupFromInput(fromElement);
    } else {
      console.warn('From location input not found');
    }
    
    if (toElement) {
      this.setupToInput(toElement);
    } else {
      console.warn('To address input not found');
    }
  }
  
  setupFromInput(element) {
    // Get parent container
    const container = element.closest('.google-maps-container');
    if (!container) {
      console.warn('Container not found for from-location');
      return;
    }
    
    // Check if this is a web component or already replaced input
    const isWebComponent = element.tagName.toLowerCase() === 'gmp-place-autocomplete';
    
    // If it's already our custom input, just store references
    if (!isWebComponent) {
      this.fromInput = element;
      
      // Find or create dropdown
      let dropdown = container.querySelector('.custom-dropdown');
      if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown hidden';
        dropdown.setAttribute('aria-hidden', 'true');
        container.appendChild(dropdown);
      }
      
      this.fromDropdown = dropdown;
      this.setupEventListeners();
      return;
    }
    
    // Create custom input element
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'from-location';
    input.className = 'custom-place-input';
    input.placeholder = element.getAttribute('placeholder') || 'Enter pickup location';
    input.required = element.hasAttribute('required');
    input.autocomplete = 'off';
    
    if (element.hasAttribute('aria-describedby')) {
      input.setAttribute('aria-describedby', element.getAttribute('aria-describedby'));
    }
    
    // Create dropdown for suggestions
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-dropdown hidden';
    dropdown.setAttribute('aria-hidden', 'true');
    
    // Replace the web component with our custom input
    element.replaceWith(input);
    container.appendChild(dropdown);
    
    // Store references
    this.fromInput = input;
    this.fromDropdown = dropdown;
    
    // Add event listeners
    this.setupEventListeners();
    
    console.log('From input setup complete');
  }
  
  setupToInput(element) {
    // Get parent container
    const container = element.closest('.google-maps-container');
    if (!container) {
      console.warn('Container not found for to-address');
      return;
    }
    
    // Check if this is a web component or already replaced input
    const isWebComponent = element.tagName.toLowerCase() === 'gmp-place-autocomplete';
    
    // If it's already our custom input, just store references
    if (!isWebComponent) {
      this.toInput = element;
      
      // Find or create dropdown
      let dropdown = container.querySelector('.custom-dropdown');
      if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown hidden';
        dropdown.setAttribute('aria-hidden', 'true');
        container.appendChild(dropdown);
      }
      
      this.toDropdown = dropdown;
      this.setupEventListeners();
      return;
    }
    
    // Create custom input element
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'to-address';
    input.className = 'custom-place-input';
    input.placeholder = element.getAttribute('placeholder') || 'Enter drop-off location';
    input.required = element.hasAttribute('required');
    input.autocomplete = 'off';
    
    if (element.hasAttribute('aria-describedby')) {
      input.setAttribute('aria-describedby', element.getAttribute('aria-describedby'));
    }
    
    // Create dropdown for suggestions
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-dropdown hidden';
    dropdown.setAttribute('aria-hidden', 'true');
    
    // Replace the web component with our custom input
    element.replaceWith(input);
    container.appendChild(dropdown);
    
    // Store references
    this.toInput = input;
    this.toDropdown = dropdown;
    
    // Add event listeners
    this.setupEventListeners();
    
    console.log('To input setup complete');
  }
  
  setupEventListeners() {
    // Check if inputs are ready
    if (!this.fromInput || !this.toInput) return;
    
    // Remove existing event listeners if any
    this.fromInput.removeEventListener('input', this._fromInputHandler);
    this.toInput.removeEventListener('input', this._toInputHandler);
    
    // Create handlers with debounce
    this._fromInputHandler = debounce((e) => this.handleInput(e, this.fromInput, this.fromDropdown), 300);
    this._toInputHandler = debounce((e) => this.handleInput(e, this.toInput, this.toDropdown), 300);
    
    // Add input event listeners
    this.fromInput.addEventListener('input', this._fromInputHandler);
    this.toInput.addEventListener('input', this._toInputHandler);
    
    // Focus event listeners
    this.fromInput.addEventListener('focus', () => this.handleFocus(this.fromInput, this.fromDropdown));
    this.toInput.addEventListener('focus', () => this.handleFocus(this.toInput, this.toDropdown));
    
    // Click outside event
    document.addEventListener('click', (e) => {
      if (!this.fromInput.contains(e.target) && !this.fromDropdown.contains(e.target)) {
        this.hideDropdown(this.fromDropdown);
      }
      
      if (!this.toInput.contains(e.target) && !this.toDropdown.contains(e.target)) {
        this.hideDropdown(this.toDropdown);
      }
    });
    
    // Keyboard navigation
    this.fromInput.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e, this.fromDropdown));
    this.toInput.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e, this.toDropdown));
    
    console.log('Event listeners added');
  }
  
  handleInput(event, input, dropdown) {
    const query = input.value.trim();
    
    if (query.length > 1) {
      this.activeInput = input;
      this.activeDropdown = dropdown;
      this.fetchPlaceSuggestions(query);
    } else {
      this.hideDropdown(dropdown);
    }
  }
  
  handleFocus(input, dropdown) {
    const query = input.value.trim();
    
    if (query.length > 1) {
      this.activeInput = input;
      this.activeDropdown = dropdown;
      this.fetchPlaceSuggestions(query);
    }
  }
  
  fetchPlaceSuggestions(query) {
    if (!this.isInitialized || !this.placesService) {
      console.warn('Places API not initialized yet');
      return;
    }
    
    console.log(`Fetching suggestions for: ${query}`);
    
    // Request using the Places Autocomplete service
    this.placesService.getPlacePredictions({
      input: query,
      sessionToken: this.sessionToken,
      types: this.options.types,
      componentRestrictions: this.options.componentRestrictions
    }, (predictions, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
        console.warn(`No predictions found: ${status}`);
        this.hideDropdown(this.activeDropdown);
        return;
      }
      
      // Display the suggestions
      this.displaySuggestions(predictions);
    });
  }
  
  displaySuggestions(predictions) {
    if (!this.activeDropdown) return;
    
    // Clear previous suggestions
    this.activeDropdown.innerHTML = '';
    
    if (!predictions || predictions.length === 0) {
      this.hideDropdown(this.activeDropdown);
      return;
    }
    
    console.log(`Displaying ${predictions.length} suggestions`);
    
    // Create and add suggestion items
    predictions.forEach(prediction => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      
      // Check if it's an airport
      const isAirport = prediction.types && prediction.types.includes('airport');
      
      // Create main text element
      const mainText = document.createElement('div');
      mainText.className = 'suggestion-main-text';
      mainText.textContent = prediction.structured_formatting?.main_text || prediction.description;
      if (isAirport) {
        mainText.classList.add('airport-text');
      }
      
      // Create secondary text element
      const secondaryText = document.createElement('div');
      secondaryText.className = 'suggestion-secondary-text';
      secondaryText.textContent = prediction.structured_formatting?.secondary_text || '';
      
      item.appendChild(mainText);
      item.appendChild(secondaryText);
      
      // Add airport icon if applicable
      if (isAirport) {
        const airportIcon = document.createElement('span');
        airportIcon.className = 'airport-icon';
        airportIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z"/></svg>';
        item.appendChild(airportIcon);
      }
      
      // Add click handler
      item.addEventListener('click', () => {
        this.handlePlaceSelect(prediction);
      });
      
      // Add to dropdown
      this.activeDropdown.appendChild(item);
    });
    
    // Show dropdown
    this.showDropdown();
  }
  
  showDropdown() {
    if (this.activeDropdown) {
      this.activeDropdown.classList.remove('hidden');
      this.activeDropdown.setAttribute('aria-hidden', 'false');
    }
  }
  
  hideDropdown(dropdown) {
    if (dropdown) {
      dropdown.classList.add('hidden');
      dropdown.setAttribute('aria-hidden', 'true');
    }
  }
  
  handlePlaceSelect(prediction) {
    if (!this.placeDetailsService) return;
    
    console.log(`Selected place: ${prediction.description}`);
    
    // Get details for the selected place
    this.placeDetailsService.getDetails({
      placeId: prediction.place_id,
      fields: this.options.fields,
      sessionToken: this.sessionToken
    }, (place, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
        console.error(`Error fetching place details: ${status}`);
        return;
      }
      
      // Update the input with the selected place name
      this.activeInput.value = prediction.structured_formatting?.main_text || prediction.description;
      
      // Store the selected place data
      if (this.activeInput === this.fromInput) {
        this.selectedPlaceFrom = place;
        this.checkAirportSelection(place, 'from');
        
        // Update hidden field with place data
        this.updateHiddenField('from-location-data', JSON.stringify({
          name: place.name,
          address: place.formatted_address,
          placeId: place.place_id,
          location: {
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng()
          }
        }));
        
        // Trigger input event for validation
        this.fromInput.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        this.selectedPlaceTo = place;
        this.checkAirportSelection(place, 'to');
        
        // Update hidden field with place data
        this.updateHiddenField('to-address-data', JSON.stringify({
          name: place.name,
          address: place.formatted_address,
          placeId: place.place_id,
          location: {
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng()
          }
        }));
        
        // Trigger input event for validation
        this.toInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Hide dropdown
      this.hideDropdown(this.activeDropdown);
      
      // Create a new session token for next search
      this.sessionToken = new google.maps.places.AutocompleteSessionToken();
      
      console.log('Place selection complete');
    });
  }
  
  updateHiddenField(id, value) {
    let hiddenField = document.getElementById(id);
    
    if (!hiddenField) {
      hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.id = id;
      hiddenField.name = id;
      
      const form = this.fromInput.closest('form');
      if (form) {
        form.appendChild(hiddenField);
      } else {
        document.body.appendChild(hiddenField);
      }
    }
    
    hiddenField.value = value;
  }
  
  checkAirportSelection(place, direction) {
    const isAirport = place.types && place.types.includes('airport');
    
    if (isAirport) {
      // Add special styling to the input
      this.activeInput.classList.add('airport-input');
      
      // Trigger custom event for airport selection
      const airportEvent = new CustomEvent('airport-selected', {
        detail: {
          direction: direction,
          airportName: place.name,
          placeId: place.place_id,
          location: {
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng()
          }
        },
        bubbles: true
      });
      
      document.dispatchEvent(airportEvent);
      console.log(`Airport detected: ${place.name}`);
    } else {
      this.activeInput.classList.remove('airport-input');
    }
  }
  
  handleKeyboardNavigation(event, dropdown) {
    if (!dropdown) return;
    
    const suggestions = dropdown.querySelectorAll('.suggestion-item');
    const activeIndex = Array.from(suggestions).findIndex(item => item.classList.contains('active'));
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        
        // Show dropdown if hidden but has input
        if (dropdown.classList.contains('hidden')) {
          if (event.target.value.trim().length > 1) {
            this.activeInput = event.target;
            this.activeDropdown = dropdown;
            this.fetchPlaceSuggestions(event.target.value.trim());
          }
          return;
        }
        
        // Move selection down
        if (activeIndex < suggestions.length - 1)
          if