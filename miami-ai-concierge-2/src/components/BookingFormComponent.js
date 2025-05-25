class BookingFormComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.config = {
      validateOnChange: true,
      submitEndpoint: '/api/bookings',
      realTimeValidation: true,
      ...options.config
    };
    
    this.state = {
      isSubmitting: false,
      validationErrors: new Map(),
      formData: {}
    };
    
    // Bind methods
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.validateForm = this.validateForm.bind(this);
  }
  
  async onInitialize() {
    console.log('🎯 Initializing BookingForm component');
    
    // Get DOM elements using DOMManager
    this.elements = {
      form: DOMManager.getElement('#booking-form'),
      fromLocation: DOMManager.getElement('#from-location'),
      toAddress: DOMManager.getElement('#to-address'),
      experienceDropdown: DOMManager.getElement('#experience-dropdown'),
      submitButton: DOMManager.getElement('#submit-button')
    };
    
    this.setupEventListeners();
    this.initializeFormState();
  }
  
  setupEventListeners() {
    this.elements.form.addEventListener('submit', this.handleSubmit);
    this.elements.fromLocation.addEventListener('input', this.handleFieldChange);
    this.elements.toAddress.addEventListener('input', this.handleFieldChange);
    this.elements.experienceDropdown.addEventListener('change', this.handleFieldChange);
  }
  
  initializeFormState() {
    // Initialize form state if needed
  }
  
  async handleSubmit(event) {
    event.preventDefault();
    this.state.isSubmitting = true;
    
    const isValid = await this.validateForm();
    if (isValid) {
      const data = this.processFormData();
      await this.submitFormData(data);
    } else {
      this.state.isSubmitting = false;
    }
  }
  
  handleFieldChange(event) {
    const field = event.target;
    this.validateField(field);
  }
  
  async validateField(field) {
    // Implement field validation logic
  }
  
  async validateForm() {
    // Implement form validation logic
    return true; // Placeholder
  }
  
  processFormData() {
    console.log('📋 Processing form data...');
    return {
      'from-location': DOMManager.getValue(this.elements.fromLocation),
      'to-address': DOMManager.getValue(this.elements.toAddress),
      'experience': DOMManager.getValue(this.elements.experienceDropdown)
    };
  }
  
  async submitFormData(data) {
    // Implement form submission logic
  }
  
  handleSubmissionSuccess(data) {
    // Handle successful submission
  }
  
  handleSubmissionError(error) {
    // Handle submission error
  }
  
  resetForm() {
    // Reset form to initial state
  }
  
  async onDestroy() {
    // Clean up event listeners and resources
    this.elements.form.removeEventListener('submit', this.handleSubmit);
    // Remove other event listeners
  }
}

// Register the component with the ComponentRegistry
ComponentRegistry.register('booking-form', BookingFormComponent);