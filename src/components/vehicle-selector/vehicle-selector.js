import { addClass, removeClass, hasClass } from '../../utils/bem-utils.js';

/**
 * Manages vehicle selection functionality
 */
export class VehicleSelector {
  /**
   * Creates a new VehicleSelector instance
   * @param {HTMLElement} container - The container element for vehicle cards
   * @param {Object} options - Configuration options
   * @param {boolean} [options.multiSelect=false] - Whether multiple vehicles can be selected
   * @param {boolean} [options.animateSelection=true] - Whether to animate selection changes
   * @param {Function} [options.onSelectionChange] - Callback when selection changes
   */
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('VehicleSelector: Container element is required');
    }

    this.container = container;
    this.options = {
      multiSelect: false,
      animateSelection: true,
      onSelectionChange: null,
      ...options
    };

    this.subscribers = [];
    this.vehicles = [];
    this.selectedVehicles = [];

    // Add callback from options to subscribers if provided
    if (typeof this.options.onSelectionChange === 'function') {
      this.subscribers.push(this.options.onSelectionChange);
    }
  }

  /**
   * Initialize the vehicle selector
   * @returns {VehicleSelector} This instance for chaining
   */
  init() {
    try {
      // Find all vehicle cards in the container
      this.vehicles = Array.from(this.container.querySelectorAll('.vehicle-selector__card, .vehicle-card'));

      if (this.vehicles.length === 0) {
        console.warn('VehicleSelector: No vehicle cards found in container');
      }

      // Set ARIA attributes for accessibility
      this.container.setAttribute('role', 'radiogroup');
      this.container.setAttribute('aria-label', 'Select a vehicle');

      // Initialize each vehicle card
      this.vehicles.forEach((card, index) => {
        // Ensure each card has the correct BEM class
        if (!hasClass(card, 'vehicle-selector__card')) {
          addClass(card, 'vehicle-selector__card');
        }

        // Set ARIA attributes for accessibility
        card.setAttribute('role', 'radio');
        card.setAttribute('aria-checked', 'false');
        card.setAttribute('tabindex', '0');

        // Get the input element within the card
        const input = card.querySelector('input[type="radio"]');
        
        if (input) {
          // If the input is already checked, select this vehicle
          if (input.checked) {
            this.selectVehicle(card);
          }

          // Associate the input with the card for accessibility
          const inputId = input.id || `vehicle-option-${index}`;
          input.id = inputId;
          card.setAttribute('aria-controls', inputId);
        }

        // Add event listeners
        card.addEventListener('click', this.handleCardClick.bind(this));
        card.addEventListener('keydown', this.handleCardKeyDown.bind(this));
      });

      return this;
    } catch (error) {
      console.error('Error initializing VehicleSelector:', error);
      return this;
    }
  }

  /**
   * Handle click events on vehicle cards
   * @param {Event} event - The click event
   * @private
   */
  handleCardClick(event) {
    try {
      const card = event.currentTarget;
      this.selectVehicle(card);
      
      // Find and click the associated radio input to ensure form state updates
      const input = card.querySelector('input[type="radio"]');
      if (input && !input.checked) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (error) {
      console.error('Error handling vehicle card click:', error);
    }
  }

  /**
   * Handle keyboard events on vehicle cards
   * @param {KeyboardEvent} event - The keyboard event
   * @private
   */
  handleCardKeyDown(event) {
    try {
      // Handle Space or Enter key
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.handleCardClick(event);
      }
    } catch (error) {
      console.error('Error handling vehicle card keydown:', error);
    }
  }

  /**
   * Select a vehicle
   * @param {HTMLElement} card - The vehicle card element to select
   * @returns {boolean} Whether the selection was successful
   */
  selectVehicle(card) {
    try {
      if (!card || !this.vehicles.includes(card)) {
        console.warn('VehicleSelector: Invalid vehicle card provided');
        return false;
      }

      // If not multiSelect, deselect all other vehicles first
      if (!this.options.multiSelect) {
        this.vehicles.forEach(vehicleCard => {
          if (vehicleCard !== card) {
            removeClass(vehicleCard, 'vehicle-selector__card--selected');
            removeClass(vehicleCard, 'selected'); // For backward compatibility
            vehicleCard.setAttribute('aria-checked', 'false');
            
            // Update associated radio input
            const input = vehicleCard.querySelector('input[type="radio"]');
            if (input) {
              input.checked = false;
            }
          }
        });
        
        // Clear selected vehicles array
        this.selectedVehicles = [];
      }

      // Select the current vehicle
      addClass(card, 'vehicle-selector__card--selected');
      addClass(card, 'selected'); // For backward compatibility
      card.setAttribute('aria-checked', 'true');

      // Find the input and update its state
      const input = card.querySelector('input[type="radio"], input[type="checkbox"]');
      if (input) {
        input.checked = true;
      }

      // Get vehicle type value
      const vehicleType = this.getVehicleType(card);
      
      // Add to selected vehicles
      if (vehicleType && !this.selectedVehicles.includes(vehicleType)) {
        this.selectedVehicles.push(vehicleType);
      }
      
      // Notify subscribers about the selection change
      this.notifySelectionChange(this.getSelectedVehicle());
      
      return true;
    } catch (error) {
      console.error('Error selecting vehicle:', error);
      return false;
    }
  }

  /**
   * Gets the vehicle type from a card element
   * @param {HTMLElement} card - The vehicle card element
   * @returns {string|null} The vehicle type or null if not found
   * @private
   */
  getVehicleType(card) {
    try {
      // Try to get value from radio/checkbox input
      const input = card.querySelector('input[type="radio"], input[type="checkbox"]');
      if (input && input.value) {
        return input.value;
      }
      
      // Try to get from data attribute
      if (card.dataset.vehicleType) {
        return card.dataset.vehicleType;
      }
      
      // Try to get from text content of vehicle name element
      const vehicleName = card.querySelector('.vehicle-card-details p:first-child');
      if (vehicleName) {
        return vehicleName.textContent.trim();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting vehicle type:', error);
      return null;
    }
  }

  /**
   * Get the currently selected vehicle(s)
   * @returns {string|Array<string>} The selected vehicle type(s)
   */
  getSelectedVehicle() {
    try {
      if (this.options.multiSelect) {
        return [...this.selectedVehicles];
      } else {
        return this.selectedVehicles[0] || null;
      }
    } catch (error) {
      console.error('Error getting selected vehicle:', error);
      return this.options.multiSelect ? [] : null;
    }
  }

  /**
   * Reset the vehicle selection
   * @returns {boolean} Whether the reset was successful
   */
  reset() {
    try {
      // Reset all vehicle cards
      this.vehicles.forEach(card => {
        removeClass(card, 'vehicle-selector__card--selected');
        removeClass(card, 'selected'); // For backward compatibility
        card.setAttribute('aria-checked', 'false');
        
        // Reset associated input
        const input = card.querySelector('input[type="radio"], input[type="checkbox"]');
        if (input) {
          input.checked = false;
        }
      });
      
      // Clear selected vehicles
      this.selectedVehicles = [];
      
      // Notify subscribers
      this.notifySelectionChange(this.getSelectedVehicle());
      
      return true;
    } catch (error) {
      console.error('Error resetting vehicle selection:', error);
      return false;
    }
  }

  /**
   * Subscribe to selection changes
   * @param {Function} callback - Function to call when selection changes
   * @returns {Function} Function to unsubscribe
   */
  onSelectionChange(callback) {
    try {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      this.subscribers.push(callback);
      
      // Return an unsubscribe function
      return () => {
        this.subscribers = this.subscribers.filter(sub => sub !== callback);
      };
    } catch (error) {
      console.error('Error subscribing to selection changes:', error);
      return () => {}; // Return a no-op function on error
    }
  }

  /**
   * Notify all subscribers about selection change
   * @param {string|Array<string>} selection - The new selection
   * @private
   */
  notifySelectionChange(selection) {
    try {
      this.subscribers.forEach(callback => {
        try {
          callback(selection);
        } catch (error) {
          console.error('Error in selection change subscriber:', error);
        }
      });
    } catch (error) {
      console.error('Error notifying selection change:', error);
    }
  }
}

/**
 * Creates a new VehicleSelector instance
 * @param {HTMLElement|string} container - Container element or selector
 * @param {Object} options - Configuration options
 * @returns {VehicleSelector} A new VehicleSelector instance
 */
export function createVehicleSelector(container, options = {}) {
  try {
    if (typeof container === 'string') {
      const containerElement = document.querySelector(container);
      if (!containerElement) {
        throw new Error(`Element not found: ${container}`);
      }
      container = containerElement;
    }
    
    return new VehicleSelector(container, options);
  } catch (error) {
    console.error('Error creating VehicleSelector:', error);
    throw error;
  }
}