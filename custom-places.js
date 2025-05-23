// Mobile-specific adjustments for Google Maps components

document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on mobile
  const isMobile = window.innerWidth <= 640;
  
  if (isMobile) {
    // Adjust behavior for Google Place Autocomplete on mobile
    const placeElements = document.querySelectorAll('gmp-place-autocomplete');
    
    placeElements.forEach(element => {
      // Improve scrolling behavior when keyboard appears
      element.addEventListener('focus', function() {
        // Scroll the element into view when focused
        setTimeout(() => {
          this.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300); // Short delay to allow keyboard to appear
      });
      
      // Optimize clear button behavior for touch
      const container = element.closest('.google-maps-container');
      if (!container) return;
      
      const clearBtn = container.querySelector('.location-clear-btn');
      if (clearBtn) {
        // Make clear button larger and more visible when field has content
        element.addEventListener('input', function() {
          if (this.value && this.value.trim() !== '') {
            clearBtn.style.display = 'flex';
          } else {
            clearBtn.style.display = 'none';
          }
        });
      }
    });
    
    // Improve Current Location button behavior on mobile
    const getLocationBtn = document.getElementById('get-location-button');
    if (getLocationBtn) {
      // Make the button more prominent on mobile
      getLocationBtn.classList.add('mobile-location-btn');
      
      // Provide visual feedback when tapped
      getLocationBtn.addEventListener('touchstart', function() {
        this.classList.add('active');
      });
      
      getLocationBtn.addEventListener('touchend', function() {
        this.classList.remove('active');
        // Wait a moment before removing the active state
        setTimeout(() => {
          this.classList.remove('active');
        }, 150);
      });
    }

    // Fix for the form scrolling when software keyboard appears
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
      input.addEventListener('focus', function() {
        // Add extra padding to bottom of form to ensure content stays visible
        document.querySelector('.booking-form-container').style.paddingBottom = '350px';
      });
      
      input.addEventListener('blur', function() {
        // Reset padding after keyboard closes
        setTimeout(() => {
          document.querySelector('.booking-form-container').style.paddingBottom = '100px';
        }, 300);
      });
    });
  }
  
  // Handle orientation changes
  window.addEventListener('orientationchange', function() {
    // Brief timeout to allow the browser to adjust
    setTimeout(() => {
      // Get the active input element if any
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT' || activeElement.tagName === 'TEXTAREA')) {
        // Scroll it into view
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
  });

  // Add a class to body when on mobile for potential global styling
  if (isMobile) {
    document.body.classList.add('is-mobile-device');
  }
});