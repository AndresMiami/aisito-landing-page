import { ComponentRegistry } from './core/ComponentRegistry.js';
import { BookingFormComponent } from './components/BookingFormComponent.js';
import { TabNavigationComponent } from './components/TabNavigationComponent.js';
import { ExperienceSelectorComponent } from './components/ExperienceSelectorComponent.js';
import { VehicleSelectionComponent } from './components/VehicleSelectionComponent.js';
import { LocationPickerComponent } from './components/LocationPickerComponent.js';
import { DateTimePickerComponent } from './components/DateTimePickerComponent.js';
import { ErrorHandlerComponent } from './components/ErrorHandlerComponent.js';

// Initialize components
async function initializeApp() {
    console.log('🚀 Initializing Miami AI Concierge application...');

    // Register components
    ComponentRegistry.register('booking-form', BookingFormComponent);
    ComponentRegistry.register('tab-navigation', TabNavigationComponent);
    ComponentRegistry.register('experience-selector', ExperienceSelectorComponent);
    ComponentRegistry.register('vehicle-selection', VehicleSelectionComponent);
    ComponentRegistry.register('location-picker', LocationPickerComponent);
    ComponentRegistry.register('date-time-picker', DateTimePickerComponent);
    ComponentRegistry.register('error-handler', ErrorHandlerComponent);

    // Initialize all components
    await ComponentRegistry.initializeAll();
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);