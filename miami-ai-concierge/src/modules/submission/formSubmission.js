import { BaseComponent } from '../../core/BaseComponent.js';
import { EventBus } from '../../core/EventBus.js';
import { processFormData, sendFormData } from './apiClient.js';
import { validateForm } from '../validation/formValidation.js';
import EventDefinitions from '../../core/EventDefinitions.js';

class FormSubmissionComponent extends BaseComponent {
    async onInitialize() {
        console.log('📋 Initializing FormSubmission component');
        this.form = DOMManager.getElement('#booking-form');
        this.submitButton = DOMManager.getElement('#submit-button');

        this.setupEventListeners();
    }

    setupEventListeners() {
        DOMManager.addEventListener(this.form, 'submit', this.handleSubmit.bind(this));
    }

    async handleSubmit(event) {
        event.preventDefault();
        const formData = processFormData(this.form);

        const validationResult = validateForm(this.form.id);
        if (!validationResult.isValid) {
            validationResult.errors.forEach(error => {
                EventBus.emit(EventDefinitions.EVENTS.ERROR.SHOW, {
                    fieldId: error.fieldId,
                    message: error.message
                });
            });
            return;
        }

        try {
            await sendFormData(formData);
            EventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_SUCCEEDED, formData);
        } catch (error) {
            EventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_FAILED, {
                error: error.message
            });
        }
    }

    async onDestroy() {
        DOMManager.removeEventListener(this.form, 'submit');
    }
}

export default FormSubmissionComponent;