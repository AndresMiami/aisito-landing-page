/**
 * Manages tab navigation functionality
 */
export class TabNavigation {
  /**
   * Creates a new TabNavigation instance
   * @param {HTMLElement|string} container - The container element for tab buttons and panels
   * @param {Object} options - Configuration options
   * @param {string} [options.activeTabClass='tab-navigation__tab--active'] - Class for active tab
   * @param {string} [options.activeTabPanelClass='tab-navigation__panel--active'] - Class for active panel
   * @param {string} [options.tabSelector='.tab-navigation__tab'] - Selector for tab buttons
   * @param {string} [options.panelSelector='.tab-navigation__panel'] - Selector for tab panels
   * @param {Function} [options.onTabChange] - Callback when tab changes
   */
  constructor(container, options = {}) {
    // Handle string selector or DOM element
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    // Validate container
    if (!this.container) {
      throw new Error(`TabNavigation: Container "${container}" not found`);
    }

    // Set default options
    this.options = {
      activeTabClass: 'tab-navigation__tab--active',
      activeTabPanelClass: 'tab-navigation__panel--active',
      tabSelector: '.tab-navigation__tab',
      panelSelector: '.tab-navigation__panel',
      onTabChange: null,
      ...options
    };

    // For backward compatibility with your existing code
    this.backwardCompatClasses = {
      activeTab: ['active', 'active-tab'],
      activePanel: ['active', 'show', 'visible']
    };

    // State
    this.tabs = [];
    this.panels = [];
    this.activeTabIndex = -1;
    this.subscribers = [];

    // Bind methods to preserve 'this' context
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.activateTab = this.activateTab.bind(this);
  }

  /**
   * Initialize the tab navigation
   * @returns {TabNavigation} This instance for chaining
   */
  init() {
    try {
      // Try to find tabs using the specified selector
      this.tabs = Array.from(this.container.querySelectorAll(this.options.tabSelector));
      
      // Backward compatibility: if no tabs found, try common selectors
      if (this.tabs.length === 0) {
        this.tabs = Array.from(this.container.querySelectorAll('[role="tab"], .tab-button, [data-tab-target]'));
        
        if (this.tabs.length === 0) {
          console.warn('TabNavigation: No tabs found using selector or fallbacks');
          return this;
        }
      }
      
      // Find panels using the tab's data-tab-target or aria-controls
      this.panels = this.tabs.map(tab => {
        const targetId = tab.getAttribute('data-tab-target') || tab.getAttribute('aria-controls');
        if (targetId) {
          // Handle both ID and selector formats (#panel-id or just panel-id)
          const selector = targetId.startsWith('#') ? targetId : `#${targetId}`;
          return document.querySelector(selector);
        }
        return null;
      }).filter(Boolean);
      
      // If no panels found, try using the specified selector
      if (this.panels.length === 0) {
        this.panels = Array.from(document.querySelectorAll(this.options.panelSelector));
        
        // If still no panels, try with role="tabpanel"
        if (this.panels.length === 0) {
          this.panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
        }
      }
      
      // Ensure we have panels
      if (this.panels.length === 0) {
        console.warn('TabNavigation: No tab panels found');
        return this;
      }
      
      // Ensure ARIA attributes are set correctly
      this.setupAccessibility();
      
      // Add event listeners
      this.tabs.forEach((tab, index) => {
        tab.addEventListener('click', (event) => this.handleTabClick(event, index));
        tab.addEventListener('keydown', this.handleKeydown);
      });

      // Find and activate the initial tab
      const initialActiveIndex = this.findInitialActiveTab();
      if (initialActiveIndex >= 0) {
        this.activateTab(initialActiveIndex);
      } else if (this.tabs.length > 0) {
        // If no tab is active, activate the first one
        this.activateTab(0);
      }
      
      return this;
    } catch (error) {
      console.error('TabNavigation initialization error:', error);
      return this;
    }
  }

  /**
   * Finds the initially active tab based on ARIA attributes or classes
   * @private
   * @returns {number} The index of the active tab, or -1 if none is active
   */
  findInitialActiveTab() {
    // Check for aria-selected="true" first
    const ariaSelectedIndex = this.tabs.findIndex(tab => 
      tab.getAttribute('aria-selected') === 'true'
    );
    
    if (ariaSelectedIndex >= 0) return ariaSelectedIndex;
    
    // Check for the active class or custom active class
    return this.tabs.findIndex(tab => {
      if (tab.classList.contains(this.options.activeTabClass)) return true;
      // Check backward compatible classes
      return this.backwardCompatClasses.activeTab.some(cls => tab.classList.contains(cls));
    });
  }

  /**
   * Sets up accessibility attributes for tabs and panels
   * @private
   */
  setupAccessibility() {
    // Ensure container has role=tablist if it doesn't already
    if (!this.container.getAttribute('role')) {
      this.container.setAttribute('role', 'tablist');
    }
    
    this.tabs.forEach((tab, index) => {
      const panel = this.panels[index];
      if (!panel) return;

      // Generate IDs if needed
      if (!tab.id) {
        tab.id = `tab-${this._generateUniqueId()}`;
      }
      if (!panel.id) {
        panel.id = `panel-${this._generateUniqueId()}`;
      }
      
      // Set tab attributes if they don't exist
      if (!tab.getAttribute('role')) {
        tab.setAttribute('role', 'tab');
      }
      if (!tab.hasAttribute('aria-selected')) {
        tab.setAttribute('aria-selected', 'false');
      }
      if (!tab.hasAttribute('tabindex')) {
        tab.setAttribute('tabindex', '-1');
      }
      if (!tab.hasAttribute('aria-controls')) {
        tab.setAttribute('aria-controls', panel.id);
      }
      
      // Set panel attributes if they don't exist
      if (!panel.getAttribute('role')) {
        panel.setAttribute('role', 'tabpanel');
      }
      if (!panel.hasAttribute('aria-labelledby')) {
        panel.setAttribute('aria-labelledby', tab.id);
      }
      if (!panel.hasAttribute('tabindex')) {
        panel.setAttribute('tabindex', '0');
      }
      
      // For backward compatibility, add data-tab-target if missing
      if (!tab.hasAttribute('data-tab-target') && panel.id) {
        tab.setAttribute('data-tab-target', `#${panel.id}`);
      }
    });
  }

  /**
   * Generates a unique ID for use with elements
   * @private
   * @returns {string} A unique ID string
   */
  _generateUniqueId() {
    return `tab-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Handles tab click events
   * @private
   * @param {Event} event - The click event
   * @param {number} index - The index of the clicked tab
   */
  handleTabClick(event, index) {
    event.preventDefault();
    this.activateTab(index);
  }

  /**
   * Handles keyboard navigation
   * @private
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeydown(event) {
    // Find the index of the current tab
    const currentIndex = this.tabs.indexOf(event.currentTarget);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % this.tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = this.tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.activateTab(currentIndex);
        return;
      default:
        return; // Exit for other keys
    }
    
    // Don't proceed if we didn't change the index
    if (newIndex === currentIndex) return;
    
    event.preventDefault();
    this.activateTab(newIndex);
    this.tabs[newIndex].focus();
  }

  /**
   * Activate a specific tab
   * @param {HTMLElement|number} tab - Tab element or index to activate
   * @returns {boolean} Whether activation was successful
   */
  activateTab(tab) {
    try {
      // Convert tab element to index if needed
      const tabIndex = typeof tab === 'number' 
        ? tab 
        : this.tabs.indexOf(tab);
      
      // Validate tab index
      if (tabIndex < 0 || tabIndex >= this.tabs.length) {
        console.warn(`TabNavigation: Invalid tab index: ${tabIndex}`);
        return false;
      }
      
      // Get the corresponding panel
      const tabElement = this.tabs[tabIndex];
      const panelElement = this.panels[tabIndex];
      
      if (!tabElement || !panelElement) {
        console.warn(`TabNavigation: Missing tab or panel at index ${tabIndex}`);
        return false;
      }
      
      // Deactivate all tabs and panels first
      this.tabs.forEach((tab, i) => {
        // Remove active class and fallback classes
        tab.classList.remove(this.options.activeTabClass);
        this.backwardCompatClasses.activeTab.forEach(cls => tab.classList.remove(cls));
        
        // Update ARIA attributes
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
        
        // Hide corresponding panel if it exists
        if (this.panels[i]) {
          this.panels[i].classList.remove(this.options.activeTabPanelClass);
          this.backwardCompatClasses.activePanel.forEach(cls => this.panels[i].classList.remove(cls));
          this.panels[i].classList.add('hidden');
        }
      });
      
      // Activate the selected tab
      tabElement.classList.add(this.options.activeTabClass);
      tabElement.setAttribute('aria-selected', 'true');
      tabElement.setAttribute('tabindex', '0');
      
      // Show the selected panel
      panelElement.classList.add(this.options.activeTabPanelClass);
      panelElement.classList.remove('hidden');
      
      // Store the active tab index
      this.activeTabIndex = tabIndex;
      
      // Notify subscribers of the change
      this.notifyTabChange(tabElement, panelElement);
      
      return true;
      
    } catch (error) {
      console.error('Error activating tab:', error);
      return false;
    }
  }

  /**
   * Returns the currently active tab
   * @returns {HTMLElement|null} The active tab element or null
   */
  getActiveTab() {
    return this.activeTabIndex >= 0 ? this.tabs[this.activeTabIndex] : null;
  }

  /**
   * Activate tab by its index
   * @param {number} index - The index of the tab to activate
   * @returns {boolean} Whether activation was successful
   */
  activateTabByIndex(index) {
    return this.activateTab(index);
  }

  /**
   * Activate the next tab in sequence
   * @returns {boolean} Whether activation was successful
   */
  activateNextTab() {
    if (this.tabs.length === 0) return false;
    const nextIndex = (this.activeTabIndex + 1) % this.tabs.length;
    return this.activateTab(nextIndex);
  }

  /**
   * Activate the previous tab in sequence
   * @returns {boolean} Whether activation was successful
   */
  activatePreviousTab() {
    if (this.tabs.length === 0) return false;
    const prevIndex = (this.activeTabIndex - 1 + this.tabs.length) % this.tabs.length;
    return this.activateTab(prevIndex);
  }

  /**
   * Add subscriber for tab change events
   * @param {Function} callback - Function to call when tab changes
   */
  onTabChange(callback) {
    if (typeof callback === 'function') {
      this.subscribers.push(callback);
    }
  }

  /**
   * Notify subscribers when tab changes
   * @private
   * @param {HTMLElement} tab - The activated tab
   * @param {HTMLElement} panel - The activated panel
   */
  notifyTabChange(tab, panel) {
    // Call any callbacks passed in options
    if (typeof this.options.onTabChange === 'function') {
      this.options.onTabChange(tab, panel);
    }
    
    // Call all subscriber callbacks
    this.subscribers.forEach(callback => {
      try {
        callback(tab, panel);
      } catch (error) {
        console.error('Error in tab change callback:', error);
      }
    });
  }

  /**
   * Destroy the tab navigation and clean up event listeners
   */
  destroy() {
    // Remove event listeners
    this.tabs.forEach((tab, index) => {
      tab.removeEventListener('click', (event) => this.handleTabClick(event, index));
      tab.removeEventListener('keydown', this.handleKeydown);
    });
    
    // Clear state
    this.subscribers = [];
  }
}

/**
 * Creates a new TabNavigation instance
 * @param {HTMLElement|string} container - Container element or selector
 * @param {Object} options - Configuration options
 * @returns {TabNavigation} A new TabNavigation instance
 */
export function createTabNavigation(container, options = {}) {
  try {
    const instance = new TabNavigation(container, options);
    return instance;
  } catch (error) {
    console.error('Error creating TabNavigation:', error);
    throw error;
  }
}