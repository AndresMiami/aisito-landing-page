class BaseComponent {
  constructor(options = {}) {
    this.options = options;
    this.eventBus = EventBus; // Assuming EventBus is imported from EventBus.js
  }

  async initialize() {
    await this.onInitialize();
    this.setupEventListeners();
  }

  async onInitialize() {
    // Override in subclasses for initialization logic
  }

  async destroy() {
    await this.onDestroy();
    this.cleanupEventListeners();
  }

  async onDestroy() {
    // Override in subclasses for cleanup logic
  }

  setupEventListeners() {
    // Override in subclasses to set up event listeners
  }

  cleanupEventListeners() {
    // Override in subclasses to clean up event listeners
  }

  emitEvent(eventName, data) {
    this.eventBus.emit(eventName, data);
  }

  onEvent(eventName, callback) {
    this.eventBus.on(eventName, callback);
  }

  offEvent(eventName, callback) {
    this.eventBus.off(eventName, callback);
  }
}

export default BaseComponent;