import { EventBus } from '../src/core/EventBus.js';
import { EVENTS } from '../src/core/EventDefinitions.js';
import { DOMManager } from '../src/core/DOMManager.js';
import { ExperienceSelectorComponent } from '../src/components/ExperienceSelectorComponent.js';

describe('ExperienceSelectorComponent', () => {
    let component;
    let mockElements;

    beforeEach(() => {
        mockElements = {
            experienceDropdown: document.createElement('select'),
            experienceDescription: document.createElement('div')
        };
        component = new ExperienceSelectorComponent({ elements: mockElements });
        component.initialize();
    });

    afterEach(() => {
        component.destroy();
        DOMManager.clearCache();
    });

    test('should initialize with default values', () => {
        expect(component).toBeDefined();
        expect(mockElements.experienceDropdown.value).toBe('');
    });

    test('should update experience description on selection', () => {
        const experienceOption = document.createElement('option');
        experienceOption.value = 'yacht';
        experienceOption.textContent = 'Yacht & Boat Charters';
        mockElements.experienceDropdown.appendChild(experienceOption);
        mockElements.experienceDropdown.value = 'yacht';

        component.handleExperienceChange();

        expect(mockElements.experienceDescription.textContent).toContain('Luxury marine experiences');
    });

    test('should emit an event when experience is selected', () => {
        const experienceOption = document.createElement('option');
        experienceOption.value = 'relocation';
        experienceOption.textContent = 'Miami Relocation';
        mockElements.experienceDropdown.appendChild(experienceOption);
        mockElements.experienceDropdown.value = 'relocation';

        const eventSpy = jest.spyOn(EventBus, 'emit');

        component.handleExperienceChange();

        expect(eventSpy).toHaveBeenCalledWith(EVENTS.FORM.FIELD_CHANGED, {
            field: 'experience',
            value: 'relocation'
        });
    });

    test('should handle errors gracefully', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        component.handleErrorShow({ message: 'Test error' });

        expect(errorSpy).toHaveBeenCalledWith('Error in ExperienceSelectorComponent:', { message: 'Test error' });

        errorSpy.mockRestore();
    });
});