/**
 * YachtsSearchBar.js - Modular component for Miami Concierge
 * 
 * This component provides search functionality for yacht bookings, including:
 * - Date picker (with calendar integration)
 * - Guest selector
 * - Modal management
 * - Integration with the event bus system
 */

import EventDefinitions from '../../core/EventDefinitions.js';

/**
 * YachtsSearchBar component class
 */
class YachtsSearchBar {
    /**
     * Create a new YachtsSearchBar instance
     * @param {string} containerId - The ID of the container element
     * @param {Object} eventBus - The event bus instance
     * @param {Object} config - Configuration options
     */
    constructor(containerId, eventBus, config = {}) {
        this.containerId = containerId || 'yachtsSearchContainer';
        this.eventBus = eventBus;
        this.config = {
            dateFormat: config.dateFormat || 'M d, Y',
            defaultAdults: config.defaultAdults || 2,
            defaultChildren: config.defaultChildren || 0,
            defaultInfants: config.defaultInfants || 0
        };
        
        // State variables
        this.currentModalType = null;
        this.selectedDate = null;
        this.guestCounts = {
            adults: this.config.defaultAdults,
            children: this.config.defaultChildren,
            infants: this.config.defaultInfants
        };
        
        // Month names for calendar
        this.monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Day names for calendar
        this.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    }
    
    initialize() {
        console.log('🛥️ Initializing Yachts Search Bar');
        this.initializeElements();
        this.bindEvents();
        
        // Emit initialization event
        if (this.eventBus) {
            this.eventBus.emit('yachts:initialized', {
                componentId: this.containerId,
                timestamp: Date.now()
            });
        }
    }
    
    initializeElements() {
        // Get container element
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Container with ID "${this.containerId}" not found.`);
            return;
        }
        
        // Get date and guest sections
        this.dateSection = document.getElementById('yachtsDateSection');
        this.guestSection = document.getElementById('yachtsGuestSection');
        
        // Get display value elements
        this.dateValue = document.getElementById('yachtsDateValue');
        this.guestValue = document.getElementById('yachtsGuestValue');
        
        // Get search button
        this.searchButton = document.getElementById('yachtsSearchButton');
        
        // Get modal elements
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.closeModalBtn = document.getElementById('closeModal');
        this.confirmBtn = document.getElementById('confirmSelection');
    }
    
    bindEvents() {
        if (!this.container) return;
        
        // Date section click handler
        if (this.dateSection) {
            this.dateSection.addEventListener('click', () => {
                console.log('Yacht date section clicked');
                this.showModal('date');
            });
        }
        
        // Guest section click handler
        if (this.guestSection) {
            this.guestSection.addEventListener('click', () => {
                console.log('Yacht guest section clicked');
                this.showModal('guest');
            });
        }
        
        // Search button click handler
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => {
                this.handleSearch();
            });
        }
        
        // Confirm button click handler
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => {
                this.handleConfirm();
            });
        }
    }
    
    showModal(type) {
        if (!this.modal) return;
        
        this.currentModalType = type;
        
        if (type === 'date') {
            this.modalTitle.textContent = 'Select yacht charter date';
            this.renderCalendar();
        } else if (type === 'guest') {
            this.modalTitle.textContent = 'Select number of guests';
            this.renderGuestSelector();
        }
        
        this.modal.style.display = 'block';
        
        // Emit modal opened event
        if (this.eventBus) {
            this.eventBus.emit('modal:opened', {
                modalType: type,
                componentId: this.containerId,
                timestamp: Date.now()
            });
        }
    }
    
    renderCalendar() {
        if (!this.modalBody) return;
        
        const today = new Date();
        const currentMonth = this.currentMonth !== undefined ? this.currentMonth : today.getMonth();
        const currentYear = this.currentYear !== undefined ? this.currentYear : today.getFullYear();
        
        // Store current month and year
        this.currentMonth = currentMonth;
        this.currentYear = currentYear;
        
        // Create calendar container
        const calendarHTML = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="calendar-nav prev-month">&lt;</button>
                    <div class="current-month-year">${this.monthNames[currentMonth]} ${currentYear}</div>
                    <button class="calendar-nav next-month">&gt;</button>
                </div>
                <div class="calendar-days">
                    ${this.dayNames.map(day => `<div class="calendar-day-name">${day}</div>`).join('')}
                </div>
                <div class="calendar-grid">
                    ${this.generateCalendarDays(currentMonth, currentYear)}
                </div>
            </div>
        `;
        
        this.modalBody.innerHTML = calendarHTML;
        
        // Add event listeners for month navigation
        const prevMonthBtn = this.modalBody.querySelector('.prev-month');
        const nextMonthBtn = this.modalBody.querySelector('.next-month');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', (e) => {
                this.changeMonth(-1);
                e.stopPropagation();
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', (e) => {
                this.changeMonth(1);
                e.stopPropagation();
            });
        }
        
        // Add event listeners for day selection
        const dayElements = this.modalBody.querySelectorAll('.calendar-day:not(.disabled):not(.empty)');
        dayElements.forEach(day => {
            day.addEventListener('click', () => {
                this.handleDateSelection(day);
            });
        });
    }
    
    generateCalendarDays(month, year) {
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Create array for calendar days
        let calendarDays = [];
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push('<div class="calendar-day empty"></div>');
        }
        
        // Add days of month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isPast = date < today;
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
            
            let classes = ['calendar-day'];
            if (isPast) classes.push('disabled');
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            
            calendarDays.push(`
                <div class="${classes.join(' ')}" data-date="${year}-${month + 1}-${day}">
                    ${day}
                </div>
            `);
        }
        
        return calendarDays.join('');
    }
    
    changeMonth(delta) {
        let newMonth = this.currentMonth + delta;
        let newYear = this.currentYear;
        
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        
        this.currentMonth = newMonth;
        this.currentYear = newYear;
        
        this.renderCalendar();
    }
    
    handleDateSelection(dateElement) {
        if (!dateElement) return;
        
        // Remove selected class from all dates
        const selectedDates = this.modalBody.querySelectorAll('.calendar-day.selected');
        selectedDates.forEach(date => date.classList.remove('selected'));
        
        // Add selected class to clicked date
        dateElement.classList.add('selected');
        
        // Parse selected date
        const dateStr = dateElement.dataset.date;
        if (dateStr) {
            const [year, month, day] = dateStr.split('-').map(Number);
            this.selectedDate = new Date(year, month - 1, day);
            
            // Update date display value
            this.dateValue.textContent = this.formatDate(this.selectedDate);
            this.dateValue.classList.add('has-value');
        }
    }
    
    formatDate(date) {
        if (!date) return 'Add dates';
        
        const day = date.getDate();
        const month = this.monthNames[date.getMonth()].substring(0, 3);
        const year = date.getFullYear();
        
        return `${month} ${day}, ${year}`;
    }
    
    renderGuestSelector() {
        if (!this.modalBody) return;
        
        const guestSelectorHTML = `
            <div class="guest-selector">
                <div class="guest-controls">
                    <div class="guest-info">
                        <div class="guest-type">Adults</div>
                        <div class="guest-description">Ages 13+</div>
                    </div>
                    <div class="guest-counter-controls">
                        <button class="counter-button" id="adultsDecrease" ${this.guestCounts.adults <= 1 ? 'disabled' : ''}>-</button>
                        <span class="counter-value" id="adultsCount">${this.guestCounts.adults}</span>
                        <button class="counter-button" id="adultsIncrease">+</button>
                    </div>
                </div>
                
                <div class="guest-controls">
                    <div class="guest-info">
                        <div class="guest-type">Children</div>
                        <div class="guest-description">Ages 2-12</div>
                    </div>
                    <div class="guest-counter-controls">
                        <button class="counter-button" id="childrenDecrease" ${this.guestCounts.children <= 0 ? 'disabled' : ''}>-</button>
                        <span class="counter-value" id="childrenCount">${this.guestCounts.children}</span>
                        <button class="counter-button" id="childrenIncrease">+</button>
                    </div>
                </div>
                
                <div class="guest-controls">
                    <div class="guest-info">
                        <div class="guest-type">Infants</div>
                        <div class="guest-description">Under 2</div>
                    </div>
                    <div class="guest-counter-controls">
                        <button class="counter-button" id="infantsDecrease" ${this.guestCounts.infants <= 0 ? 'disabled' : ''}>-</button>
                        <span class="counter-value" id="infantsCount">${this.guestCounts.infants}</span>
                        <button class="counter-button" id="infantsIncrease">+</button>
                    </div>
                </div>
            </div>
        `;
        
        this.modalBody.innerHTML = guestSelectorHTML;
        
        // Add event listeners for guest counter buttons
        this.modalBody.querySelector('#adultsDecrease').addEventListener('click', () => this.changeGuestCount('adults', -1));
        this.modalBody.querySelector('#adultsIncrease').addEventListener('click', () => this.changeGuestCount('adults', 1));
        this.modalBody.querySelector('#childrenDecrease').addEventListener('click', () => this.changeGuestCount('children', -1));
        this.modalBody.querySelector('#childrenIncrease').addEventListener('click', () => this.changeGuestCount('children', 1));
        this.modalBody.querySelector('#infantsDecrease').addEventListener('click', () => this.changeGuestCount('infants', -1));
        this.modalBody.querySelector('#infantsIncrease').addEventListener('click', () => this.changeGuestCount('infants', 1));
    }
    
    changeGuestCount(type, delta) {
        if (!type || !this.guestCounts.hasOwnProperty(type)) return;
        
        let newCount = this.guestCounts[type] + delta;
        
        // Apply limits based on guest type
        if (type === 'adults') {
            newCount = Math.max(1, newCount); // Minimum 1 adult
        } else {
            newCount = Math.max(0, newCount); // Minimum 0 for children and infants
        }
        
        // Maximum is 16 total guests
        const totalGuests = Object.entries(this.guestCounts)
            .reduce((sum, [key, val]) => key !== type ? sum + val : sum, 0) + newCount;
        
        if (totalGuests <= 16) {
            this.guestCounts[type] = newCount;
        }
        
        // Update the counter in the UI
        const countElement = this.modalBody.querySelector(`#${type}Count`);
        if (countElement) {
            countElement.textContent = this.guestCounts[type];
        }
        
        // Enable/disable decrease buttons
        const decreaseBtn = this.modalBody.querySelector(`#${type}Decrease`);
        if (decreaseBtn) {
            const minValue = type === 'adults' ? 1 : 0;
            const isDisabled = this.guestCounts[type] <= minValue;
            decreaseBtn.disabled = isDisabled;
        }
    }
    
    getGuestsDisplayText() {
        const totalGuests = this.guestCounts.adults + this.guestCounts.children;
        let text = `${totalGuests} ${totalGuests === 1 ? 'guest' : 'guests'}`;
        
        if (this.guestCounts.infants > 0) {
            text += `, ${this.guestCounts.infants} ${this.guestCounts.infants === 1 ? 'infant' : 'infants'}`;
        }
        
        return text;
    }
    
    handleConfirm() {
        if (this.currentModalType === 'date') {
            if (this.selectedDate && this.dateValue) {
                this.dateValue.textContent = this.formatDate(this.selectedDate);
                this.dateValue.classList.add('has-value');
                
                if (this.eventBus) {
                    this.eventBus.emit('yachts:date:selected', {
                        date: this.selectedDate,
                        formattedDate: this.formatDate(this.selectedDate)
                    });
                }
            }
        } else if (this.currentModalType === 'guest') {
            if (this.guestValue) {
                const guestsText = this.getGuestsDisplayText();
                this.guestValue.textContent = guestsText;
                this.guestValue.classList.add('has-value');
                
                if (this.eventBus) {
                    this.eventBus.emit('yachts:guests:selected', {
                        guests: { ...this.guestCounts },
                        displayText: guestsText
                    });
                }
            }
        }
        
        // Close modal
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }
    
    handleSearch() {
        // Validate search inputs
        let hasDate = this.selectedDate !== null;
        let hasGuests = this.guestCounts.adults > 0;
        
        if (!hasDate) {
            this.showModal('date');
            return;
        }
        
        if (!hasGuests) {
            this.showModal('guest');
            return;
        }
        
        // Get location value
        const locationInput = document.getElementById('from-location-yachts');
        const location = locationInput ? locationInput.value : '';
        
        console.log('Yacht search submitted with:', {
            date: this.selectedDate,
            guests: this.guestCounts,
            location
        });
        
        // Emit search event
        if (this.eventBus) {
            this.eventBus.emit('yachts:search', {
                date: this.selectedDate,
                guests: { ...this.guestCounts },
                location
            });
        }
    }
}

export default YachtsSearchBar;