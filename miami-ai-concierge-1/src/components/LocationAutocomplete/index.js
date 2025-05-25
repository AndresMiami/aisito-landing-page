import BaseComponent from '../../core/BaseComponent.js';
import DOMManager from '../../core/DOMManager.js';
import EventDefinitions from '../../core/EventDefinitions.js';
import { googleMapsAPI } from '../../modules/maps/googleMapsAPI.js';

class LocationAutocompleteComponent extends BaseComponent {
  async onInitialize() {
    console.log('🔍 Initializing LocationAutocomplete component');
    
    this.inputField = DOMManager.getElement('#location-input');
    this.autocompleteService = new google.maps.places.AutocompleteService();
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    DOMManager.addEventListener(this.inputField, 'input', this.handleInputChange.bind(this));
  }

  async handleInputChange(event) {
    const query = event.target.value;
    if (query) {
      this.autocompleteService.getPlacePredictions({ input: query }, this.handlePredictions.bind(this));
    }
  }

  handlePredictions(predictions, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      this.eventBus.emit(EventDefinitions.EVENTS.MAP.PLACES_SUGGESTIONS, predictions);
    }
  }

  async onDestroy() {
    DOMManager.removeEventListener(this.inputField, 'input');
  }
}

export default LocationAutocompleteComponent;