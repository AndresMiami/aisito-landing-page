import { updateElementState, toggleVisibility } from '../../utils/bem-utils.js';

/**
 * @typedef {Object} ExperienceMapperOptions
 * @property {Object.<string, string>} [urlMappings] - Custom URL to experience type mappings
 * @property {string} [defaultExperience='hourly_chauffeur'] - Default experience type to fall back to
 */

/**
 * Maps URL paths to experience types and manages experience navigation
 */
export class ExperienceMapper {
  /**
   * Creates a new ExperienceMapper instance
   * @param {ExperienceMapperOptions} options - Configuration options
   */
  constructor(options = {}) {
    // Default URL to experience mappings
    this.urlMappings = options.urlMappings || {
      'hourly.html': 'hourly_chauffeur',
      'yacht.html': 'water_sky',
      'dining.html': 'Dining Expiriences',
      'performances.html': 'Live Performances',
      'wynwood.html': 'wynwood_night',
      'airport.html': 'Airport Pick up & drop off'
    };

    // Default experience to fall back to
    this.defaultExperience = options.defaultExperience || 'hourly_chauffeur';
    
    // Container selectors using BEM classes
    this.containerSelectors = {
      hourlyDescription: '[data-experience-section="hourly-description"]',
      durationContainer: '[data-experience-section="duration"]',
      dateTimeContainer: '[data-experience-section="date-time"]',
      datePreferenceContainer: '[data-experience-section="date-preference"]',
      commonFields: '[data-experience-section="common-fields"]',
      optionsContainer: '[data-experience-section="options"]',
      waterSkyOptions: '[data-experience-section="water-sky"]',
      wynwoodOptions: '[data-experience-section="wynwood"]'
    };

    // Event subscribers
    this.subscribers = [];

    // Bound methods to maintain correct 'this' context
    this.handleNavLinkClick = this.handleNavLinkClick.bind(this);
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
  }

  /**
   * Initialize the experience mapper
   */
  init() {
    try {
      // Initialize with data attribute selectors
      this.experienceTab = document.querySelector('[data-tab-id="experience-plus"]');
      this.experienceDropdown = document.querySelector('[data-form-element="dropdown"][data-form-field="experience"]');
      this.navLinks = document.querySelectorAll('[data-nav-type="experience"]');
      
      this.initNavigationListeners();
      this.initDropdownHandler();
      
      // Check if current URL contains experience parameters
      const experienceFromUrl = this.getExperienceFromUrl();
      if (experienceFromUrl) {
        this.setExperience(experienceFromUrl);
      }
      
      return this;
    } catch (error) {
      console.error('Error initializing ExperienceMapper:', error);
      return this;
    }
  }

  /**
   * Get experience type from URL path or search parameters
   * @returns {string|null} The experience type or null if not found
   */
  getExperienceFromUrl() {
    try {
      const currentPath = window.location.pathname;
      const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
      
      // Check if current page is in our mappings
      if (this.urlMappings[filename]) {
        return this.urlMappings[filename];
      }
      
      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('experience');
    } catch (error) {
      console.error('Error getting experience from URL:', error);
      return null;
    }
  }

  /**
   * Navigate to a specific experience
   * @param {string} experienceType - The type of experience to navigate to
   * @param {boolean} [updateUrl=true] - Whether to update the URL
   */
  navigateToExperience(experienceType, updateUrl = true) {
    try {
      if (!this.experienceTab || !this.experienceDropdown) {
        console.error('Required elements for navigation not found');
        return false;
      }

      // Switch to Experience+ tab if not already active
      if (this.experienceTab.getAttribute('aria-selected') !== 'true') {
        this.experienceTab.click();
      }

      // Set dropdown value after a small delay to allow tab transition
      setTimeout(() => {
        this.experienceDropdown.value = experienceType;
        
        // Manually trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        this.experienceDropdown.dispatchEvent(changeEvent);
        
        // Update URL if requested
        if (updateUrl) {
          const url = new URL(window.location);
          url.searchParams.set('experience', experienceType);
          window.history.pushState({}, '', url);
        }
        
        // Scroll form into view
        const formCard = document.querySelector('.booking-form-card');
        if (formCard) {
          formCard.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error navigating to experience:', error);
      return false;
    }
  }

  /**
   * Initialize event listeners for navigation links
   */
  initNavigationListeners() {
    try {
      this.navLinks.forEach(link => {
        link.addEventListener('click', this.handleNavLinkClick);
      });
    } catch (error) {
      console.error('Error initializing navigation listeners:', error);
    }
  }

  /**
   * Handle click event on navigation links
   * @param {Event} e - The click event
   */
  handleNavLinkClick(e) {
    try {
      // Prevent default navigation
      e.preventDefault();
      
      const href = e.currentTarget.getAttribute('href');
      const experienceValue = this.urlMappings[href];
      
      if (experienceValue) {
        this.navigateToExperience(experienceValue);
      } else {
        // If it's not an experience link, navigate normally
        window.location.href = href;
      }
    } catch (error) {
      console.error('Error handling navigation link click:', error);
    }
  }

  /**
   * Initialize the experience dropdown change handler
   */
  initDropdownHandler() {
    try {
      if (this.experienceDropdown) {
        this.experienceDropdown.addEventListener('change', this.handleDropdownChange);
      } else {
        console.warn('Experience dropdown not found during initialization');
      }
    } catch (error) {
      console.error('Error initializing dropdown handler:', error);
    }
  }

  /**
   * Handle experience dropdown change event
   * @param {Event} e - The change event
   */
  handleDropdownChange(e) {
    try {
      const selectedExperience = e.target.value;
      this.setExperience(selectedExperience);
    } catch (error) {
      console.error('Error handling dropdown change:', error);
    }
  }

  /**
   * Set the current experience and update UI
   * @param {string} experienceType - The experience type to set
   */
  setExperience(experienceType) {
    try {
      // Hide all specific option containers
      this.hideAllContainers();
      
      if (experienceType) {
        // Show common fields for all experiences
        this.showContainer('commonFields');
        this.showContainer('optionsContainer');
        this.showContainer('dateTimeContainer');
        
        // Show specific fields based on experience
        switch (experienceType) {
          case 'hourly_chauffeur':
            this.showContainer('hourlyDescription');
            this.showContainer('durationContainer');
            break;
            
          case 'water_sky':
            this.showContainer('waterSkyOptions');
            this.showContainer('datePreferenceContainer');
            break;
            
          case 'wynwood_night':
            this.showContainer('wynwoodOptions');
            this.showContainer('datePreferenceContainer');
            break;
            
          case 'Dining Expiriences':
          case 'Live Performances':
          case 'Airport Pick up & drop off':
            this.showContainer('datePreferenceContainer');
            break;
            
          default:
            console.warn(`Unknown experience type: ${experienceType}`);
            break;
        }
        
        // Notify subscribers
        this.notifyExperienceChange(experienceType);
      }
    } catch (error) {
      console.error('Error setting experience:', error);
    }
  }

  /**
   * Hide all experience-related containers
   */
  hideAllContainers() {
    try {
      Object.values(this.containerSelectors).forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          // Using BEM utility for consistent state management
          toggleVisibility(element, false);
        }
      });
    } catch (error) {
      console.error('Error hiding containers:', error);
    }
  }

  /**
   * Show a specific container
   * @param {string} containerKey - The key of the container to show
   */
  showContainer(containerKey) {
    try {
      const selector = this.containerSelectors[containerKey];
      if (selector) {
        const element = document.querySelector(selector);
        if (element) {
          // Using BEM utility for consistent state management
          toggleVisibility(element, true);
        } else {
          console.warn(`Container element not found: ${selector}`);
        }
      } else {
        console.warn(`Container selector not defined for key: ${containerKey}`);
      }
    } catch (error) {
      console.error(`Error showing container ${containerKey}:`, error);
    }
  }

  /**
   * Subscribe to experience changes
   * @param {function(string): void} callback - Function to call when experience changes
   * @returns {function(): void} Function to unsubscribe
   */
  onExperienceChange(callback) {
    if (typeof callback !== 'function') {
      console.error('Subscriber must be a function');
      return () => {};
    }
    
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers about experience change
   * @param {string} experienceType - The new experience type
   */
  notifyExperienceChange(experienceType) {
    this.subscribers.forEach(callback => {
      try {
        callback(experienceType);
      } catch (error) {
        console.error('Error in experience change subscriber:', error);
      }
    });
  }
}

/**
 * Create an ExperienceMapper instance
 * @param {ExperienceMapperOptions} options - Configuration options
 * @returns {ExperienceMapper} A new ExperienceMapper instance
 */
export function createExperienceMapper(options = {}) {
  return new ExperienceMapper(options);
}