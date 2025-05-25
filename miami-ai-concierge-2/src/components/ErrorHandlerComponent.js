class ErrorHandlerComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.config = {
      globalErrorContainer: 'global-error-container',
      autoHide: true,
      hideTimeout: 5000,
      ...options.config
    };
    
    this.state = {
      errorMessages: []
    };
    
    // Bind methods
    this.handleShowError = this.handleShowError.bind(this);
    this.handleClearError = this.handleClearError.bind(this);
  }
  
  async onInitialize() {
    console.log('🚨 Initializing ErrorHandler component');
    
    // Set up event listeners for error events
    eventBus.on(EVENTS.ERROR.SHOW, this.handleShowError);
    eventBus.on(EVENTS.ERROR.CLEAR, this.handleClearError);
  }
  
  handleShowError({ message, severity }) {
    this.state.errorMessages.push({ message, severity });
    this.renderErrors();
    
    if (this.config.autoHide) {
      setTimeout(() => {
        this.handleClearError({ message });
      }, this.config.hideTimeout);
    }
  }
  
  handleClearError({ message }) {
    this.state.errorMessages = this.state.errorMessages.filter(error => error.message !== message);
    this.renderErrors();
  }
  
  renderErrors() {
    const container = DOMManager.getElement(`#${this.config.globalErrorContainer}`);
    if (!container) return;

    container.innerHTML = ''; // Clear previous errors
    this.state.errorMessages.forEach(error => {
      const errorElement = document.createElement('div');
      errorElement.className = `error-message ${error.severity}`;
      errorElement.textContent = error.message;
      container.appendChild(errorElement);
    });
  }
  
  async onDestroy() {
    // Clean up event listeners
    eventBus.off(EVENTS.ERROR.SHOW, this.handleShowError);
    eventBus.off(EVENTS.ERROR.CLEAR, this.handleClearError);
  }
}

// Register the ErrorHandlerComponent
ComponentRegistry.register('error-handler', {
  ComponentClass: ErrorHandlerComponent,
  dependencies: [],
  config: {
    globalErrorContainer: 'global-error-container',
    autoHide: true,
    hideTimeout: 5000
  }
});