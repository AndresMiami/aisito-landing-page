class ErrorHandlerComponent extends BaseComponent {
  async onInitialize() {
    console.log('🚨 Initializing ErrorHandler component');
    
    this.errorContainer = DOMManager.getElement('#global-error-container');
    
    if (!this.errorContainer) {
      console.error('Error: Global error container not found');
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventBus.on(EventDefinitions.EVENTS.ERROR.SHOW, this.handleShowError.bind(this));
    this.eventBus.on(EventDefinitions.EVENTS.ERROR.CLEAR, this.handleClearError.bind(this));
  }

  handleShowError({ fieldId, message, severity }) {
    console.log(`Error shown for field ${fieldId}: ${message}`);
    this.displayError(fieldId, message, severity);
  }

  handleClearError({ fieldId }) {
    console.log(`Clearing error for field ${fieldId}`);
    this.clearError(fieldId);
  }

  displayError(fieldId, message, severity) {
    const errorElement = DOMManager.getElement(`#${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add(`error-${severity}`);
      errorElement.classList.remove('hidden');
    }
  }

  clearError(fieldId) {
    const errorElement = DOMManager.getElement(`#${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
      errorElement.classList.remove('error-error', 'error-warning', 'error-info');
    }
  }

  async onDestroy() {
    this.eventBus.off(EventDefinitions.EVENTS.ERROR.SHOW, this.handleShowError);
    this.eventBus.off(EventDefinitions.EVENTS.ERROR.CLEAR, this.handleClearError);
  }
}

export default ErrorHandlerComponent;