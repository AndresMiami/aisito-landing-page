/**
 * ExperienceSearchBar.js - Modular component for Miami Concierge
 * 
 * This component provides search functionality for experiences, including:
 * - Date picker (with calendar integration)
 * - Guest selector
 * - Modal management
 * - Integration with the event bus system
 */

import { BaseComponent } from '../../core/ComponentRegistry.js';
import DOMManager from '../../core/DOMManager.js';
import EventDefinitions from '../../core/EventDefinitions.js';

/**
 * ExperienceSearchBar component class
 * @extends BaseComponent
 */
class ExperienceSearchBar extends BaseComponent {
    /**
     * Create a new ExperienceSearchBar instance
     * @param {string} containerId - The ID of the container element
     * @param {Object} eventBus - The event bus instance
     * @param {Object} config - Configuration options
     */
    constructor(containerId, eventBus, config = {}) {
        super({
            componentId: containerId || 'experienceSearchContainer',
            eventBus,
            config
        });
        
        // State variables
        this.currentModalType = null;
        this.selectedDate = null;
        this.selectedLocation = '';
        this.guests = {
            adults: config.defaultAdults || 2,
            children: config.defaultChildren || 0,
            infants: config.defaultInfants || 0
        };
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        
        // Calendar instance
        this.calendar = null;
    }

    /**
     * Initialize the component
     * This should be called after the component is created
     */
    initialize() {
        console.log('🔄 Initializing Experience Search Bar component');
        this.initializeElements();
        this.attachEventListeners();
        
        // Add direct event handlers for immediate use
        if (this.dateSection) {
            this.dateSection.addEventListener('click', () => this.showDateModal());
        }
        
        if (this.guestSection) {
            this.guestSection.addEventListener('click', () => this.showGuestModal());
        }
    }

    /**
     * Initialize element references
     */
    initializeElements() {
        // Search bar elements
        this.container = DOMManager.getElementById(this.componentId);
        this.dateSection = DOMManager.getElementById('experienceDateSection');
        this.guestSection = DOMManager.getElementById('experienceGuestSection');
        this.searchButton = DOMManager.getElementById('experienceSearchButton');
        
        // Values display elements
        this.dateValue = DOMManager.getElementById('experienceDateValue');
        this.guestValue = DOMManager.getElementById('experienceGuestValue');
        
        // Legacy modal elements (kept for backward compatibility)
        this.modalOverlay = DOMManager.getElementById('experienceModalOverlay');
        this.locationModal = DOMManager.getElementById('experienceLocationModal');
        this.dateModal = DOMManager.getElementById('experienceDateModal');
        this.guestModal = DOMManager.getElementById('experienceGuestModal');
        
        // New unified modal system elements
        this.modal = DOMManager.getElementById('modal');
        this.modalTitle = DOMManager.getElementById('modalTitle');
        this.modalBody = DOMManager.getElementById('modalBody');
        this.closeModalBtn = DOMManager.getElementById('closeModal');
        this.confirmBtn = DOMManager.getElementById('confirmSelection');
        
        // Validate required elements
        if (!this.container) {
            console.error(`ExperienceSearchBar: Container '#${this.componentId}' not found`);
            this.onError(new Error(`Container '#${this.componentId}' not found`));
        }
    }

    /**
     * Initialize the date options with current dates
     */
    initDateOptions() {
        // Set up the date options with current dates
        const today = new Date();
        
        // Format and display today's date
        const todayEl = DOMManager.getElementById('todayDate');
        if (todayEl) {
            todayEl.textContent = this.formatDate(today);
        }
        
        // Tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowEl = DOMManager.getElementById('tomorrowDate');
        if (tomorrowEl) {
            tomorrowEl.textContent = this.formatDate(tomorrow);
        }
        
        // Weekend (next Saturday)
        const weekend = new Date();
        weekend.setDate(today.getDate() + (6 - today.getDay()));
        const weekendEl = DOMManager.getElementById('weekendDate');
        if (weekendEl) {
            weekendEl.textContent = this.formatDate(weekend);
        }
        
        // Next week (7 days from now)
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        const nextWeekEl = DOMManager.getElementById('nextWeekDate');
        if (nextWeekEl) {
            nextWeekEl.textContent = this.formatDate(nextWeek);
        }
        
        // Next month
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);
        const nextMonthEl = DOMManager.getElementById('nextMonthDate');
        if (nextMonthEl) {
            nextMonthEl.textContent = this.formatDate(nextMonth);
        }
        
        console.log('✅ Date options initialized');
    }
    
    /**
     * Initialize the flatpickr calendar
     */
    initCalendar() {
        // Initialize the flatpickr calendar if available
        const calendarContainer = DOMManager.getElementById('experienceCalendar');
        
        if (calendarContainer && window.flatpickr) {
            this.calendar = flatpickr(calendarContainer, {
                inline: true,
                minDate: 'today',
                dateFormat: 'Y-m-d',
                onChange: (selectedDates, dateStr) => {
                    if (selectedDates.length > 0) {
                        this.selectedDate = this.formatDate(selectedDates[0]);
                        console.log('Calendar date selected:', this.selectedDate);
                    }
                }
            });
            console.log('✅ Calendar initialized');
        } else {
            console.log('⚠️ Flatpickr not available or calendar container not found');
        }
    }

    /**
     * Initialize Google Maps Place Autocomplete
     */
    initPlaceAutocomplete() {
        // Get the place autocomplete element
        const placeInput = DOMManager.getElementById('from-location-exp');
        if (!placeInput) {
            console.warn('Place autocomplete input not found');
            return;
        }
        
        // We don't need to initialize the autocomplete as it's already handled by Google Maps API
        // Just add a listener to store the selected place
        placeInput.addEventListener('gmp-placeselect', (event) => {
            const place = event.target.place;
            if (place) {
                const name = place.displayName || place.name || place.formatted_address;
                console.log('Selected place:', name);
                this.selectedLocation = {
                    name: name,
                    placeId: place.id,
                    coordinates: place.geometry ? {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    } : null
                };
                
                // Emit an event with the selected location
                this.eventBus.emit(EventDefinitions.LOCATION_EVENTS.SELECTED, {
                    location: this.selectedLocation,
                    source: 'experience-search-bar'
                });
            }
        });
        
        console.log('✅ Place Autocomplete initialized');
    }

    /**
     * Attach event listeners to the component elements
     */
    attachEventListeners() {
        console.log('🔄 Attaching experience search bar event listeners');
        
        // Add event listeners to search sections for opening modals
        if (this.dateSection) {
            this.dateSection.addEventListener('click', () => {
                console.log('📅 Date section clicked');
                this.showModal('date');
                this.eventBus.emit(EventDefinitions.UI_EVENTS.MODAL_OPEN, { 
                    modalType: 'date',
                    source: 'experience-search-bar' 
                });
            });
        }
        
        if (this.guestSection) {
            this.guestSection.addEventListener('click', () => {
                console.log('👥 Guest section clicked');
                this.showModal('guest');
                this.eventBus.emit(EventDefinitions.UI_EVENTS.MODAL_OPEN, { 
                    modalType: 'guest',
                    source: 'experience-search-bar' 
                });
            });
        }
        
        // Close modal when clicking on close button
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => {
                this.hideAllModals();
            });
        }
        
        // Close modal when clicking outside the modal content
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.hideAllModals();
            }
        });
        
        // Modal close buttons
        const closeButtons = document.querySelectorAll('.experience-modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.hideAllModals();
            });
        });
        
        // Date modal events
        if (this.dateModal) {
            // Date options click events
            const dateOptions = this.dateModal.querySelectorAll('.date-option');
            dateOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const dateType = e.currentTarget.dataset.date;
                    this.selectDateOption(dateType);
                });
            });
            
            // Save button
            const dateSaveBtn = document.getElementById('dateSaveBtn');
            if (dateSaveBtn) {
                dateSaveBtn.addEventListener('click', () => {
                    this.dateValue.textContent = this.selectedDate || 'Add dates';
                    if (this.selectedDate) {
                        this.dateValue.classList.add('has-value');
                    }
                    this.hideAllModals();
                });
            }
            
            // Clear button
            const dateClearBtn = document.getElementById('dateClearBtn');
            if (dateClearBtn) {
                dateClearBtn.addEventListener('click', () => {
                    this.selectedDate = '';
                    this.dateValue.textContent = 'Add dates';
                    this.dateValue.classList.remove('has-value');
                    this.hideAllModals();
                });
            }
        }
        
        // Guest modal events
        if (this.guestModal) {
            // Adult counter buttons
            const adultIncrease = document.getElementById('adultIncrease');
            const adultDecrease = document.getElementById('adultDecrease');
            
            if (adultIncrease) {
                adultIncrease.addEventListener('click', () => {
                    this.guests.adults++;
                    this.updateGuestCounter('adult');
                });
            }
            
            if (adultDecrease) {
                adultDecrease.addEventListener('click', () => {
                    if (this.guests.adults > 0) {
                        this.guests.adults--;
                        this.updateGuestCounter('adult');
                    }
                });
            }
            
            // Child counter buttons
            const childIncrease = document.getElementById('childIncrease');
            const childDecrease = document.getElementById('childDecrease');
            
            if (childIncrease) {
                childIncrease.addEventListener('click', () => {
                    this.guests.children++;
                    this.updateGuestCounter('child');
                });
            }
            
            if (childDecrease) {
                childDecrease.addEventListener('click', () => {
                    if (this.guests.children > 0) {
                        this.guests.children--;
                        this.updateGuestCounter('child');
                    }
                });
            }
            
            // Save button
            const guestSaveBtn = document.getElementById('guestSaveBtn');
            if (guestSaveBtn) {
                guestSaveBtn.addEventListener('click', () => {
                    this.updateGuestDisplay();
                    this.hideAllModals();
                });
            }
        }
        
        // Clicking outside to close modals
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) {
                    this.hideAllModals();
                }
            });
        }
        
        console.log('✅ Experience search bar event listeners attached');
    }

    /**
     * Show a modal dialog
     * @param {string} modalType - The type of modal to show ('date' or 'guest')
     * @param {Object} modalData - Additional modal data
     */
    showModal(modalType, modalData = {}) {
        // Hide any other visible modals first
        this.hideAllModals();
        
        // Set current modal type
        this.currentModalType = modalType;
        
        // Configure the modal based on type
        if (modalType === 'date') {
            this.setupDateModal();
        } else if (modalType === 'guest') {
            this.setupGuestModal();
        } else {
            console.warn('Unknown modal type:', modalType);
            return;
        }
        
        // Show the modal
        if (this.modal) {
            this.modal.style.display = 'block';
            console.log('🔍 Showing modal:', modalType);
        } else {
            console.error('Modal element not found');
        }
    }

    /**
     * Setup the date modal content
     */
    setupDateModal() {
        // Set modal title
        if (this.modalTitle) {
            this.modalTitle.textContent = 'Select dates';
        }
        
        // Clear previous content
        if (this.modalBody) {
            // Get today's date for quick options
            const today = new Date();
            
            // Get tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            
            // Get weekend (next Saturday)
            const weekend = new Date();
            weekend.setDate(today.getDate() + (6 - today.getDay()));
            
            // Create HTML for compact date picker layout
            this.modalBody.innerHTML = `
              <div class="date-picker-container">
                <div class="date-quick-options">
                  <div class="quick-date-option" data-option="today">
                    <div class="quick-date-title">Today</div>
                    <div class="quick-date-subtitle">${this.formatDate(today)}</div>
                  </div>
                  <div class="quick-date-option" data-option="tomorrow">
                    <div class="quick-date-title">Tomorrow</div>
                    <div class="quick-date-subtitle">${this.formatDate(tomorrow)}</div>
                  </div>
                  <div class="quick-date-option" data-option="weekend">
                    <div class="quick-date-title">Weekend</div>
                    <div class="quick-date-subtitle">${this.formatDate(weekend)}</div>
                  </div>             
                </div>
                <div class="calendar-container">
                  <div class="calendar-header">
                    <button class="calendar-nav" id="prevMonth">‹</button>
                    <div class="calendar-month-year" id="monthYear">${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    <button class="calendar-nav" id="nextMonth">›</button>
                  </div>
                  <div id="datepickerContainer" class="flatpickr-container"></div>
                </div>
              </div>
            `;
            
            // Initialize flatpickr in the container
            const datepickerContainer = document.getElementById('datepickerContainer');
            if (window.flatpickr && datepickerContainer) {
                if (this.calendar) {
                    // Destroy previous instance if exists
                    this.calendar.destroy();
                }
                
                this.calendar = flatpickr(datepickerContainer, {
                    mode: "single",
                    dateFormat: "Y-m-d",
                    minDate: "today",
                    inline: true,
                    onChange: (selectedDates, dateStr) => {
                        if (selectedDates.length > 0) {
                            this.selectedDate = this.formatDate(selectedDates[0]);
                            console.log('Calendar date selected:', this.selectedDate);
                            
                            // Auto-close after selection with a small delay for better UX
                            setTimeout(() => {
                                if (this.dateValue) {
                                    this.dateValue.textContent = this.selectedDate;
                                    this.dateValue.classList.add('has-value');
                                    
                                    // Emit date selected event
                                    this.eventBus.emit(EventDefinitions.BOOKING_EVENTS.UPDATED, {
                                        date: this.selectedDate,
                                        source: 'experience-search-bar'
                                    });
                                }
                                this.hideAllModals();
                            }, 500);
                        }
                    }
                });
            } else {
                this.modalBody.innerHTML = '<p class="error-message">Date picker not available</p>';
            }
            
            // Add event listeners to quick date options
            const quickDateOptions = this.modalBody.querySelectorAll('.quick-date-option');
            quickDateOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const dateOption = option.dataset.option;
                    
                    // Remove selected class from all options
                    quickDateOptions.forEach(o => o.classList.remove('selected'));
                    
                    // Add selected class to clicked option
                    option.classList.add('selected');
                    
                    // Handle date selection based on option
                    this.selectDateOption(dateOption);
                    
                    // Auto-close after selection with a small delay for better UX
                    setTimeout(() => {
                        if (this.dateValue) {
                            this.dateValue.textContent = this.selectedDate;
                            this.dateValue.classList.add('has-value');
                            
                            // Emit date selected event
                            this.eventBus.emit(EventDefinitions.BOOKING_EVENTS.UPDATED, {
                                date: this.selectedDate,
                                source: 'experience-search-bar'
                            });
                        }
                        this.hideAllModals();
                    }, 300);
                });
            });
        }
        
        // Set confirm button action
        if (this.confirmBtn) {
            this.confirmBtn.textContent = 'Select Date';
            this.confirmBtn.onclick = () => {
                if (this.selectedDate && this.dateValue) {
                    this.dateValue.textContent = this.selectedDate;
                    this.dateValue.classList.add('has-value');
                    
                    // Emit date selected event
                    this.eventBus.emit(EventDefinitions.BOOKING_EVENTS.UPDATED, {
                        date: this.selectedDate,
                        source: 'experience-search-bar'
                    });
                } else if (this.dateValue) {
                    this.dateValue.textContent = 'Add dates';
                    this.dateValue.classList.remove('has-value');
                }
                this.hideAllModals();
            };
        }
    }
    
    /**
     * Setup the guest modal content
     */
    setupGuestModal() {
        // Set modal title
        if (this.modalTitle) {
            this.modalTitle.textContent = 'Add guests';
        }
        
        // Create guest counter HTML with compact design
        if (this.modalBody) {
            this.modalBody.innerHTML = `
              <div class="guest-counter-container">
                <div class="guest-type-row">
                  <div class="guest-type">
                    <h3>Adults</h3>
                    <p>Ages 13 or above</p>
                  </div>
                  <div class="guest-count-controls">
                    <button id="adultDecrease" class="count-btn decrease" ${this.guests.adults <= 0 ? 'disabled' : ''}>-</button>
                    <span id="adultCount" class="guest-count">${this.guests.adults}</span>
                    <button id="adultIncrease" class="count-btn increase">+</button>
                  </div>
                </div>
                <div class="guest-type-row">
                  <div class="guest-type">
                    <h3>Children</h3>
                    <p>Ages 2-12</p>
                  </div>
                  <div class="guest-count-controls">
                    <button id="childDecrease" class="count-btn decrease" ${this.guests.children <= 0 ? 'disabled' : ''}>-</button>
                    <span id="childCount" class="guest-count">${this.guests.children}</span>
                    <button id="childIncrease" class="count-btn increase">+</button>
                  </div>
                </div>
              </div>
            `;
            
            // Attach event listeners to the guest counter buttons
            const adultIncreaseBtn = document.getElementById('adultIncrease');
            if (adultIncreaseBtn) {
                adultIncreaseBtn.addEventListener('click', () => {
                    this.guests.adults++;
                    this.updateGuestCounter('adult');
                });
            }
            
            const adultDecreaseBtn = document.getElementById('adultDecrease');
            if (adultDecreaseBtn) {
                adultDecreaseBtn.addEventListener('click', () => {
                    if (this.guests.adults > 0) {
                        this.guests.adults--;
                        this.updateGuestCounter('adult');
                    }
                });
            }
            
            const childIncreaseBtn = document.getElementById('childIncrease');
            if (childIncreaseBtn) {
                childIncreaseBtn.addEventListener('click', () => {
                    this.guests.children++;
                    this.updateGuestCounter('child');
                });
            }
            
            const childDecreaseBtn = document.getElementById('childDecrease');
            if (childDecreaseBtn) {
                childDecreaseBtn.addEventListener('click', () => {
                    if (this.guests.children > 0) {
                        this.guests.children--;
                        this.updateGuestCounter('child');
                    }
                });
            }
        }
        
        // Set confirm button action
        if (this.confirmBtn) {
            this.confirmBtn.textContent = 'Save';
            this.confirmBtn.onclick = () => {
                this.updateGuestDisplay();
                
                // Emit guest updated event
                this.eventBus.emit(EventDefinitions.BOOKING_EVENTS.UPDATED, {
                    guests: this.guests,
                    source: 'experience-search-bar'
                });
                
                this.hideAllModals();
            };
        }
    }
    
    /**
     * Hide all modals
     */
    hideAllModals() {
        // Hide the new unified modal
        if (this.modal) {
            this.modal.style.display = 'none';
            this.currentModalType = null;
        }
        
        // For backward compatibility, also hide old modals
        if (this.modalOverlay) {
            this.modalOverlay.classList.remove('visible');
        }
        
        // Hide all legacy modals
        const modals = document.querySelectorAll('.experience-modal');
        modals.forEach(modal => {
            modal.classList.remove('visible');
        });
        
        // Emit modal closed event
        this.eventBus.emit(EventDefinitions.UI_EVENTS.MODAL_CLOSE, { 
            source: 'experience-search-bar' 
        });
        
        console.log('🔍 All modals hidden');
    }
    
    /**
     * Update the guest counter
     * @param {string} type - The type of guest (adult, child, infant)
     */
    updateGuestCounter(type) {
        const countElement = document.getElementById(`${type}Count`);
        const decrementButton = document.getElementById(`${type}Decrease`);
        
        if (countElement) {
            countElement.textContent = this.guests[type + 's']; // Add 's' to match the property name
        }
        
        if (decrementButton) {
            decrementButton.disabled = this.guests[type + 's'] <= 0;
        }
        
        // Also update the guest display
        this.updateGuestDisplay();
    }
    
    /**
     * Update the guest display
     */
    updateGuestDisplay() {
        if (!this.guestValue) return;
        
        const totalGuests = this.guests.adults + this.guests.children;
        
        if (totalGuests === 0) {
            this.guestValue.textContent = 'Add guests';
            this.guestValue.classList.remove('has-value');
        } else {
            let displayText = totalGuests === 1 ? '1 guest' : `${totalGuests} guests`;
            this.guestValue.textContent = displayText;
            this.guestValue.classList.add('has-value');
        }
    }
    
    /**
     * Select a date option
     * @param {string} dateType - The type of date option (today, tomorrow, weekend, etc.)
     */
    selectDateOption(dateType) {
        let selectedDate = '';
        
        const today = new Date();
        
        switch(dateType) {
            case 'today':
                selectedDate = this.formatDate(today);
                break;
            case 'tomorrow':
                const tomorrow = new Date();
                tomorrow.setDate(today.getDate() + 1);
                selectedDate = this.formatDate(tomorrow);
                break;
            case 'weekend':
                const thisWeekend = new Date();
                // Find next Saturday
                thisWeekend.setDate(today.getDate() + (6 - today.getDay()));
                selectedDate = this.formatDate(thisWeekend);
                break;
            case 'nextWeek':
                const nextWeek = new Date();
                nextWeek.setDate(today.getDate() + 7);
                selectedDate = this.formatDate(nextWeek);
                break;
            case 'nextMonth':
                const nextMonth = new Date();
                nextMonth.setMonth(today.getMonth() + 1);
                selectedDate = this.formatDate(nextMonth);
                break;
            case 'flexible':
                // Just open the calendar without setting a date
                break;
        }
        
        if (selectedDate) {
            this.selectedDate = selectedDate;
            console.log('📅 Selected date option:', dateType, selectedDate);
        }
    }
    
    /**
     * Format a date for display
     * @param {Date} date - The date to format
     * @returns {string} - The formatted date string
     */
    formatDate(date) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    /**
     * Handle component errors
     * @param {Error} error - The error that occurred
     * @override
     */
    onError(error) {
        console.error('ExperienceSearchBar Error:', error);
        this.eventBus.emit(EventDefinitions.ERROR_EVENTS.COMPONENT_ERROR, {
            componentId: this.componentId,
            error: error.message || 'Experience Search Bar error',
            stack: error.stack,
            timestamp: new Date()
        });
    }
    
    /**
     * Clean up the component
     * @override
     */
    async destroy() {
        console.log('🧹 Cleaning up Experience Search Bar component');
        
        // Clean up flatpickr instance if exists
        if (this.calendar) {
            this.calendar.destroy();
            this.calendar = null;
        }
        
        // Call the parent's destroy method
        await super.destroy();
        
        return true;
    }
}

export default ExperienceSearchBar;
