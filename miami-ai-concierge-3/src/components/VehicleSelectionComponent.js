class VehicleSelectionComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.config = {
      vehicleOptions: [],
      selectedVehicle: null,
      ...options.config
    };
    
    this.state = {
      isLoading: false,
      error: null
    };
    
    // Bind methods
    this.handleVehicleChange = this.handleVehicleChange.bind(this);
    this.loadVehicleOptions = this.loadVehicleOptions.bind(this);
  }
  
  async onInitialize() {
    console.log('🚗 Initializing VehicleSelection component');
    await this.loadVehicleOptions();
  }
  
  async loadVehicleOptions() {
    this.setState({ isLoading: true });
    try {
      // Simulate an API call to fetch vehicle options
      const response = await fetch('/api/vehicles');
      this.config.vehicleOptions = await response.json();
      this.setState({ isLoading: false });
      eventBus.emit(EventDefinitions.EVENTS.VALIDATION.VEHICLE_OPTIONS_LOADED, this.config.vehicleOptions);
    } catch (error) {
      this.setState({ isLoading: false, error: 'Failed to load vehicle options' });
      eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOW, { message: this.state.error });
    }
  }
  
  handleVehicleChange(event) {
    this.config.selectedVehicle = event.target.value;
    eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, { field: 'vehicle', value: this.config.selectedVehicle });
  }
  
  async onDestroy() {
    console.log('🗑️ Destroying VehicleSelection component');
    // Cleanup if necessary
  }
}

// Register the VehicleSelectionComponent with the ComponentRegistry
ComponentRegistry.register('vehicle-selection', {
  ComponentClass: VehicleSelectionComponent,
  dependencies: [],
  config: {}
});