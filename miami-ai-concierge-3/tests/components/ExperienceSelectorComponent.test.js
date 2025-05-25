import ExperienceSelectorComponent from '../../src/components/ExperienceSelectorComponent.js';
import { EventBus } from '../../src/core/EventBus.js';
import DOMManager from '../../src/core/DOMManager.js';

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
    });

    test('should initialize the component correctly', () => {
        expect(component).toBeDefined();
        expect(mockElements.experienceDropdown).toBeDefined();
        expect(mockElements.experienceDescription).toBeDefined();
    });

    test('should handle experience selection', () => {
        const experienceOption = document.createElement('option');
        experienceOption.value = 'yacht';
        experienceOption.textContent = 'Yacht & Boat Charters';
        mockElements.experienceDropdown.appendChild(experienceOption);
        
        mockElements.experienceDropdown.value = 'yacht';
        mockElements.experienceDropdown.dispatchEvent(new Event('change'));

        expect(mockElements.experienceDescription.textContent).toContain('Yacht & Boat Charters');
    });

    test('should emit an event when an experience is selected', () => {
        const spy = jest.spyOn(EventBus, 'emit');
        
        mockElements.experienceDropdown.value = 'yacht';
        mockElements.experienceDropdown.dispatchEvent(new Event('change'));

        expect(spy).toHaveBeenCalledWith('experience:selected', { experience: 'yacht' });
    });

    test('should update the DOM when an experience is selected', () => {
        const experienceOption = document.createElement('option');
        experienceOption.value = 'yacht';
        experienceOption.textContent = 'Yacht & Boat Charters';
        mockElements.experienceDropdown.appendChild(experienceOption);
        
        mockElements.experienceDropdown.value = 'yacht';
        mockElements.experienceDropdown.dispatchEvent(new Event('change'));

        expect(mockElements.experienceDescription.textContent).toBe('Yacht & Boat Charters');
    });
});