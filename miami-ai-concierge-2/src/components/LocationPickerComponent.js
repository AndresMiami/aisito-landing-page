import { BaseComponent } from '../core/BaseComponent.js';
import DOMManager from '../core/DOMManager.js';
import eventBus from '../core/EventBus.js';
import { EVENTS } from '../core/EventDefinitions.js';

class LocationPickerComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    this.config = {
      locationInputId: 'location-input',
      ...options.config
    };
    this.state = {
      selectedLocation: null
    };
  }

  async onInitialize() {
    console.log('🌍 Initializing LocationPicker component');
    this.setupEventListeners();
    this.initializeLocationInput();
  }

  setupEventListeners() {
    const locationInput = DOMManager.getElement(`#${this.config.locationInputId}`);
    locationInput.addEventListener('change', this.handleLocationChange.bind(this));
  }

  initializeLocationInput() {
    const locationInput = DOMManager.getElement(`#${this.config.locationInputId}`);
    if (locationInput) {
      locationInput.value = this.state.selectedLocation || '';
    }
  }

  handleLocationChange(event) {
    this.state.selectedLocation = event.target.value;
    eventBus.emit(EVENTS.LOCATION.FIELD_UPDATED, { location: this.state.selectedLocation });
    console.log(`📍 Location updated: ${this.state.selectedLocation}`);
  }

  async onDestroy() {
    console.log('🗑️ Destroying LocationPicker component');
    const locationInput = DOMManager.getElement(`#${this.config.locationInputId}`);
    if (locationInput) {
      locationInput.removeEventListener('change', this.handleLocationChange.bind(this));
    }
  }
}

export default LocationPickerComponent;