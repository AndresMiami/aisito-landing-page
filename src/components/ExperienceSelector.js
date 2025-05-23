/**
 * ExperienceSelector - Component for handling the experience dropdown and related UI
 * Uses the EventBus for communication with other components
 */
import eventBus from '../core/EventBus.js';

export class ExperienceSelector {
  constructor(config = {}) {
    // Component configuration
    this.config = {
      dropdownId: 'experience-dropdown',
      descriptions: {
        hourly_chauffeur: 'hourly-description',
        tours_excursions: 'tours-description',
        airport_transfer: 'airport-description'
      },
      containers: {
        duration: 'duration-container',
        dateTime: 'date-time-container-hourly',
        datePreference: 'date-preference-container',
        common: 'common-experience-fields',
        options: 'experience-options-container',
        waterSky: 'water-sky-options',
        wynwood: 'wynwood-night-options',
        relocation: 'miami-relocation-options'
      },
      submitButtonText: {
        hourly_chauffeur: 'Request Hourly Service',
        water_sky: 'Book Water Experience',
        tours_excursions: 'Book Tour Experience',
        airport_transfer: 'Book Airport Transfer',
        miami_relocation: 'Request Information'
      },
      ...config
    };
    
    // State
    this.state = {
      selectedExperience: '',
      isInitialized: false
    };
    
    // Element references
    this.elements = {
      dropdown: null,
      submitButton: null
    };
    
    // Bind methods
    this.handleExperienceChange = this.handleExperienceChange.bind(this);
    
    // Event subscriptions
    this.unsubscribers = [];
  }
  
  /**
   * Initialize the component - called by the module loader
   */
  init() {
    console.log('Initializing ExperienceSelector component');
    
    // Get element references
    this.elements.dropdown = document.getElementById(this.config.dropdownId);
    this.elements.submitButton = document.querySelector('#submit-button .button-text');
    
    if (!this.elements.dropdown) {
      console.error('Experience dropdown element not found');
      return this;
    }
    
    // Subscribe to events
    this.unsubscribers.push(
      eventBus.subscribe('experience.selected', this.handleExperienceChange)
    );
    
    // Mark as initialized
    this.state.isInitialized = true;
    
    return this;
  }
  
  /**
   * Handle experience dropdown change
   * @param {Object} data - Event data
   */
  handleExperienceChange(data) {
    const selectedValue = data.value;
    this.state.selectedExperience = selectedValue;
    
    // Hide all containers first
    this.hideAllContainers();
    
    if (!selectedValue) return;
    
    // Show common fields
    this.showElement(this.config.containers.common);
    this.showElement(this.config.containers.options);
    
    // Handle specific experience types
    switch (selectedValue) {
      case 'hourly_chauffeur':
        this.showElement(this.config.descriptions.hourly_chauffeur);
        this.showElement(this.config.containers.duration);
        this.updateSubmitButtonText('hourly_chauffeur');
        break;
        
      case 'water_sky':
        this.showElement(this.config.containers.waterSky);
        this.showElement(this.config.containers.datePreference);
        this.updateSubmitButtonText('water_sky');
        break;
        
      case 'tours_excursions':
        this.showElement(this.config.containers.wynwood);
        this.showElement(this.config.descriptions.tours_excursions);
        this.showElement(this.config.containers.datePreference);
        this.updateSubmitButtonText('tours_excursions');
        break;
        
      case 'airport_transfer':
        this.showElement(this.config.descriptions.airport_transfer);
        this.showElement(this.config.containers.datePreference);
        this.updateSubmitButtonText('airport_transfer');
        break;
      
      case 'miami_relocation':
        this.showElement(this.config.containers.relocation);
        this.showElement(this.config.containers.datePreference);
        this.updateSubmitButtonText('miami_relocation');
        break;
    }
    
    // Publish event with UI update info
    eventBus.publish('ui.experienceUpdated', {
      experience: selectedValue,
      visibleElements: this.getVisibleElements()
    });
  }
  
  /**
   * Hide all experience-related containers
   */
  hideAllContainers() {
    // Hide all descriptions
    Object.values(this.config.descriptions).forEach(id => {
      this.hideElement(id);
    });
    
    // Hide all containers
    Object.values(this.config.containers).forEach(id => {
      this.hideElement(id);
    });
  }
  
  /**
   * Show element by ID
   * @param {string} id - Element ID
   */
  showElement(id) {
    const element = document.getElementById(id);
    if (element) element.classList.remove('hidden');
  }
  
  /**
   * Hide element by ID
   * @param {string} id - Element ID
   */
  hideElement(id) {
    const element = document.getElementById(id);
    if (element) element.classList.add('hidden');
  }
  
  /**
   * Update submit button text based on experience
   * @param {string} experienceKey - Experience key
   */
  updateSubmitButtonText(experienceKey) {
    if (this.elements.submitButton && this.config.submitButtonText[experienceKey]) {
      this.elements.submitButton.textContent = this.config.submitButtonText[experienceKey];
    }
  }
  
  /**
   * Get all currently visible elements
   * @returns {Array<string>} - Array of visible element IDs
   */
  getVisibleElements() {
    const visibleElements = [];
    
    // Check descriptions
    Object.values(this.config.descriptions).forEach(id => {
      const element = document.getElementById(id);
      if (element && !element.classList.contains('hidden')) {
        visibleElements.push(id);
      }
    });
    
    // Check containers
    Object.values(this.config.containers).forEach(id => {
      const element = document.getElementById(id);
      if (element && !element.classList.contains('hidden')) {
        visibleElements.push(id);
      }
    });
    
    return visibleElements;
  }
  
  /**
   * Destroy the component - called by the module loader
   */
  destroy() {
    // Unsubscribe from all events
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    
    // Reset state
    this.state.isInitialized = false;
    this.state.selectedExperience = '';
    
    return true;
  }
}

// Create a singleton instance
const experienceSelector = new ExperienceSelector();

// Define module interface
export default {
  init: (config) => experienceSelector.init(config),
  destroy: () => experienceSelector.destroy()
};
