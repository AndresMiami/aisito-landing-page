/**
 * Booking Timing Bar Component
 * 
 * This component handles the "Request Now or Book Later" search bar
 * functionality for the One Way tab in the dashboard, matching the
 * style and functionality of the Experience tab search bar.
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the component with a slight delay to ensure all elements are rendered
    setTimeout(initBookingTimingBar, 100);
});

// Main initialization function
function initBookingTimingBar() {
    // Get references to the elements
    const bookingTimingContainer = document.getElementById('bookingTimingContainer');
    const requestNowSection = document.getElementById('requestNowSection');
    const bookLaterSection = document.getElementById('bookLaterSection');
    const confirmTimingButton = document.getElementById('confirmTimingButton');
    const bookingPreferenceInput = document.getElementById('booking-preference');
    const scheduledInputsContainer = document.getElementById('scheduled-booking-inputs');
    
    // If container doesn't exist, exit early
    if (!bookingTimingContainer) {
        console.warn('Booking timing container not found.');
        return;
    }
    
    // State variable
    let currentTiming = 'now'; // Default to "Request Now"
    
    // Set up event listeners
    if (requestNowSection) {
        requestNowSection.addEventListener('click', function() {
            selectTiming('now');
        });
    }
    
    if (bookLaterSection) {
        bookLaterSection.addEventListener('click', function() {
            selectTiming('later');
        });
    }
    
    if (confirmTimingButton) {
        confirmTimingButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent form submission
            confirmTiming();
        });
    }
    
    // Select timing function
    function selectTiming(timing) {
        currentTiming = timing;
        
        // Update UI
        requestNowSection.classList.remove('selected');
        bookLaterSection.classList.remove('selected');
        document.getElementById('requestNowValue').classList.remove('has-value');
        document.getElementById('bookLaterValue').classList.remove('has-value');
        
        if (timing === 'now') {
            requestNowSection.classList.add('selected');
            document.getElementById('requestNowValue').classList.add('has-value');
            
            if (bookingPreferenceInput) bookingPreferenceInput.value = 'now';
            if (scheduledInputsContainer) scheduledInputsContainer.classList.add('hidden');
            
            // Update form state if available
            if (window.formState && window.formState.oneway) {
                window.formState.oneway.bookingTime = true;
            }
            
            console.log('📅 Request Now selected');
        } else {
            bookLaterSection.classList.add('selected');
            document.getElementById('bookLaterValue').classList.add('has-value');
            
            if (bookingPreferenceInput) bookingPreferenceInput.value = 'later';
            showScheduledInputs();
            
            // Update form state if available
            if (window.formState && window.formState.oneway) {
                window.formState.oneway.bookingTime = false;
            }
            
            console.log('📅 Book for Later selected');
        }
        
        // Emit event if event bus is available
        if (window.eventBus) {
            window.eventBus.emit('form:booking-preference-changed', {
                preference: timing,
                tab: 'oneway'
            });
        }
        
        // Check form validity if the function exists
        if (typeof checkFormValidity === 'function') {
            checkFormValidity();
        }
    }
    
    // Show scheduled inputs with animation
    function showScheduledInputs() {
        if (scheduledInputsContainer && scheduledInputsContainer.classList.contains('hidden')) {
            setTimeout(() => {
                scheduledInputsContainer.classList.remove('hidden');
                
                // Trigger the shimmer animation after a small delay
                setTimeout(() => {
                    if (scheduledInputsContainer.offsetWidth) { // Force reflow
                        scheduledInputsContainer.style.transition = 'box-shadow 0.3s ease';
                        scheduledInputsContainer.style.boxShadow = '0 0 0 2px rgba(34, 34, 34, 0.2)';
                        setTimeout(() => {
                            scheduledInputsContainer.style.boxShadow = '';
                        }, 800);
                    }
                }, 100);
            }, 10);
        }
    }
    
    // Confirm timing function
    function confirmTiming() {
        console.log('Booking timing confirmed:', currentTiming);
        
        // Flash the container to show confirmation
        bookingTimingContainer.style.transition = 'box-shadow 0.3s ease';
        bookingTimingContainer.style.boxShadow = '0 0 0 2px rgba(255, 56, 92, 0.4)';
        setTimeout(() => {
            bookingTimingContainer.style.boxShadow = '';
        }, 800);
        
        // If "Book for Later" is selected, focus on the date field
        if (currentTiming === 'later') {
            const dateInput = document.getElementById('pickup-date-oneway');
            if (dateInput && !dateInput.value) {
                setTimeout(() => {
                    dateInput.focus();
                }, 300);
            }
        }
        
        // Trigger form validation
        if (typeof checkFormValidity === 'function') {
            checkFormValidity();
        }
    }
    
    // Initialize with default state
    selectTiming('now');
}
