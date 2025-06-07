/**
 * LocationAutocompleteComponent Registration
 * Registers the component with the ComponentRegistry system
 */

import ComponentRegistry from '../core/ComponentRegistry.js';
import LocationAutocompleteComponent from './LocationAutocompleteComponent.js';

// Register the LocationAutocompleteComponent
ComponentRegistry.register('location-autocomplete', LocationAutocompleteComponent, [], {
    description: 'Custom location autocomplete with Miami geographic biasing',
    version: '1.0.0',
    dependencies: ['LocationService', 'EventBus', 'DOMManager'],
    autoInit: false // Manual initialization required
});

console.log('🏢 LocationAutocompleteComponent registered with ComponentRegistry');

export default LocationAutocompleteComponent;