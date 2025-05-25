import EventBus from './core/EventBus.js';
import ComponentRegistry from './core/ComponentRegistry.js';
import { BookingFormComponent } from './components/BookingForm/index.js';
import { TabNavigationComponent } from './components/TabNavigation/index.js';
import { ErrorHandlerComponent } from './components/ErrorHandler/index.js';
import { LocationAutocompleteComponent } from './components/LocationAutocomplete/index.js';
import { VehicleSelectorComponent } from './components/VehicleSelector/index.js';

// Initialize the application
async function initApp() {
    console.log('🚀 Initializing Miami Concierge Application...');

    // Register components
    ComponentRegistry.register('booking-form', BookingFormComponent);
    ComponentRegistry.register('tab-navigation', TabNavigationComponent);
    ComponentRegistry.register('error-handler', ErrorHandlerComponent);
    ComponentRegistry.register('location-autocomplete', LocationAutocompleteComponent);
    ComponentRegistry.register('vehicle-selector', VehicleSelectorComponent);

    // Initialize components
    await Promise.all([
        ComponentRegistry.get('booking-form').initialize(),
        ComponentRegistry.get('tab-navigation').initialize(),
        ComponentRegistry.get('error-handler').initialize(),
        ComponentRegistry.get('location-autocomplete').initialize(),
        ComponentRegistry.get('vehicle-selector').initialize(),
    ]);

    console.log('✅ Miami Concierge Application initialized successfully');
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp);