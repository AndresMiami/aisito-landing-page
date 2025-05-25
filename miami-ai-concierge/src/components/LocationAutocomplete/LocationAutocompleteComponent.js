class LocationAutocompleteComponent extends BaseComponent {
  async onInitialize() {
    console.log('🌍 Initializing LocationAutocomplete component');

    this.inputElement = DOMManager.getElement('#location-input');
    this.autocompleteService = new google.maps.places.AutocompleteService();

    this.setupEventListeners();
  }

  setupEventListeners() {
    DOMManager.addEventListener(this.inputElement, 'input', this.handleInputChange.bind(this));
  }

  async handleInputChange(event) {
    const query = event.target.value;
    if (query) {
      this.fetchAutocompleteSuggestions(query);
    }
  }

  async fetchAutocompleteSuggestions(query) {
    this.autocompleteService.getPlacePredictions({ input: query }, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        this.eventBus.emit('location:autocomplete:suggestions', predictions);
      }
    });
  }

  async onDestroy() {
    DOMManager.removeEventListener(this.inputElement, 'input');
  }
}

// Register the component
ComponentRegistry.register('location-autocomplete', LocationAutocompleteComponent);

// Export the component for easier imports
export default LocationAutocompleteComponent;