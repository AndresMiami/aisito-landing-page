/**
 * @typedef {Object} ExperienceMapperOptions
 * @property {Object.<string, string>} [urlMappings] - Custom URL to experience type mappings
 * @property {string} [tabSelector='.tab-button'] - Selector for tab buttons
 * @property {string} [experienceTabId='tab-button-experience-plus'] - ID of the experience tab
 * @property {string} [dropdownId='experience-dropdown'] - ID of the experience dropdown
 * @property {string} [navLinkSelector='.dropdown-menu .dropdown-item'] - Selector for navigation links
 */

/**
 * ExperienceMapper - A class to handle experience mapping and navigation
 */
export class ExperienceMapper {
  /**
   * Create an ExperienceMapper instance
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

    // DOM selectors
    this.tabSelector = options.tabSelector || '.tab-button';
    this.experienceTabId = options.experienceTabId || 'tab-button-experience-plus';
    this.dropdownId = options.dropdownId || 'experience-dropdown';
    this.navLinkSelector = options.navLinkSelector || '.dropdown-menu .dropdown-item';

    // Container selectors for showing/hiding UI elements
    this.containerSelectors = {
      hourlyDescription: '#hourly-description',
      durationContainer: '#duration-container',
      dateTimeContainer: '#date-time-container-hourly',
      datePreferenceContainer: '#date-preference-container',
      commonFields: '#common-experience-fields',
      optionsContainer: '#experience-options-container',
      waterSkyOptions: '#water-sky-options',
      wynwoodOptions: '#wynwood-night-options'
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
    this.initNavigationListeners();
    this.initDropdownHandler();
    this.initTabSwitchingLogic();
    
    // Check if current URL contains experience parameters
    const experienceFromUrl = this.getExperienceFromUrl();
    if (experienceFromUrl) {
      this.setExperience(experienceFromUrl);
    }
  }

  /**
   * Get experience type from URL path or search parameters
   * @returns {string|null} The experience type or null if not found
   */
  getExperienceFromUrl() {
    const currentPath = window.location.pathname;
    const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    // Check if current page is in our mappings
    if (this.urlMappings[filename]) {
      return this.urlMappings[filename];
    }
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('experience');
  }

  /**
   * Navigate to a specific experience
   * @param {string} experienceType - The type of experience to navigate to
   * @param {boolean} [updateUrl=true] - Whether to update the URL
   */
  navigateToExperience(experienceType, updateUrl = true) {
    const experienceTab = document.getElementById(this.experienceTabId);
    const dropdown = document.getElementById(this.dropdownId);
    
    // If either element doesn't exist, we can't navigate
    if (!experienceTab || !dropdown) {
      console.error('Required elements for navigation not found');
      return;
    }

    // Switch to Experience+ tab if not already active
    if (experienceTab.getAttribute('aria-selected') !== 'true') {
      experienceTab.click();
    }

    // Set dropdown value after a small delay to allow tab transition
    setTimeout(() => {
      dropdown.value = experienceType;
      
      // Manually trigger change event
      const changeEvent = new Event('change', { bubbles: true });
      dropdown.dispatchEvent(changeEvent);
      
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
  }

  /**
   * Initialize event listeners for navigation links
   */
  initNavigationListeners() {
    const navLinks = document.querySelectorAll(this.navLinkSelector);
    
    navLinks.forEach(link => {
      link.addEventListener('click', this.handleNavLinkClick);
    });
  }

  /**
   * Handle click event on navigation links
   * @param {Event} e - The click event
   */
  handleNavLinkClick(e) {
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
  }

  /**
   * Initialize the experience dropdown change handler
   */
  initDropdownHandler() {
    const dropdown = document.getElementById(this.dropdownId);
    if (dropdown) {
      dropdown.addEventListener('change', this.handleDropdownChange);
    }
  }

  /**
   * Handle experience dropdown change event
   * @param {Event} e - The change event
   */
  handleDropdownChange(e) {
    const selectedExperience = e.target.value;
    this.setExperience(selectedExperience);
  }

  /**
   * Set the current experience and update UI
   * @param {string} experienceType - The experience type to set
   */
  setExperience(experienceType) {
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
      }
      
      // Notify subscribers
      this.notifyExperienceChange(experienceType);
    }
  }

  /**
   * Hide all experience-related containers
   */
  hideAllContainers() {
    Object.values(this.containerSelectors).forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.classList.add('hidden');
      }
    });
  }

  /**
   * Show a specific container
   * @param {string} containerKey - The key of the container to show
   */
  showContainer(containerKey) {
    const selector = this.containerSelectors[containerKey];
    if (selector) {
      const element = document.querySelector(selector);
      if (element) {
        element.classList.remove('hidden');
      }
    }
  }

  /**
   * Initialize tab switching logic
   */
  initTabSwitchingLogic() {
    document.querySelectorAll(this.tabSelector).forEach(button => {
      button.addEventListener('click', () => {
        // Set aria-selected for all buttons
        document.querySelectorAll(this.tabSelector).forEach(btn => {
          btn.setAttribute('aria-selected', 'false');
        });
        button.setAttribute('aria-selected', 'true');
        
        // Hide all panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.add('hidden');
        });
        
        // Show the target panel
        const targetPanelId = button.getAttribute('data-tab-target');
        const targetPanel = document.querySelector(targetPanelId);
        if (targetPanel) {
          targetPanel.classList.remove('hidden');
        }
      });
    });
  }

  /**
   * Subscribe to experience changes
   * @param {function(string): void} callback - Function to call when experience changes
   * @returns {function(): void} Function to unsubscribe
   */
  onExperienceChange(callback) {
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