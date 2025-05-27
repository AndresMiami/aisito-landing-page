/**
 * VehicleSelectionComponent - Orchestrates Model and View
 * This component coordinates between business logic and UI presentation
 */
import { BaseComponent } from '../core/ComponentRegistry.js';
import { VehicleSelectionModel } from '../models/VehicleSelectionModel.js';
import { VehicleSelectionView } from '../views/VehicleSelectionView.js';

export class VehicleSelectionComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.config = {
      containerId: 'vehicle-selection-oneway',
      enablePricing: true,
      enableAvailabilityCheck: true,
      ...options.config
    };
    
    this.model = null;
    this.view = null;
  }
  
  async onInitialize() {
    console.log('🎯 Initializing VehicleSelectionComponent');
    
    // Initialize business logic (model)
    this.model = new VehicleSelectionModel({
      componentId: `${this.componentId}-model`,
      eventBus: this.eventBus,
      config: this.config
    });
    
    // Initialize UI presentation (view)
    this.view = new VehicleSelectionView({
      componentId: `${this.componentId}-view`,
      eventBus: this.eventBus,
      config: {
        containerId: this.config.containerId,
        showPricing: this.config.enablePricing
      }
    });
    
    // Initialize both components
    await this.model.initialize();
    await this.view.initialize();
    
    console.log('✅ VehicleSelectionComponent ready');
  }
  
  /**
   * Public API: Get selected vehicle
   */
  getSelectedVehicle() {
    return this.model ? this.model.getState().selectedVehicle : null;
  }
  
  /**
   * Public API: Clear selection
   */
  clearSelection() {
    if (this.model) {
      this.model.clearSelection('external-request');
    }
  }
  
  /**
   * Public API: Update filters
   */
  updateFilters(filters) {
    if (this.model) {
      this.eventBus.emit(EventDefinitions.EVENTS.BOOKING.PREFERENCES_SET, {
        preferences: filters,
        source: 'external-api'
      });
    }
  }
  
  async onDestroy() {
    if (this.model) {
      await this.model.destroy();
    }
    if (this.view) {
      await this.view.destroy();
    }
    
    console.log('🗑️ VehicleSelectionComponent destroyed');
  }
}

export default VehicleSelectionComponent;