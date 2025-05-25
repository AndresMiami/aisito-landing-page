/**
 * ExperienceSelector Component - Miami AI Concierge
 * 
 * Handles experience type selection and dynamic UI updates for the booking form.
 * Now extends BaseComponent for standardized lifecycle and event management.
 */

import { BaseComponent } from '../core/ComponentRegistry.js';
import DOMManager from '../core/DOMManager.js';
import EventDefinitions from '../core/EventDefinitions.js';

export class ExperienceSelector extends BaseComponent {
  constructor(options = {}) {
    // Call BaseComponent constructor with options
    super(options);
    
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
        miami_relocation: 'Request Information',
        default: 'Submit Booking'
      },
      animationDuration: 300,
      ...options.config
    };
    
    // Component state
    this.state = {
      selectedExperience: '',
      previousExperience: null,
      visibleContainers: new Set(),
      isUpdating: false
    };
    
    // Element references (will be populated in onInitialize)
    this.elements = {
      dropdown: null,
      submitButton: null,
      submitButtonText: null
    };
    
    // Bind methods to preserve context
    this.handleExperienceChange = this.handleExperienceChange.bind(this);
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.updateUI = this.updateUI.bind(this);
  }
  
  /**
   * Initialize the component - override of BaseComponent method
   */
  async onInitialize() {
    console.log(`🎯 Initializing ${this.componentId}`);
    
    try {
      // Get element references using DOMManager
      this.elements.dropdown = DOMManager.getElementById(this.config.dropdownId);
      this.elements.submitButton = DOMManager.getElementById('submit-button');
      this.elements.submitButtonText = DOMManager.getElement('#submit-button .button-text');
      
      if (!this.elements.dropdown) {
        throw new Error(`Experience dropdown element '${this.config.dropdownId}' not found`);
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize with current dropdown value
      const currentValue = DOMManager.getValue(this.elements.dropdown);
      if (currentValue) {
        this.state.selectedExperience = currentValue;
        this.updateUI();
      }
      
      // Emit component initialized event
      this.eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_INITIALIZED, {
        componentId: this.componentId,
        componentType: 'ExperienceSelector',
        initialValue: currentValue,
        timestamp: Date.now()
      });
      
      console.log(`✅ ${this.componentId} initialized successfully`);
    } catch (error) {
      this.onError(error, 'initialization');
      throw error;
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen to dropdown changes using DOMManager
    DOMManager.addEventListener(this.elements.dropdown, 'change', this.handleDropdownChange);
    
    // Listen for external experience selection events
    this.eventBus.on(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, this.handleFieldChanged.bind(this));
    this.eventBus.on('experience:select', this.handleExperienceChange);
    this.eventBus.on('experience:reset', this.resetExperience.bind(this));
  }
  
  /**
   * Handle dropdown change event
   * @param {Event} event - Change event
   */
  handleDropdownChange(event) {
    const newValue = DOMManager.getValue(event.target);
    
    // Emit field change event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, {
      fieldId: this.config.dropdownId,
      value: newValue,
      previousValue: this.state.selectedExperience,
      fieldType: 'select',
      timestamp: Date.now(),
      source: this.componentId
    });
    
    this.handleExperienceChange({ value: newValue });
  }
  
  /**
   * Handle form field changed events
   * @param {Object} data - Event data
   */
  handleFieldChanged(data) {
    // Only handle changes to our dropdown
    if (data.fieldId === this.config.dropdownId && data.source !== this.componentId) {
      this.handleExperienceChange({ value: data.value });
    }
  }
  
  /**
   * Handle experience selection change
   * @param {Object} data - Event data containing the selected value
   */
  async handleExperienceChange(data) {
    if (this.state.isUpdating) {
      console.log('🔄 Update already in progress, skipping...');
      return;
    }
    
    const selectedValue = data.value || '';
    const previousValue = this.state.selectedExperience;
    
    if (selectedValue === previousValue) {
      console.log('🔄 Same experience selected, no update needed');
      return;
    }
    
    console.log(`🎯 Experience changed from "${previousValue}" to "${selectedValue}"`);
    
    // Set updating state
    this.state.isUpdating = true;
    this.state.previousExperience = previousValue;
    this.state.selectedExperience = selectedValue;
    
    try {
      // Update UI
      await this.updateUI();
      
      // Emit experience selected event
      this.eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_VALIDATED, {
        fieldId: this.config.dropdownId,
        isValid: !!selectedValue,
        value: selectedValue,
        timestamp: Date.now(),
        source: this.componentId
      });
      
      // Emit UI update event
      this.eventBus.emit(EventDefinitions.EVENTS.UI.EXPERIENCE_UPDATED, {
        experience: selectedValue,
        previousExperience: previousValue,
        visibleElements: Array.from(this.state.visibleContainers),
        timestamp: Date.now(),
        source: this.componentId
      });
      
      // Track analytics
      this.eventBus.emit(EventDefinitions.EVENTS.ANALYTICS.TRACK, 
        EventDefinitions.createAnalyticsPayload('experience_selected', {
          experience_type: selectedValue,
          previous_experience: previousValue
        })
      );
      
    } catch (error) {
      this.onError(error, 'experience-change');
    } finally {
      this.state.isUpdating = false;
    }
  }
  
  /**
   * Update UI based on selected experience
   */
  async updateUI() {
    const selectedValue = this.state.selectedExperience;
    
    console.log(`🎨 Updating UI for experience: ${selectedValue}`);
    
    // Hide all containers first with animation
    await this.hideAllContainers();
    
    // Clear visible containers tracking
    this.state.visibleContainers.clear();
    
    if (!selectedValue) {
      this.updateSubmitButtonText('default');
      return;
    }
    
    // Show common fields for all experiences
    await this.showElement(this.config.containers.common);
    await this.showElement(this.config.containers.options);
    
    // Handle specific experience types
    switch (selectedValue) {
      case 'hourly_chauffeur':
        await this.showElement(this.config.descriptions.hourly_chauffeur);
        await this.showElement(this.config.containers.duration);
        await this.showElement(this.config.containers.dateTime);
        this.updateSubmitButtonText('hourly_chauffeur');
        break;
        
      case 'water_sky':
        await this.showElement(this.config.containers.waterSky);
        await this.showElement(this.config.containers.datePreference);
        this.updateSubmitButtonText('water_sky');
        break;
        
      case 'tours_excursions':
        await this.showElement(this.config.containers.wynwood);
        await this.showElement(this.config.descriptions.tours_excursions);
        await this.showElement(this.config.containers.datePreference);
        this.updateSubmitButtonText('tours_excursions');
        break;
        
      case 'airport_transfer':
        await this.showElement(this.config.descriptions.airport_transfer);
        await this.showElement(this.config.containers.datePreference);
        this.updateSubmitButtonText('airport_transfer');
        break;
      
      case 'miami_relocation':
        await this.showElement(this.config.containers.relocation);
        await this.showElement(this.config.containers.datePreference);
        this.updateSubmitButtonText('miami_relocation');
        break;
        
      default:
        console.warn(`Unknown experience type: ${selectedValue}`);
        this.updateSubmitButtonText('default');
    }
    
    console.log(`✅ UI updated for ${selectedValue}. Visible containers:`, Array.from(this.state.visibleContainers));
  }
  
  /**
   * Hide all experience-related containers with animation
   */
  async hideAllContainers() {
    const hidePromises = [];
    
    // Hide all descriptions
    Object.values(this.config.descriptions).forEach(id => {
      hidePromises.push(this.hideElement(id));
    });
    
    // Hide all containers (except common ones that we'll show selectively)
    Object.entries(this.config.containers).forEach(([key, id]) => {
      if (key !== 'common' && key !== 'options') {
        hidePromises.push(this.hideElement(id));
      }
    });
    
    // Wait for all hide animations to complete
    await Promise.all(hidePromises);
  }
  
  /**
   * Show element by ID using DOMManager with animation
   * @param {string} id - Element ID
   * @returns {Promise} Animation promise
   */
  async showElement(id) {
    return new Promise((resolve) => {
      const element = DOMManager.getElementById(id);
      
      if (!element) {
        console.warn(`Element ${id} not found for showing`);
        resolve();
        return;
      }
      
      // Check if already visible
      if (!DOMManager.hasClass(element, 'hidden')) {
        this.state.visibleContainers.add(id);
        resolve();
        return;
      }
      
      // Show with animation
      DOMManager.removeClass(element, 'hidden');
      DOMManager.showElement(element, 'block', true);
      
      // Track as visible
      this.state.visibleContainers.add(id);
      
      // Resolve after animation
      setTimeout(resolve, this.config.animationDuration);
    });
  }
  
  /**
   * Hide element by ID using DOMManager with animation
   * @param {string} id - Element ID
   * @returns {Promise} Animation promise
   */
  async hideElement(id) {
    return new Promise((resolve) => {
      const element = DOMManager.getElementById(id);
      
      if (!element || DOMManager.hasClass(element, 'hidden')) {
        this.state.visibleContainers.delete(id);
        resolve();
        return;
      }
      
      // Hide with animation
      DOMManager.hideElement(element, true);
      
      // Add hidden class after animation
      setTimeout(() => {
        DOMManager.addClass(element, 'hidden');
        this.state.visibleContainers.delete(id);
        resolve();
      }, this.config.animationDuration);
    });
  }
  
  /**
   * Update submit button text based on experience
   * @param {string} experienceKey - Experience key
   */
  updateSubmitButtonText(experienceKey) {
    const buttonText = this.config.submitButtonText[experienceKey] || this.config.submitButtonText.default;
    
    // Update button text element
    if (this.elements.submitButtonText) {
      DOMManager.setText(this.elements.submitButtonText, buttonText);
    } else if (this.elements.submitButton) {
      // Fallback: update button directly
      DOMManager.setText(this.elements.submitButton, buttonText);
    }
    
    console.log(`🔄 Submit button text updated to: "${buttonText}"`);
  }
  
  /**
   * Reset experience selection
   */
  resetExperience() {
    console.log('🔄 Resetting experience selection');
    
    // Reset dropdown
    if (this.elements.dropdown) {
      DOMManager.setValue(this.elements.dropdown, '');
    }
    
    // Reset state
    this.state.selectedExperience = '';
    this.state.previousExperience = null;
    
    // Update UI
    this.updateUI();
  }
  
  /**
   * Get currently selected experience
   * @returns {string} Selected experience value
   */
  getSelectedExperience() {
    return this.state.selectedExperience;
  }
  
  /**
   * Get all currently visible elements
   * @returns {Array<string>} Array of visible element IDs
   */
  getVisibleElements() {
    return Array.from(this.state.visibleContainers);
  }
  
  /**
   * Check if a specific experience is selected
   * @param {string} experience - Experience to check
   * @returns {boolean} True if selected
   */
  isExperienceSelected(experience) {
    return this.state.selectedExperience === experience;
  }
  
  /**
   * Set experience programmatically
   * @param {string} experience - Experience to set
   */
  setExperience(experience) {
    if (this.elements.dropdown) {
      DOMManager.setValue(this.elements.dropdown, experience);
      this.handleExperienceChange({ value: experience });
    }
  }
  
  /**
   * Get component statistics
   * @returns {Object} Component stats
   */
  getStats() {
    return {
      selectedExperience: this.state.selectedExperience,
      visibleContainersCount: this.state.visibleContainers.size,
      visibleContainers: Array.from(this.state.visibleContainers),
      isUpdating: this.state.isUpdating,
      isReady: this.isReady()
    };
  }
  
  /**
   * Clean up resources when component is destroyed
   */
  async onDestroy() {
    console.log(`🗑️ Destroying ${this.componentId}`);
    
    try {
      // Reset state
      this.state = {
        selectedExperience: '',
        previousExperience: null,
        visibleContainers: new Set(),
        isUpdating: false
      };
      
      // Clear element references
      this.elements = {
        dropdown: null,
        submitButton: null,
        submitButtonText: null
      };
      
      console.log(`✅ ${this.componentId} destroyed successfully`);
    } catch (error) {
      this.onError(error, 'destruction');
    }
  }
}

// Export for ComponentRegistry registration
export default ExperienceSelector;