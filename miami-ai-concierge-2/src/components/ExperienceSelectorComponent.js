import { BaseComponent } from '../core/BaseComponent.js';
import eventBus from '../core/EventBus.js';
import DOMManager from '../core/DOMManager.js';
import { EVENTS } from '../core/EventDefinitions.js';

class ExperienceSelectorComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    this.config = {
      experienceDropdownId: 'experience-dropdown',
      ...options.config
    };
    this.state = {
      selectedExperience: null
    };
  }

  async onInitialize() {
    console.log('🎯 Initializing ExperienceSelector component');
    this.setupEventListeners();
    this.initializeDropdown();
  }

  setupEventListeners() {
    const dropdown = DOMManager.getElement(`#${this.config.experienceDropdownId}`);
    dropdown.addEventListener('change', this.handleExperienceChange.bind(this));
  }

  initializeDropdown() {
    const dropdown = DOMManager.getElement(`#${this.config.experienceDropdownId}`);
    if (dropdown) {
      this.state.selectedExperience = dropdown.value;
    }
  }

  handleExperienceChange(event) {
    this.state.selectedExperience = event.target.value;
    eventBus.emit(EVENTS.FORM.FIELD_CHANGED, {
      field: this.config.experienceDropdownId,
      value: this.state.selectedExperience
    });
    console.log(`Selected experience changed to: ${this.state.selectedExperience}`);
  }

  async onDestroy() {
    console.log('🗑️ Destroying ExperienceSelector component');
    const dropdown = DOMManager.getElement(`#${this.config.experienceDropdownId}`);
    dropdown.removeEventListener('change', this.handleExperienceChange.bind(this));
  }
}

export default ExperienceSelectorComponent;