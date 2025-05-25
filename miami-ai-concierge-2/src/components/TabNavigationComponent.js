class TabNavigationComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.config = {
      defaultTab: 'oneway',
      animateTransitions: true,
      saveState: true,
      ...options.config
    };
    
    this.state = {
      activeTab: this.config.defaultTab,
      tabs: []
    };
    
    // Bind methods
    this.handleTabClick = this.handleTabClick.bind(this);
    this.switchTab = this.switchTab.bind(this);
  }
  
  async onInitialize() {
    console.log('🎯 Initializing TabNavigation component');
    
    // Get DOM elements using DOMManager
    this.state.tabs = DOMManager.getElements('.tab');
    this.setupEventListeners();
    this.setActiveTab(this.config.defaultTab);
  }
  
  setupEventListeners() {
    this.state.tabs.forEach(tab => {
      tab.addEventListener('click', this.handleTabClick);
    });
  }
  
  handleTabClick(event) {
    const tabId = event.currentTarget.dataset.tabId;
    this.switchTab(tabId);
  }
  
  switchTab(tabId) {
    this.setActiveTab(tabId);
    this.updateTabDisplay();
    this.saveTabState();
  }
  
  setActiveTab(tabId) {
    this.state.activeTab = tabId;
    this.state.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tabId === tabId);
    });
  }
  
  updateTabDisplay() {
    // Logic to update the display based on the active tab
  }
  
  saveTabState() {
    if (this.config.saveState) {
      localStorage.setItem('activeTab', this.state.activeTab);
    }
  }
  
  loadTabState() {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
      this.setActiveTab(savedTab);
    }
  }
  
  async onDestroy() {
    this.state.tabs.forEach(tab => {
      tab.removeEventListener('click', this.handleTabClick);
    });
    console.log('🗑️ TabNavigation component destroyed');
  }
}

// Register the TabNavigationComponent with the ComponentRegistry
ComponentRegistry.register('tab-navigation', {
  ComponentClass: TabNavigationComponent,
  dependencies: [],
  config: {
    defaultTab: 'oneway',
    animateTransitions: true,
    saveState: true
  }
});