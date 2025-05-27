/**
 * VehicleSelectionView - UI Presentation for Vehicle Selection
 * Handles rendering, user interactions, and UI state management
 */
import { BaseComponent } from '../core/ComponentRegistry.js';
import DOMManager from '../core/DOMManager.js';
import EventDefinitions from '../core/EventDefinitions.js';

export class VehicleSelectionView extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.config = {
      containerId: options.containerId || 'vehicle-selection-container',
      animationDuration: 300,
      showPricing: true,
      showFeatures: true,
      cardLayout: 'grid', // 'grid' or 'list'
      ...options.config
    };
    
    this.state = {
      isRendered: false,
      selectedVehicleId: null,
      vehicles: [],
      availableVehicleIds: [],
      pricing: {}
    };
    
    this.elements = {
      container: null,
      vehicleCards: new Map(),
      priceDisplays: new Map()
    };
  }
  
  async onInitialize() {
    console.log('🎨 Initializing VehicleSelectionView');
    
    // Get container element
    this.elements.container = DOMManager.getElementById(this.config.containerId);
    
    if (!this.elements.container) {
      throw new Error(`Vehicle selection container #${this.config.containerId} not found`);
    }
    
    // Listen for model events
    this.setupModelEventListeners();
    
    // Set up UI event handlers
    this.setupUIEventHandlers();
  }
  
  /**
   * Set up listeners for model events
   */
  setupModelEventListeners() {
    this.eventBus.on(EventDefinitions.EVENTS.VEHICLE.OPTIONS_LOADED, 
                     this.handleVehiclesLoaded.bind(this));
    this.eventBus.on(EventDefinitions.EVENTS.VEHICLE.SELECTED, 
                     this.handleVehicleSelected.bind(this));
    this.eventBus.on(EventDefinitions.EVENTS.VEHICLE.DESELECTED, 
                     this.handleVehicleDeselected.bind(this));
    this.eventBus.on(EventDefinitions.EVENTS.VEHICLE.PRICE_CALCULATED, 
                     this.handlePriceCalculated.bind(this));
    this.eventBus.on(EventDefinitions.EVENTS.VEHICLE.AVAILABILITY_CHECKED, 
                     this.handleAvailabilityUpdate.bind(this));
  }
  
  /**
   * Set up UI interaction handlers
   */
  setupUIEventHandlers() {
    // Handle clicks on the container using event delegation
    DOMManager.addEventListener(this.elements.container, 'click', (event) => {
      const vehicleCard = event.target.closest('.vehicle-card');
      const selectButton = event.target.closest('.vehicle-select-btn');
      
      if (selectButton && vehicleCard) {
        event.preventDefault();
        const vehicleId = vehicleCard.dataset.vehicleId;
        this.requestVehicleSelection(vehicleId);
      }
    });
    
    // Handle keyboard navigation
    DOMManager.addEventListener(this.elements.container, 'keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const vehicleCard = event.target.closest('.vehicle-card');
        if (vehicleCard) {
          event.preventDefault();
          const vehicleId = vehicleCard.dataset.vehicleId;
          this.requestVehicleSelection(vehicleId);
        }
      }
    });
  }
  
  /**
   * Handle vehicles loaded from model
   */
  handleVehiclesLoaded(data) {
    const { vehicles } = data;
    console.log(`🚗 Rendering ${vehicles.length} vehicles`);
    
    this.state.vehicles = vehicles;
    this.renderVehicleGrid();
  }
  
  /**
   * Render the vehicle selection grid
   */
  renderVehicleGrid() {
    // Clear existing content
    DOMManager.setHTML(this.elements.container, '');
    this.elements.vehicleCards.clear();
    this.elements.priceDisplays.clear();
    
    // Create grid container
    const gridContainer = DOMManager.createElement('div', {
      className: 'vehicle-grid'
    });
    
    // Add grid styles
    DOMManager.addClass(gridContainer, 'grid');
    DOMManager.addClass(gridContainer, 'grid-cols-1');
    DOMManager.addClass(gridContainer, 'md:grid-cols-2');
    DOMManager.addClass(gridContainer, 'gap-6');
    
    // Render each vehicle
    this.state.vehicles.forEach(vehicle => {
      const vehicleCard = this.createVehicleCard(vehicle);
      this.elements.vehicleCards.set(vehicle.id, vehicleCard);
      DOMManager.appendChild(gridContainer, vehicleCard);
    });
    
    DOMManager.appendChild(this.elements.container, gridContainer);
    this.state.isRendered = true;
    
    // Emit UI rendered event
    this.eventBus.emit(EventDefinitions.EVENTS.UI.VEHICLE_GRID_RENDERED, {
      vehicleCount: this.state.vehicles.length,
      containerId: this.config.containerId
    });
  }
  
  /**
   * Create a vehicle card element
   */
  createVehicleCard(vehicle) {
    const card = DOMManager.createElement('div', {
      className: 'vehicle-card',
      'data-vehicle-id': vehicle.id,
      tabIndex: '0',
      role: 'button',
      'aria-label': `Select ${vehicle.name} - ${vehicle.description}`
    });
    
    // Add responsive classes
    DOMManager.addClass(card, 'bg-white');
    DOMManager.addClass(card, 'rounded-lg');
    DOMManager.addClass(card, 'shadow-md');
    DOMManager.addClass(card, 'p-6');
    DOMManager.addClass(card, 'border-2');
    DOMManager.addClass(card, 'border-gray-200');
    DOMManager.addClass(card, 'hover:border-blue-300');
    DOMManager.addClass(card, 'transition-all');
    DOMManager.addClass(card, 'duration-200');
    DOMManager.addClass(card, 'cursor-pointer');
    
    // Create card content
    const cardHTML = `
      <div class="vehicle-card-header">
        <div class="vehicle-image">
          <img src="${vehicle.image}" alt="${vehicle.name}" 
               class="w-full h-32 object-cover rounded-md mb-4">
        </div>
        <div class="vehicle-info">
          <h3 class="text-xl font-bold text-gray-900 mb-2">${vehicle.name}</h3>
          <p class="text-sm text-gray-600 mb-2">${vehicle.type}</p>
          <p class="text-gray-700 mb-4">${vehicle.description}</p>
        </div>
      </div>
      
      <div class="vehicle-card-details">
        <div class="vehicle-capacity mb-3">
          <span class="text-sm text-gray-600">
            👥 Up to ${vehicle.capacity} passengers
          </span>
        </div>
        
        <div class="vehicle-features mb-4">
          <div class="text-sm text-gray-600 mb-2">✨ Features:</div>
          <div class="flex flex-wrap gap-1">
            ${vehicle.features.map(feature => 
              `<span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">${feature}</span>`
            ).join('')}
          </div>
        </div>
        
        <div class="vehicle-pricing mb-4">
          <div class="vehicle-base-price text-lg font-semibold text-blue-600">
            From $${vehicle.basePrice}/hour
          </div>
          <div class="vehicle-total-price text-sm text-gray-600 hidden">
            <!-- Updated by price calculator -->
          </div>
        </div>
        
        <button class="vehicle-select-btn w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200">
          Select ${vehicle.name}
        </button>
      </div>
    `;
    
    DOMManager.setHTML(card, cardHTML);
    
    // Store price display element reference
    const priceDisplay = DOMManager.querySelector(card, '.vehicle-total-price');
    if (priceDisplay) {
      this.elements.priceDisplays.set(vehicle.id, priceDisplay);
    }
    
    return card;
  }
  
  /**
   * Request vehicle selection from model
   */
  requestVehicleSelection(vehicleId) {
    console.log(`🎯 Requesting vehicle selection: ${vehicleId}`);
    
    // Check if vehicle is available
    if (this.state.availableVehicleIds.length > 0 && 
        !this.state.availableVehicleIds.includes(vehicleId)) {
      console.warn(`Vehicle ${vehicleId} is not available`);
      return;
    }
    
    // Emit selection request to model
    this.eventBus.emit(EventDefinitions.EVENTS.VEHICLE.SELECTION_REQUESTED, {
      vehicleId,
      source: 'user-interaction',
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle vehicle selection confirmation from model
   */
  handleVehicleSelected(data) {
    const { vehicle, vehicleId } = data;
    
    console.log(`✅ Vehicle selected: ${vehicle.name}`);
    
    // Update visual state
    this.highlightSelectedVehicle(vehicleId);
    this.state.selectedVehicleId = vehicleId;
    
    // Emit UI event for other components
    this.eventBus.emit(EventDefinitions.EVENTS.UI.VEHICLE_CARD_SELECTED, {
      vehicleId,
      vehicle,
      cardElement: this.elements.vehicleCards.get(vehicleId)
    });
  }
  
  /**
   * Handle vehicle deselection from model
   */
  handleVehicleDeselected(data) {
    console.log('🔄 Vehicle deselected');
    
    // Clear visual selection
    this.clearVehicleHighlight();
    this.state.selectedVehicleId = null;
  }
  
  /**
   * Highlight selected vehicle card
   */
  highlightSelectedVehicle(vehicleId) {
    // Remove highlight from all cards
    this.elements.vehicleCards.forEach((card, id) => {
      DOMManager.removeClass(card, 'vehicle-card--selected');
      DOMManager.removeClass(card, 'border-blue-500');
      DOMManager.removeClass(card, 'bg-blue-50');
      DOMManager.setAttribute(card, 'aria-selected', 'false');
    });
    
    // Add highlight to selected card
    const selectedCard = this.elements.vehicleCards.get(vehicleId);
    if (selectedCard) {
      DOMManager.addClass(selectedCard, 'vehicle-card--selected');
      DOMManager.addClass(selectedCard, 'border-blue-500');
      DOMManager.addClass(selectedCard, 'bg-blue-50');
      DOMManager.setAttribute(selectedCard, 'aria-selected', 'true');
      
      // Update button text
      const button = DOMManager.querySelector(selectedCard, '.vehicle-select-btn');
      if (button) {
        DOMManager.setText(button, '✓ Selected');
        DOMManager.addClass(button, 'bg-green-600');
        DOMManager.removeClass(button, 'bg-blue-600');
      }
    }
  }
  
  /**
   * Clear vehicle highlight
   */
  clearVehicleHighlight() {
    this.elements.vehicleCards.forEach((card, id) => {
      DOMManager.removeClass(card, 'vehicle-card--selected');
      DOMManager.removeClass(card, 'border-blue-500');
      DOMManager.removeClass(card, 'bg-blue-50');
      DOMManager.setAttribute(card, 'aria-selected', 'false');
      
      // Reset button
      const button = DOMManager.querySelector(card, '.vehicle-select-btn');
      if (button) {
        const vehicle = this.state.vehicles.find(v => v.id === id);
        if (vehicle) {
          DOMManager.setText(button, `Select ${vehicle.name}`);
          DOMManager.removeClass(button, 'bg-green-600');
          DOMManager.addClass(button, 'bg-blue-600');
        }
      }
    });
  }
  
  /**
   * Handle price calculation from model
   */
  handlePriceCalculated(data) {
    const { vehicleId, totalPrice, surcharges } = data;
    
    console.log(`💰 Price calculated for ${vehicleId}: $${totalPrice}`);
    
    this.state.pricing[vehicleId] = data;
    this.updatePriceDisplay(vehicleId, data);
  }
  
  /**
   * Update price display for a vehicle
   */
  updatePriceDisplay(vehicleId, pricingData) {
    const priceElement = this.elements.priceDisplays.get(vehicleId);
    if (!priceElement) return;
    
    const { totalPrice, surcharges } = pricingData;
    
    let priceHTML = `<strong>Total: $${totalPrice}</strong>`;
    
    if (surcharges && surcharges.length > 0) {
      priceHTML += '<br><small>';
      priceHTML += surcharges.map(s => `${s.name}: $${s.amount}`).join(', ');
      priceHTML += '</small>';
    }
    
    DOMManager.setHTML(priceElement, priceHTML);
    DOMManager.removeClass(priceElement, 'hidden');
  }
  
  /**
   * Handle availability update from model
   */
  handleAvailabilityUpdate(data) {
    const { availableVehicleIds } = data;
    
    this.state.availableVehicleIds = availableVehicleIds;
    this.updateAvailabilityDisplay();
  }
  
  /**
   * Update availability display
   */
  updateAvailabilityDisplay() {
    this.elements.vehicleCards.forEach((card, vehicleId) => {
      const isAvailable = this.state.availableVehicleIds.includes(vehicleId);
      
      if (isAvailable) {
        DOMManager.removeClass(card, 'vehicle-card--unavailable');
        DOMManager.removeAttribute(card, 'aria-disabled');
        
        const button = DOMManager.querySelector(card, '.vehicle-select-btn');
        if (button) {
          DOMManager.removeAttribute(button, 'disabled');
          DOMManager.removeClass(button, 'opacity-50');
          DOMManager.removeClass(button, 'cursor-not-allowed');
        }
      } else {
        DOMManager.addClass(card, 'vehicle-card--unavailable');
        DOMManager.setAttribute(card, 'aria-disabled', 'true');
        
        const button = DOMManager.querySelector(card, '.vehicle-select-btn');
        if (button) {
          DOMManager.setAttribute(button, 'disabled', 'true');
          DOMManager.addClass(button, 'opacity-50');
          DOMManager.addClass(button, 'cursor-not-allowed');
          DOMManager.setText(button, 'Not Available');
        }
      }
    });
  }
  
  /**
   * Get current UI state
   */
  getState() {
    return {
      isRendered: this.state.isRendered,
      selectedVehicleId: this.state.selectedVehicleId,
      vehicleCount: this.state.vehicles.length,
      availableCount: this.state.availableVehicleIds.length
    };
  }
}

export default VehicleSelectionView;