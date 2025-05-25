class BookingFormComponent extends BaseComponent {
  async onInitialize() {
    console.log('🎯 Initializing BookingForm component');
    
    this.form = DOMManager.getElementById('booking-form');
    this.submitButton = DOMManager.getElementById('submit-button');
    
    if (!this.form) {
      console.error('Booking form element not found');
      return;
    }
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Set up form submission
    DOMManager.addEventListener(this.form, 'submit', this.handleSubmit.bind(this));
    
    // Listen for validation events
    this.eventBus.on(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, this.handleFieldChange.bind(this));
  }
  
  handleSubmit(event) {
    event.preventDefault();
    
    const dataObject = processFormData({ form: this.form });
    const validation = validateForm(dataObject, this.getServiceType());
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        this.eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOW, { fieldId: error.fieldId, message: error.message });
      });
      return;
    }
    
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_STARTED, {
      formId: 'booking-form',
      timestamp: Date.now()
    });
    
    sendFormData(dataObject, { form: this.form }, { submitEndpoint: '/api/bookings' });
  }
  
  handleFieldChange(data) {
    console.log('📝 Field changed in BookingForm:', data);
    // Update form state or validation
  }
  
  async onDestroy() {
    // Clean up event listeners
    DOMManager.removeEventListener(this.form, 'submit');
    this.eventBus.off(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, this.handleFieldChange);
  }
}

export default BookingFormComponent;