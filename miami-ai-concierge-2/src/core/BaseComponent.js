class BaseComponent {
  constructor(options = {}) {
    this.options = options;
    this.eventBus = options.eventBus || null;
    this.domManager = options.domManager || null;
  }

  async initialize() {
    await this.onInitialize();
  }

  async onInitialize() {
    // Override in subclasses for initialization logic
  }

  async destroy() {
    await this.onDestroy();
  }

  async onDestroy() {
    // Override in subclasses for cleanup logic
  }

  onError(error, context = 'unknown') {
    console.error(`Error in ${context}:`, error);
  }

  getDependency(id) {
    return this.options.dependencies ? this.options.dependencies[id] : null;
  }

  isReady() {
    return !!this.options && !this.options.isDestroyed;
  }
}

export default BaseComponent;