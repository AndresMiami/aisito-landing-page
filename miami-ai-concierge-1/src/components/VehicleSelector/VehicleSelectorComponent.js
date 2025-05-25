class VehicleSelectorComponent extends BaseComponent {
  async onInitialize() {
    console.log('🚗 Initializing VehicleSelector component');
    
    this.vehicleOptions = DOMManager.getElements('.vehicle-option');
    this.selectedVehicle = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.vehicleOptions.forEach(option => {
      DOMManager.addEventListener(option, 'click', this.handleVehicleSelect.bind(this));
    });
  }

  handleVehicleSelect(event) {
    const selectedOption = event.currentTarget;
    this.selectedVehicle = selectedOption.getAttribute('data-vehicle-type');

    this.eventBus.emit('vehicle:selected', {
      vehicleType: this.selectedVehicle,
      timestamp: Date.now()
    });

    console.log(`Selected vehicle: ${this.selectedVehicle}`);
  }

  async onDestroy() {
    this.vehicleOptions.forEach(option => {
      DOMManager.removeEventListener(option, 'click', this.handleVehicleSelect.bind(this));
    });
  }
}

// Register the VehicleSelectorComponent
ComponentRegistry.register('vehicle-selector', VehicleSelectorComponent, [], {
  defaultVehicle: 'sedan'
});

// Export the component for easier imports
export default VehicleSelectorComponent;