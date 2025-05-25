// filepath: c:\I love miami Project\AI concierge\src\modules\mapsIntegration.js
import EventBus from '../core/EventBus.js';
import DOMManager from '../core/DOMManager.js';
import { EVENTS } from '../core/EventDefinitions.js';

/**
 * MapsIntegration.js - Integrates Google Maps functionality for location selection
 * and autocomplete features.
 */
class MapsIntegration {
  constructor(options = {}) {
    this.config = {
      apiKey: options.apiKey || process.env.GOOGLE_MAPS_API_KEY,
      mapElementId: options.mapElementId || 'map',
      autocompleteInputId: options.autocompleteInputId || 'autocomplete',
      ...options
    };

    this.map = null;
    this.autocomplete = null;

    // Bind methods
    this.initializeMap = this.initializeMap.bind(this);
    this.setupAutocomplete = this.setupAutocomplete.bind(this);
    this.handlePlaceChanged = this.handlePlaceChanged.bind(this);
  }

  async onInitialize() {
    console.log('🗺️ Initializing MapsIntegration component');
    this.initializeMap();
    this.setupAutocomplete();
  }

  initializeMap() {
    const mapElement = DOMManager.getElement(`#${this.config.mapElementId}`);
    this.map = new google.maps.Map(mapElement, {
      center: { lat: -25.363, lng: 131.044 },
      zoom: 8
    });
    console.log('✅ Map initialized');
  }

  setupAutocomplete() {
    const inputElement = DOMManager.getElement(`#${this.config.autocompleteInputId}`);
    this.autocomplete = new google.maps.places.Autocomplete(inputElement);
    this.autocomplete.addListener('place_changed', this.handlePlaceChanged);
    console.log('✅ Autocomplete setup complete');
  }

  handlePlaceChanged() {
    const place = this.autocomplete.getPlace();
    if (place && place.geometry) {
      this.map.setCenter(place.geometry.location);
      EventBus.emit(EVENTS.MAP.LOCATION_SELECTED, { place });
      console.log('📍 Location selected:', place);
    } else {
      console.warn('⚠️ No details available for the selected place');
    }
  }

  async onDestroy() {
    console.log('🗑️ Cleaning up MapsIntegration component');
    // Cleanup logic if necessary
  }
}

// Export the MapsIntegration class
export default MapsIntegration;