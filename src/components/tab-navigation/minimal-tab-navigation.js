/**
 * Minimal TabNavigation Component - Compatible with SimpleBridge
 * Designed for safe integration with existing dashboard functionality
 */
export class TabNavigation {
  /**
   * Creates a new TabNavigation instance that works with SimpleBridge
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - The container element for tabs
   * @param {Function} options.eventBus - SimpleBridge eventBus for communication
   * @param {string} [options.tabButtonSelector='.tab-button'] - Selector for tab buttons
   * @param {string} [options.tabPanelSelector='.tab-panel'] - Selector for tab panels
   */
  constructor(options = {}) {
    this.container = options.container;
    this.eventBus = options.eventBus;
    this.tabButtonSelector = options.tabButtonSelector || '.tab-button';
    this.tabPanelSelector = options.tabPanelSelector || '.tab-panel';
    
    // State tracking
    this.currentTab = null;
    this.previousTab = null;
    this.isInitialized = false;
    
    console.log('🎯 TabNavigation: Minimal component created');

    // Validate container
    if (!this.container) {
      throw new Error('TabNavigation: Container element is required');
    }
    
    if (!this.eventBus) {
      console.warn('⚠️ TabNavigation: No eventBus provided, will use fallback');
      this.eventBus = this.createFallbackEventBus();
    }
  }

  /**
   * Creates a fallback event bus if SimpleBridge isn't available
   */
  createFallbackEventBus() {
    return {
      emit: (event, data) => console.log(`📤 TabNavigation fallback emit:`, event, data),
      on: () => {},
      off: () => {}
    };
  }

  /**
   * Initialize the component - connects to existing HTML structure
   */
  init() {
    try {
      // Find existing tab buttons and panels
      this.tabButtons = this.container.querySelectorAll(this.tabButtonSelector);
      this.tabPanels = document.querySelectorAll(this.tabPanelSelector);

      if (this.tabButtons.length === 0) {
        throw new Error('No tab buttons found');
      }

      console.log(`🎯 TabNavigation: Found ${this.tabButtons.length} tabs and ${this.tabPanels.length} panels`);

      // Bind events to existing buttons
      this.bindEvents();
      
      // Set initial state from HTML
      this.setInitialState();
      
      this.isInitialized = true;
      console.log('✅ TabNavigation: Successfully initialized');
      
      // Emit initialization event
      this.eventBus.emit('tab-navigation:initialized', {
        component: this,
        tabCount: this.tabButtons.length
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ TabNavigation: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Bind click events to existing tab buttons
   */
  bindEvents() {
    this.tabButtons.forEach((button, index) => {
      // Store original click handlers (if any) - preserves existing functionality
      const originalHandler = button.onclick;
      
      button.addEventListener('click', (e) => {
        this.handleTabClick(e, button);
        
        // Call original handler if it existed
        if (originalHandler && typeof originalHandler === 'function') {
          originalHandler.call(button, e);
        }
      });
      
      console.log(`🔗 TabNavigation: Bound events to tab ${index + 1}`);
    });
  }

  /**
   * Set initial active tab based on HTML aria-selected or first tab
   */
  setInitialState() {
    // Find currently active tab
    let activeButton = null;
    
    this.tabButtons.forEach(button => {
      if (button.getAttribute('aria-selected') === 'true') {
        activeButton = button;
      }
    });
    
    // Default to first tab if none are marked active
    if (!activeButton) {
      activeButton = this.tabButtons[0];
      activeButton.setAttribute('aria-selected', 'true');
    }
    
    const targetPanelId = this.getTargetPanelId(activeButton);
    this.currentTab = targetPanelId;
    
    console.log(`🎯 TabNavigation: Initial tab set to: ${this.currentTab}`);
  }

  /**
   * Handle tab button clicks
   */
  handleTabClick(event, button) {
    const targetPanelId = this.getTargetPanelId(button);
    
    if (!targetPanelId) {
      console.warn('⚠️ TabNavigation: No target panel found for button');
      return;
    }
    
    this.switchToTab(targetPanelId, button);
  }

  /**
   * Get target panel ID from button
   */
  getTargetPanelId(button) {
    const target = button.getAttribute('data-tab-target');
    return target ? target.replace('#', '') : null;
  }

  /**
   * Switch to specific tab
   */
  switchToTab(tabId, button = null) {
    this.previousTab = this.currentTab;
    this.currentTab = tabId;
    
    // Update button states
    this.updateButtonStates(button);
    
    // Update panel visibility
    this.updatePanelVisibility();
    
    // Emit change event to SimpleBridge
    this.eventBus.emit('dashboard:tab-changed', {
      fromTab: this.previousTab,
      toTab: this.currentTab,
      timestamp: Date.now(),
      source: 'TabNavigation'
    });
    
    console.log(`🔄 TabNavigation: Switched from ${this.previousTab} to ${this.currentTab}`);
  }

  /**
   * Update button ARIA states
   */
  updateButtonStates(activeButton) {
    this.tabButtons.forEach(btn => {
      btn.setAttribute('aria-selected', 'false');
    });
    
    if (activeButton) {
      activeButton.setAttribute('aria-selected', 'true');
    } else {
      // Find button by target if not provided
      const targetButton = this.container.querySelector(`[data-tab-target="#${this.currentTab}"]`);
      if (targetButton) {
        targetButton.setAttribute('aria-selected', 'true');
      }
    }
  }

  /**
   * Update panel visibility
   */
  updatePanelVisibility() {
    this.tabPanels.forEach(panel => {
      if (panel.id === this.currentTab) {
        panel.classList.remove('hidden');
        panel.setAttribute('tabindex', '0');
      } else {
        panel.classList.add('hidden');
        panel.setAttribute('tabindex', '-1');
      }
    });
  }

  /**
   * Public API: Get current tab
   */
  getCurrentTab() {
    return this.currentTab;
  }

  /**
   * Public API: Switch to tab by ID
   */
  switchTo(tabId) {
    if (this.isInitialized) {
      this.switchToTab(tabId);
    } else {
      console.warn('⚠️ TabNavigation: Cannot switch to tab - component not initialized');
    }
  }

  /**
   * Check if component is ready
   */
  isReady() {
    return this.isInitialized;
  }
}

/**
 * Factory function for easy instantiation
 */
export function createTabNavigation(options) {
  return new TabNavigation(options);
}
