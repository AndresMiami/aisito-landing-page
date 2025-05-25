class TabNavigationComponent extends BaseComponent {
  async onInitialize() {
    console.log('🔄 Initializing TabNavigation component');

    this.tabButtons = DOMManager.getElements('[data-tab-target]');
    this.tabPanels = DOMManager.getElements('.tab-panel');

    this.setupTabSwitching();
  }

  setupTabSwitching() {
    this.tabButtons.forEach(button => {
      DOMManager.addEventListener(button, 'click', () => {
        this.switchTab(button);
      });
    });
  }

  switchTab(button) {
    const targetPanel = button.getAttribute('data-tab-target');

    // Hide all panels
    this.tabPanels.forEach(panel => {
      DOMManager.setAttribute(panel, 'hidden', true);
    });

    // Show target panel
    const panel = DOMManager.getElement(targetPanel);
    if (panel) {
      DOMManager.setAttribute(panel, 'hidden', false);
    }

    // Emit tab changed event
    this.eventBus.emit(EVENTS.UI.TAB_CHANGED, {
      targetPanel,
      timestamp: Date.now()
    });
  }

  async onDestroy() {
    // Clean up event listeners
    this.tabButtons.forEach(button => {
      DOMManager.removeEventListener(button, 'click');
    });
  }
}

// Register the TabNavigationComponent
ComponentRegistry.register('tab-navigation', TabNavigationComponent, [], {
  defaultTab: 'oneway'
});