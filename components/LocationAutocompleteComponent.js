/**
 * LocationAutocompleteComponent.js - Custom Location Autocomplete for Miami AI Concierge
 * 
 * Replaces Google's shadow DOM <gmp-place-autocomplete> elements with a custom
 * implementation that integrates with the existing EventBus architecture and
 * LocationService for optimal performance and Miami-specific functionality.
 * 
 * Features:
 * - Custom dropdown UI with keyboard navigation
 * - Integration with LocationService for cached searches
 * - EventBus integration for form validation
 * - Debounced input handling (300ms)
 * - Accessibility compliance
 * - Loading states and error handling
 * - Miami geographic biasing
 */

import DOMManager from '../core/DOMManager.js';
import EventDefinitions from '../core/EventDefinitions.js';

/**
 * LocationAutocompleteComponent - Custom autocomplete for location inputs
 * @extends BaseComponent
 */
class LocationAutocompleteComponent {
    /**
     * Create a LocationAutocompleteComponent instance
     * @param {Object} config - Configuration object
     * @param {string} config.componentId - Unique component identifier
     * @param {string} config.inputId - ID of the input element to attach to
     * @param {string} config.placeholder - Placeholder text for the input
     * @param {Object} config.eventBus - EventBus instance
     * @param {Object} config.options - Additional options
     */
    constructor(config = {}) {
        // Initialize component properties
        this.componentId = config.componentId || `location-autocomplete-${Date.now()}`;
        this.inputId = config.inputId;
        this.placeholder = config.placeholder || 'Enter location...';
        this.eventBus = config.eventBus || window.eventBus;
        this.options = config.options || {};
        
        // Component state
        this.isInitialized = false;
        this.isLoading = false;
        this.isDropdownOpen = false;
        this.selectedIndex = -1;
        this.suggestions = [];
        this.selectedPlace = null;
        this.debounceTimer = null;
        
        // DOM elements
        this.input = null;
        this.container = null;
        this.dropdown = null;
        this.loadingIndicator = null;
        this.clearButton = null;
        
        // Configuration
        this.config = {
            debounceDelay: 300,
            maxSuggestions: 8,
            minQueryLength: 2,
            showCurrentLocation: true,
            ...this.options
        };
        
        console.log(`🏢 LocationAutocompleteComponent created for input: ${this.inputId}`);
    }
    
    /**
     * Initialize the component
     * @returns {Promise<boolean>} Success status
     */
    async onInitialize() {
        try {
            console.log(`🔄 Initializing LocationAutocompleteComponent for ${this.inputId}`);
            
            // Find and validate input element
            this.input = DOMManager.getElementById(this.inputId);
            if (!this.input) {
                throw new Error(`Input element with ID "${this.inputId}" not found`);
            }
            
            // Wait for LocationService to be available
            await this.waitForLocationService();
            
            // Create container structure
            this.createContainerStructure();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize accessibility
            this.setupAccessibility();
            
            // Apply initial styling
            this.applyInitialStyling();
            
            this.isInitialized = true;
            
            // Emit initialization event
            this.emitEvent(EventDefinitions.EVENTS.SYSTEM.COMPONENT_INITIALIZED, {
                componentId: this.componentId,
                inputId: this.inputId
            });
            
            console.log(`✅ LocationAutocompleteComponent initialized for ${this.inputId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to initialize LocationAutocompleteComponent for ${this.inputId}:`, error);
            this.emitEvent(EventDefinitions.EVENTS.ERROR.COMPONENT_ERROR, {
                componentId: this.componentId,
                error: error.message
            });
            return false;
        }
    }
      /**
     * Wait for LocationService to be available
     * @private
     */
    async waitForLocationService() {
        try {
            // Use the global helper function if available
            if (typeof window.waitForLocationService === 'function') {
                console.log(`🔄 Using global waitForLocationService helper for ${this.inputId}`);
                await window.waitForLocationService(10000); // 10 second timeout
                console.log('✅ LocationService is ready');
                return;
            }
            
            // Fallback to manual check
            console.log(`🔄 Using fallback LocationService check for ${this.inputId}`);
            let attempts = 0;
            const maxAttempts = 100;
            
            return new Promise((resolve, reject) => {
                const checkService = () => {
                    attempts++;
                    
                    if (window.miamiLocationService && window.miamiLocationService.isInitialized) {
                        console.log('✅ LocationService is ready');
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        reject(new Error('LocationService not available after timeout'));
                    } else {
                        setTimeout(checkService, 100);
                    }
                };
                
                checkService();
            });
        } catch (error) {
            console.error(`❌ Error waiting for LocationService: ${error.message}`);
            throw new Error(`LocationService initialization failed: ${error.message}`);
        }
    }
    
    /**
     * Create the container structure around the input
     * @private
     */
    createContainerStructure() {
        // Create main container
        this.container = DOMManager.createElement('div', {
            className: 'location-autocomplete-container',
            'data-component-id': this.componentId
        });
        
        // Wrap the existing input
        const parent = this.input.parentNode;
        parent.insertBefore(this.container, this.input);
        this.container.appendChild(this.input);
        
        // Create dropdown
        this.dropdown = DOMManager.createElement('div', {
            className: 'location-dropdown hidden',
            id: `${this.inputId}-dropdown`,
            role: 'listbox',
            'aria-label': 'Location suggestions'
        });
        
        // Create loading indicator
        this.loadingIndicator = DOMManager.createElement('div', {
            className: 'location-loading hidden',
            innerHTML: `
                <div class="loading-spinner"></div>
                <span>Searching locations...</span>
            `
        });
        
        // Create clear button
        this.clearButton = DOMManager.createElement('button', {
            className: 'location-clear-btn hidden',
            type: 'button',
            'aria-label': 'Clear location',
            innerHTML: '×'
        });
        
        // Create current location button if enabled
        if (this.config.showCurrentLocation) {
            this.currentLocationBtn = DOMManager.createElement('button', {
                className: 'location-current-btn',
                type: 'button',
                'aria-label': 'Use current location',
                innerHTML: `
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                    </svg>
                    Current Location
                `
            });
        }
        
        // Append elements to container
        this.container.appendChild(this.clearButton);
        this.container.appendChild(this.loadingIndicator);
        this.container.appendChild(this.dropdown);
        
        if (this.currentLocationBtn) {
            this.container.appendChild(this.currentLocationBtn);
        }
    }
    
    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        // Input events
        DOMManager.addEventListener(this.input, 'input', this.handleInput.bind(this));
        DOMManager.addEventListener(this.input, 'focus', this.handleFocus.bind(this));
        DOMManager.addEventListener(this.input, 'blur', this.handleBlur.bind(this));
        DOMManager.addEventListener(this.input, 'keydown', this.handleKeydown.bind(this));
        
        // Clear button
        DOMManager.addEventListener(this.clearButton, 'click', this.handleClear.bind(this));
        
        // Current location button
        if (this.currentLocationBtn) {
            DOMManager.addEventListener(this.currentLocationBtn, 'click', this.handleCurrentLocation.bind(this));
        }
        
        // Dropdown events
        DOMManager.addEventListener(this.dropdown, 'click', this.handleDropdownClick.bind(this));
        
        // Outside click handling
        DOMManager.addEventListener(document, 'click', this.handleDocumentClick.bind(this));
        
        // Window resize
        DOMManager.addEventListener(window, 'resize', this.handleResize.bind(this));
    }
    
    /**
     * Setup accessibility attributes
     * @private
     */
    setupAccessibility() {
        // Input accessibility
        DOMManager.setAttribute(this.input, 'role', 'combobox');
        DOMManager.setAttribute(this.input, 'aria-autocomplete', 'list');
        DOMManager.setAttribute(this.input, 'aria-expanded', 'false');
        DOMManager.setAttribute(this.input, 'aria-owns', this.dropdown.id);
        DOMManager.setAttribute(this.input, 'autocomplete', 'off');
        
        // Set placeholder
        if (this.placeholder) {
            DOMManager.setAttribute(this.input, 'placeholder', this.placeholder);
        }
    }
    
    /**
     * Apply initial styling to the component
     * @private
     */
    applyInitialStyling() {
        // Add component-specific classes
        DOMManager.addClass(this.container, 'location-autocomplete-miami');
        DOMManager.addClass(this.input, 'location-autocomplete-input');
        
        // Set initial state
        this.updateClearButtonVisibility();
    }
    
    /**
     * Handle input events with debouncing
     * @private
     */
    handleInput(event) {
        const query = event.target.value.trim();
        
        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // Update clear button visibility
        this.updateClearButtonVisibility();
        
        // Clear selection if input changes
        if (this.selectedPlace) {
            this.clearSelection();
        }
        
        // Handle empty query
        if (query.length < this.config.minQueryLength) {
            this.hideDropdown();
            return;
        }
        
        // Debounced search
        this.debounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, this.config.debounceDelay);
        
        // Emit field changed event
        this.emitEvent(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, {
            fieldId: this.inputId,
            value: query,
            hasValidSelection: false
        });
    }
    
    /**
     * Handle input focus
     * @private
     */
    handleFocus(event) {
        const query = event.target.value.trim();
        
        // Show existing suggestions if available
        if (query.length >= this.config.minQueryLength && this.suggestions.length > 0) {
            this.showDropdown();
        }
        
        // Emit focus event
        this.emitEvent(EventDefinitions.EVENTS.UI.FIELD_STYLED, {
            fieldId: this.inputId,
            state: 'focused'
        });
    }
    
    /**
     * Handle input blur with delay for dropdown interaction
     * @private
     */
    handleBlur(event) {
        // Delay hiding dropdown to allow for dropdown clicks
        setTimeout(() => {
            if (!this.container.contains(document.activeElement)) {
                this.hideDropdown();
            }
        }, 150);
    }
    
    /**
     * Handle keyboard navigation
     * @private
     */
    handleKeydown(event) {
        if (!this.isDropdownOpen) {
            return;
        }
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.navigateDropdown(1);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.navigateDropdown(-1);
                break;
                
            case 'Enter':
                event.preventDefault();
                this.selectCurrentSuggestion();
                break;
                
            case 'Escape':
                event.preventDefault();
                this.hideDropdown();
                this.input.blur();
                break;
                
            case 'Tab':
                this.hideDropdown();
                break;
        }
    }
    
    /**
     * Handle clear button click
     * @private
     */
    handleClear(event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.clearInput();
        this.input.focus();
    }
    
    /**
     * Handle current location button click
     * @private
     */
    async handleCurrentLocation(event) {
        event.preventDefault();
        event.stopPropagation();
        
        try {
            this.setLoading(true);
            
            const location = await window.miamiLocationService.getCurrentLocation();
            
            // Reverse geocode to get address
            const place = await window.miamiLocationService.geocodeAddress(
                `${location.lat},${location.lng}`
            );
            
            if (place) {
                this.selectPlace({
                    place_id: place.place_id,
                    name: 'Current Location',
                    formatted_address: place.formatted_address,
                    coordinates: location,
                    isCurrentLocation: true
                });
            }
            
        } catch (error) {
            console.error('Error getting current location:', error);
            this.emitEvent(EventDefinitions.EVENTS.ERROR.SHOW, {
                fieldId: this.inputId,
                message: 'Unable to get current location. Please enter address manually.'
            });
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Handle dropdown click events
     * @private
     */
    handleDropdownClick(event) {
        const suggestionItem = event.target.closest('.suggestion-item');
        if (suggestionItem) {
            const index = parseInt(suggestionItem.dataset.index);
            this.selectSuggestion(index);
        }
    }
    
    /**
     * Handle document click for outside click detection
     * @private
     */
    handleDocumentClick(event) {
        if (!this.container.contains(event.target)) {
            this.hideDropdown();
        }
    }
    
    /**
     * Handle window resize
     * @private
     */
    handleResize() {
        if (this.isDropdownOpen) {
            this.positionDropdown();
        }
    }
    
    /**
     * Perform location search using LocationService
     * @private
     */
    async performSearch(query) {
        try {
            this.setLoading(true);
            
            console.log(`🔍 Searching for: "${query}"`);
            
            const results = await window.miamiLocationService.searchPlaces(query, {
                types: ['establishment', 'geocode'],
                componentRestrictions: { country: 'us' }
            });
            
            this.suggestions = results.slice(0, this.config.maxSuggestions);
            this.selectedIndex = -1;
            
            if (this.suggestions.length > 0) {
                this.renderSuggestions();
                this.showDropdown();
            } else {
                this.renderNoResults();
                this.showDropdown();
            }
            
            console.log(`✅ Found ${this.suggestions.length} suggestions for "${query}"`);
            
        } catch (error) {
            console.error('Search error:', error);
            this.renderError('Failed to search locations. Please try again.');
            this.showDropdown();
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Render suggestions in dropdown
     * @private
     */
    renderSuggestions() {
        const html = this.suggestions.map((suggestion, index) => `
            <div class="suggestion-item ${index === this.selectedIndex ? 'selected' : ''}" 
                 data-index="${index}" 
                 role="option" 
                 aria-selected="${index === this.selectedIndex}">
                <div class="suggestion-main">
                    <span class="suggestion-name">${this.escapeHtml(suggestion.name)}</span>
                    ${suggestion.isAirport ? '<span class="airport-badge">✈️ Airport</span>' : ''}
                </div>
                <div class="suggestion-address">${this.escapeHtml(suggestion.formatted_address)}</div>
                <div class="suggestion-confidence" style="display: none;">${suggestion.confidence}</div>
            </div>
        `).join('');
        
        this.dropdown.innerHTML = html;
        this.updateAriaAttributes();
    }
    
    /**
     * Render no results message
     * @private
     */
    renderNoResults() {
        this.dropdown.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-text">No locations found</div>
                <div class="no-results-suggestion">Try a different search term</div>
            </div>
        `;
    }
    
    /**
     * Render error message
     * @private
     */
    renderError(message) {
        this.dropdown.innerHTML = `
            <div class="search-error">
                <div class="error-icon">⚠️</div>
                <div class="error-text">${this.escapeHtml(message)}</div>
            </div>
        `;
    }
    
    /**
     * Navigate dropdown with keyboard
     * @private
     */
    navigateDropdown(direction) {
        const newIndex = this.selectedIndex + direction;
        
        if (newIndex >= -1 && newIndex < this.suggestions.length) {
            this.selectedIndex = newIndex;
            this.updateDropdownSelection();
        }
    }
    
    /**
     * Update dropdown visual selection
     * @private
     */
    updateDropdownSelection() {
        const items = this.dropdown.querySelectorAll('.suggestion-item');
        
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                DOMManager.addClass(item, 'selected');
                DOMManager.setAttribute(item, 'aria-selected', 'true');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                DOMManager.removeClass(item, 'selected');
                DOMManager.setAttribute(item, 'aria-selected', 'false');
            }
        });
        
        this.updateAriaAttributes();
    }
    
    /**
     * Select current highlighted suggestion
     * @private
     */
    selectCurrentSuggestion() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestions.length) {
            this.selectSuggestion(this.selectedIndex);
        }
    }
    
    /**
     * Select a suggestion by index
     * @private
     */
    async selectSuggestion(index) {
        if (index < 0 || index >= this.suggestions.length) {
            return;
        }
        
        const suggestion = this.suggestions[index];
        
        try {
            // Get detailed place information
            const placeDetails = await window.miamiLocationService.getPlaceDetails(suggestion.place_id);
            
            this.selectPlace(placeDetails);
            
        } catch (error) {
            console.error('Error getting place details:', error);
            
            // Fallback to basic suggestion data
            this.selectPlace(suggestion);
        }
    }
    
    /**
     * Select a place and update component state
     * @private
     */
    selectPlace(place) {
        this.selectedPlace = place;
        
        // Update input value
        DOMManager.setValue(this.input, place.name || place.formatted_address);
        
        // Store place data
        this.input.dataset.selectedPlace = JSON.stringify(place);
        this.input.dataset.placeId = place.place_id;
        this.input.dataset.formattedAddress = place.formatted_address;
        
        if (place.coordinates) {
            this.input.dataset.lat = place.coordinates.lat;
            this.input.dataset.lng = place.coordinates.lng;
        }
        
        // Hide dropdown
        this.hideDropdown();
        
        // Update UI state
        this.updateClearButtonVisibility();
        DOMManager.addClass(this.container, 'has-selection');
        
        // Emit selection events
        this.emitEvent(EventDefinitions.EVENTS.LOCATION.SELECTED, {
            inputId: this.inputId,
            place: place,
            source: 'user-selection'
        });
        
        this.emitEvent(EventDefinitions.EVENTS.FORM.FIELD_VALIDATED, {
            fieldId: this.inputId,
            isValid: true,
            value: place.formatted_address
        });
        
        console.log(`✅ Location selected for ${this.inputId}:`, place.name);
    }
    
    /**
     * Clear current selection
     * @private
     */
    clearSelection() {
        this.selectedPlace = null;
        
        // Clear data attributes
        delete this.input.dataset.selectedPlace;
        delete this.input.dataset.placeId;
        delete this.input.dataset.formattedAddress;
        delete this.input.dataset.lat;
        delete this.input.dataset.lng;
        
        // Update UI state
        DOMManager.removeClass(this.container, 'has-selection');
        
        // Emit clearing events
        this.emitEvent(EventDefinitions.EVENTS.LOCATION.CLEARED, {
            inputId: this.inputId
        });
        
        this.emitEvent(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, {
            fieldId: this.inputId,
            value: DOMManager.getValue(this.input),
            hasValidSelection: false
        });
    }
    
    /**
     * Clear input and selection
     * @private
     */
    clearInput() {
        DOMManager.setValue(this.input, '');
        this.clearSelection();
        this.hideDropdown();
        this.updateClearButtonVisibility();
        
        this.emitEvent(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, {
            fieldId: this.inputId,
            value: '',
            hasValidSelection: false
        });
    }
    
    /**
     * Show dropdown
     * @private
     */
    showDropdown() {
        if (this.isDropdownOpen) return;
        
        this.isDropdownOpen = true;
        DOMManager.removeClass(this.dropdown, 'hidden');
        DOMManager.setAttribute(this.input, 'aria-expanded', 'true');
        
        this.positionDropdown();
        
        // Add body scroll lock for mobile
        if (window.innerWidth <= 768) {
            DOMManager.addClass(document.body, 'dropdown-open');
        }
    }
    
    /**
     * Hide dropdown
     * @private
     */
    hideDropdown() {
        if (!this.isDropdownOpen) return;
        
        this.isDropdownOpen = false;
        DOMManager.addClass(this.dropdown, 'hidden');
        DOMManager.setAttribute(this.input, 'aria-expanded', 'false');
        this.selectedIndex = -1;
        
        // Remove body scroll lock
        DOMManager.removeClass(document.body, 'dropdown-open');
    }
    
    /**
     * Position dropdown relative to input
     * @private
     */
    positionDropdown() {
        const inputRect = this.input.getBoundingClientRect();
        const dropdownHeight = this.dropdown.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Reset positioning
        this.dropdown.style.top = '';
        this.dropdown.style.bottom = '';
        
        // Determine if dropdown should appear above or below
        const spaceBelow = viewportHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;
        
        if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
            // Show below
            this.dropdown.style.top = '100%';
        } else {
            // Show above
            this.dropdown.style.bottom = '100%';
        }
    }
    
    /**
     * Set loading state
     * @private
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            DOMManager.removeClass(this.loadingIndicator, 'hidden');
            DOMManager.addClass(this.container, 'loading');
        } else {
            DOMManager.addClass(this.loadingIndicator, 'hidden');
            DOMManager.removeClass(this.container, 'loading');
        }
    }
    
    /**
     * Update clear button visibility
     * @private
     */
    updateClearButtonVisibility() {
        const hasValue = DOMManager.getValue(this.input).trim().length > 0;
        
        if (hasValue) {
            DOMManager.removeClass(this.clearButton, 'hidden');
        } else {
            DOMManager.addClass(this.clearButton, 'hidden');
        }
    }
    
    /**
     * Update ARIA attributes for accessibility
     * @private
     */
    updateAriaAttributes() {
        const activeDescendant = this.selectedIndex >= 0 
            ? `${this.inputId}-suggestion-${this.selectedIndex}` 
            : '';
            
        DOMManager.setAttribute(this.input, 'aria-activedescendant', activeDescendant);
    }
    
    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Emit event through EventBus
     * @private
     */
    emitEvent(eventName, data) {
        if (this.eventBus && this.eventBus.emit) {
            this.eventBus.emit(eventName, {
                componentId: this.componentId,
                inputId: this.inputId,
                timestamp: Date.now(),
                ...data
            });
        }
    }
    
    /**
     * Get the currently selected place
     * @returns {Object|null} Selected place data
     */
    getSelectedPlace() {
        return this.selectedPlace;
    }
    
    /**
     * Check if component has a valid selection
     * @returns {boolean} True if valid selection exists
     */
    hasValidSelection() {
        return this.selectedPlace !== null;
    }
    
    /**
     * Programmatically set a place
     * @param {Object} place - Place data to set
     */
    setPlace(place) {
        this.selectPlace(place);
    }
    
    /**
     * Get component validation state
     * @returns {Object} Validation state
     */
    getValidationState() {
        return {
            isValid: this.hasValidSelection(),
            hasValue: DOMManager.getValue(this.input).trim().length > 0,
            selectedPlace: this.selectedPlace,
            inputValue: DOMManager.getValue(this.input)
        };
    }
    
    /**
     * Cleanup component resources
     */
    async onDestroy() {
        try {
            console.log(`🧹 Destroying LocationAutocompleteComponent for ${this.inputId}`);
            
            // Clear timers
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            
            // Remove event listeners - DOMManager handles cleanup
            // Remove dropdown from DOM
            if (this.dropdown && this.dropdown.parentNode) {
                this.dropdown.parentNode.removeChild(this.dropdown);
            }
            
            // Remove container wrapper and restore original input
            if (this.container && this.container.parentNode) {
                this.container.parentNode.insertBefore(this.input, this.container);
                this.container.parentNode.removeChild(this.container);
            }
            
            // Clear references
            this.input = null;
            this.container = null;
            this.dropdown = null;
            this.suggestions = [];
            this.selectedPlace = null;
            
            this.isInitialized = false;
            
            console.log(`✅ LocationAutocompleteComponent destroyed for ${this.inputId}`);
            
        } catch (error) {
            console.error(`❌ Error destroying LocationAutocompleteComponent for ${this.inputId}:`, error);
        }
    }
}

// Export the component
export default LocationAutocompleteComponent;

// Also make available globally for non-module usage
if (typeof window !== 'undefined') {
    window.LocationAutocompleteComponent = LocationAutocompleteComponent;
}

console.log('🏢 LocationAutocompleteComponent module loaded successfully');