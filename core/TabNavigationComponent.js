/**
 * Enhanced Tab Navigation Component using DOMManager and EventBus
 * Refactored for better decoupling and event-driven architecture
 */
import { BaseComponent } from './ComponentRegistry.js';
import DOMManager from './DOMManager.js';
import EventDefinitions from './EventDefinitions.js';

export class TabNavigationComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.config = {
      containerSelector: '#tab-navigation',
      tabButtonSelector: '.tab-button', 
      tabPanelSelector: '.tab-panel',
      defaultTab: 'panel-oneway',  // ✅ Matches HTML panel ID
      animateTransitions: true,
      saveState: true,
      ...options.config
    };
    
    this.state = {
      currentTab: null,
      previousTab: null,
      isInitialized: false,
      tabButtons: [],
      tabPanels: [],
      tabs: new Map() // Initialize tabs as a Map
    };
    
    // Bind methods to preserve context
    this.handleTabClick = this.handleTabClick.bind(this);
    this.switchTab = this.switchTab.bind(this);
    this.handleExternalTabChange = this.handleExternalTabChange.bind(this);
  }
  
  async onInitialize() {
    console.log('🎯 Initializing TabNavigationComponent with DOMManager');
    
    // Get container using DOMManager
    const tabContainer = DOMManager.getElementById('tab-navigation');
    if (!tabContainer) {
      const errorMsg = 'Tab navigation container not found';
      console.warn(errorMsg);
      
      // Emit error event using EventDefinitions
      this.eventBus.emit(EventDefinitions.EVENTS.ERROR.UI_ERROR, {
        component: this.componentId,
        message: errorMsg,
        severity: 'warning',
        timestamp: Date.now()
      });
      return;
    }
    
    // Find tab buttons and panels using DOMManager
    this.state.tabButtons = DOMManager.querySelectorAll(this.config.tabButtonSelector);
    this.state.tabPanels = DOMManager.querySelectorAll(this.config.tabPanelSelector);
    
    if (this.state.tabButtons.length === 0) {
      console.warn('No tab buttons found');
      this.eventBus.emit(EventDefinitions.EVENTS.ERROR.UI_ERROR, {
        component: this.componentId,
        message: 'No tab buttons found',
        severity: 'warning',
        timestamp: Date.now()
      });
      return;
    }
    
    console.log(`✅ Found ${this.state.tabButtons.length} tabs and ${this.state.tabPanels.length} panels`);
    
    // Initialize tabs map
    this.initializeTabs();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize default state
    this.initializeDefaultState();
    
    // Set up EventBus listeners
    this.setupEventBusListeners();
    
    this.state.isInitialized = true;
    
    // Emit initialization complete event
    this.eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_INITIALIZED, {
      componentId: this.componentId,
      tabCount: this.state.tabButtons.length,
      panelCount: this.state.tabPanels.length,
      timestamp: Date.now()
    });
  }
  
  /**
   * Set up DOM event listeners using DOMManager
   */
  setupEventListeners() {
    this.state.tabButtons.forEach((button, index) => {
      // Use DOMManager for event binding
      DOMManager.addEventListener(button, 'click', this.handleTabClick);
      
      // Add keyboard navigation
      DOMManager.addEventListener(button, 'keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.handleTabClick(event);
        }
      });
      
      console.log(`🔗 Bound events to tab ${index + 1}: ${DOMManager.getAttribute(button, 'id')}`);
    });
  }
  
  /**
   * Set up EventBus listeners for external communication
   */
  setupEventBusListeners() {
    // Listen for external tab change requests
    this.eventBus.on(EventDefinitions.EVENTS.UI.TAB_CHANGE_REQUESTED, 
                     this.handleExternalTabChange);
    
    // Listen for form events that might affect tabs
    this.eventBus.on(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, (data) => {
      if (data.fieldId === 'experience-dropdown') {
        this.handleExperienceChange(data);
      }
    });
    
    // Listen for vehicle selection events
    this.eventBus.on(EventDefinitions.EVENTS.VEHICLE.SELECTED, (data) => {
      this.handleVehicleSelection(data);
    });
  }
  
  /**
   * Handle tab button clicks
   * @param {Event} event - Click event
   */
  handleTabClick(event) {
    const button = event.currentTarget;
    const tabId = DOMManager.getAttribute(button, 'id');
    const targetPanelId = DOMManager.getAttribute(button, 'data-tab-target');
    
    if (!tabId || !targetPanelId) {
      console.warn('Tab button missing required attributes');
      return;
    }
    
    // Clean target panel ID (remove # if present)
    const cleanPanelId = targetPanelId.replace('#', '');
    
    // Emit tab change event using EventDefinitions
    this.eventBus.emit(EventDefinitions.EVENTS.UI.TAB_CHANGED, 
      EventDefinitions.createUIPayload({
        action: 'tab-changed',
        tabId,
        targetPanelId: cleanPanelId,
        previousTab: this.state.currentTab,
        source: 'user-click',
        component: this.componentId
      })
    );
    
    // Perform the tab switch
    this.switchTab(cleanPanelId, button);
  }
  
  /**
   * Switch to a specific tab
   * @param {string} tabId - Tab panel ID to switch to
   * @param {Element} clickedButton - The button that was clicked (optional)
   */
  switchTab(tabId, clickedButton = null) {
    // Add normalization to handle both "oneway" and "#oneway" formats
    const normalizedTabId = tabId.replace(/^#/, '');
    
    // Check if tab exists in collection
    if (!this.state.tabs.has(normalizedTabId)) {
      console.log(`Tab "${tabId}" not found`, {
        availableTabs: Array.from(this.state.tabs.keys())
      });
      
      // Try to find a close match or default to first tab
      let fallbackTab = this.config.defaultTab || Array.from(this.state.tabs.keys())[0];
      if (fallbackTab) {
        console.log(`Falling back to "${fallbackTab}" tab`);
        return this.switchTab(fallbackTab, clickedButton);
      }
      return false;
    }
    
    const previousTab = this.state.activeTab;
    this.state.activeTab = tabId;
    
    // Emit standardized tab change event
    this.eventBus.emit(EventDefinitions.EVENTS.UI.TAB_CHANGED, 
      EventDefinitions.createUIPayload('tab-changed', {
        previousTab,
        currentTab: tabId,
        button: clickedButton?.id,
        source: 'tab-navigation-component'
      })
    );
  }
  
  /**
   * Update button ARIA states using DOMManager
   * @param {Element} activeButton - The button to set as active
   */
  updateButtonStates(activeButton) {
    // Reset all buttons
    this.state.tabButtons.forEach(button => {
      DOMManager.setAttribute(button, 'aria-selected', 'false');
      DOMManager.removeClass(button, 'active');
    });
    
    // Set active button
    if (activeButton) {
      DOMManager.setAttribute(activeButton, 'aria-selected', 'true');
      DOMManager.addClass(activeButton, 'active');
      
      console.log(`✅ Updated button states, active: ${DOMManager.getAttribute(activeButton, 'id')}`);
    }
  }
  
  /**
   * Update panel visibility using DOMManager
   * @param {string} activeTabId - ID of the tab panel to show
   */
  updatePanelVisibility(activeTabId) {
    // Hide all panels with optional animation
    this.state.tabPanels.forEach(panel => {
      const panelId = DOMManager.getAttribute(panel, 'id');
      
      if (panelId === activeTabId) {
        // Show the active panel
        DOMManager.removeClass(panel, 'hidden');
        DOMManager.addClass(panel, 'active');
        
        // Emit panel shown event
        this.eventBus.emit(EventDefinitions.EVENTS.UI.PANEL_SHOWN, 
          EventDefinitions.createUIPayload({
            action: 'panel-shown',
            panelId: activeTabId,
            component: this.componentId
          })
        );
        
        console.log(`👁️ Showing panel: ${panelId}`);
      } else {
        // Hide inactive panels
        DOMManager.addClass(panel, 'hidden');
        DOMManager.removeClass(panel, 'active');
      }
    });
    
    // Verify target panel exists
    const targetPanel = DOMManager.getElementById(activeTabId);
    if (!targetPanel) {
      this.eventBus.emit(EventDefinitions.EVENTS.ERROR.UI_ERROR, {
        component: this.componentId,
        message: `Target panel not found: ${activeTabId}`,
        severity: 'error',
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Initialize default tab state
   */
  initializeDefaultState() {
    // Check for saved state first
    if (this.config.saveState) {
      const savedTab = this.loadTabState();
      if (savedTab) {
        this.switchTab(savedTab);
        return;
      }
    }
    
    // Find currently active tab or use default
    let activeTab = this.config.defaultTab;
    
    // Check for existing aria-selected attribute
    this.state.tabButtons.forEach(button => {
      if (DOMManager.getAttribute(button, 'aria-selected') === 'true') {
        const targetPanelId = DOMManager.getAttribute(button, 'data-tab-target');
        if (targetPanelId) {
          activeTab = targetPanelId.replace('#', '');
        }
      }
    });
    
    // Switch to the determined active tab
    this.switchTab(activeTab);
    
    console.log(`🎯 Initialized with default tab: ${activeTab}`);
  }
  
  /**
   * Handle external tab change requests
   * @param {Object} data - Event data
   */
  handleExternalTabChange(data) {
    const { tabId, source } = data;
    
    console.log(`🔄 External tab change request: ${tabId} from ${source}`);
    
    if (tabId && tabId !== this.state.currentTab) {
      this.switchTab(tabId);
    }
  }
  
  /**
   * Handle experience dropdown changes
   * @param {Object} data - Field change event data
   */
  handleExperienceChange(data) {
    const { value } = data;
    
    // Map experience values to appropriate tabs
    const experienceTabMap = {
      'hourly_chauffeur': 'experience-plus',
      'water_sky': 'experience-plus',
      'tours_excursions': 'experience-plus',
      'airport_transfer': 'oneway',
      'miami_relocation': 'experience-plus'
    };
    
    const targetTab = experienceTabMap[value];
    if (targetTab && targetTab !== this.state.currentTab) {
      console.log(`🎯 Auto-switching to tab "${targetTab}" for experience: ${value}`);
      this.switchTab(targetTab);
    }
  }
  
  /**
   * Handle vehicle selection events
   * @param {Object} data - Vehicle selection event data
   */
  handleVehicleSelection(data) {
    // You can add logic here to respond to vehicle selections
    // For example, updating tab content or showing additional options
    console.log(`🚗 Vehicle selected in tab context:`, data);
  }
  
  /**
   * Find button element for a given tab ID
   * @param {string} tabId - Tab panel ID
   * @returns {Element|null} Button element
   */
  findButtonForTab(tabId) {
    return this.state.tabButtons.find(button => {
      const targetPanelId = DOMManager.getAttribute(button, 'data-tab-target');
      return targetPanelId && targetPanelId.replace('#', '') === tabId;
    }) || null;
  }
  
  /**
   * Save current tab state to localStorage
   */
  saveTabState() {
    if (this.state.currentTab) {
      try {
        localStorage.setItem('miami-concierge-active-tab', this.state.currentTab);
      } catch (error) {
        console.warn('Failed to save tab state:', error);
      }
    }
  }
  
  /**
   * Load tab state from localStorage
   * @returns {string|null} Saved tab ID
   */
  loadTabState() {
    try {
      return localStorage.getItem('miami-concierge-active-tab');
    } catch (error) {
      console.warn('Failed to load tab state:', error);
      return null;
    }
  }
  
  /**
   * Initialize tabs map for internal state management
   */
  initializeTabs() {
    // Build tabs map
    this.state.tabButtons.forEach(button => {  // FIXED: use this.state.tabButtons instead of this.tabButtons
      // Get the target attribute and normalize it (remove # if present)
      const targetAttr = button.getAttribute('data-tab-target');
      const tabId = targetAttr?.startsWith('#') ? 
        targetAttr.substring(1) : // Remove the # if it exists
        targetAttr;
      
      const tabLabel = button.textContent?.trim() || '';
      
      if (tabId) {
        // Store panel with and without # prefix for flexibility
        const panel = document.querySelector(targetAttr) || document.getElementById(tabId);
        
        this.state.tabs.set(tabId, {
          id: tabId,
          button,
          panel: panel,
          label: tabLabel,
          isActive: false
        });
      }
    });
    
    console.log(`Initialized ${this.state.tabs.size} tabs`);
  }
  
  // Public API methods
  
  /**
   * Get current active tab
   * @returns {string|null} Current tab ID
   */
  getActiveTab() {
    return this.state.currentTab;
  }
  
  /**
   * Get all available tabs
   * @returns {Array} Array of tab information
   */
  getAllTabs() {
    return this.state.tabButtons.map(button => ({
      id: DOMManager.getAttribute(button, 'id'),
      targetPanel: DOMManager.getAttribute(button, 'data-tab-target'),
      text: DOMManager.getText(button),
      isActive: DOMManager.getAttribute(button, 'aria-selected') === 'true'
    }));
  }
  
  /**
   * Check if a tab is currently active
   * @param {string} tabId - Tab ID to check
   * @returns {boolean} True if tab is active
   */
  isTabActive(tabId) {
    return this.state.currentTab === tabId;
  }
  
  /**
   * Programmatically switch to a tab
   * @param {string} tabId - Tab panel ID to switch to
   * @returns {boolean} Success status
   */
  switchToTab(tabId) {
    if (!this.state.isInitialized) {
      console.warn('TabNavigation not initialized');
      return false;
    }
    
    const targetPanel = DOMManager.getElementById(tabId);
    if (!targetPanel) {
      console.warn(`Tab panel not found: ${tabId}`);
      return false;
    }
    
    this.switchTab(tabId);
    return true;
  }
  
  /**
   * Clean up resources when component is destroyed
   */
  async onDestroy() {
    // Remove DOM event listeners
    this.state.tabButtons.forEach(button => {
      DOMManager.removeEventListener(button, 'click', this.handleTabClick);
    });
    
    // Remove EventBus listeners
    this.eventBus.off(EventDefinitions.EVENTS.UI.TAB_CHANGE_REQUESTED, 
                      this.handleExternalTabChange);
    
    // Clear state
    this.state.isInitialized = false;
    this.state.tabButtons = [];
    this.state.tabPanels = [];
    
    console.log('🗑️ TabNavigationComponent destroyed');
  }
}

export default TabNavigationComponent;