/**
 * BEM utility functions for managing component states
 * @module bem-utils
 */

/**
 * Updates the visual state of an element using BEM conventions
 * @param {HTMLElement} element - The element to update
 * @param {string} state - The state to apply ('error', 'success', 'disabled', etc.)
 * @param {boolean} active - Whether to add or remove the state
 * @returns {boolean} Whether the operation was successful
 */
export function updateElementState(element, state, active) {
  if (!element) {
    console.warn('Element not found when trying to update state:', state);
    return false;
  }
  
  try {
    // Get the base class from the element's first class
    const classList = Array.from(element.classList);
    const baseClass = classList.find(cls => !cls.includes('--'));
    
    if (!baseClass) {
      console.warn('No base BEM class found on element:', element);
      return false;
    }
    
    // Construct the modifier class following BEM conventions
    const stateClass = `${baseClass}--${state}`;
    
    // Update the element's classes
    if (active) {
      element.classList.add(stateClass);
      // Also add a data attribute for potential styling/selection
      element.setAttribute(`data-state-${state}`, '');
    } else {
      element.classList.remove(stateClass);
      element.removeAttribute(`data-state-${state}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating element state:', error);
    return false;
  }
}

/**
 * Toggles the visibility of a component or element
 * @param {HTMLElement} element - The element to toggle visibility
 * @param {boolean} visible - Whether the element should be visible
 * @returns {boolean} Whether the operation was successful
 */
export function toggleVisibility(element, visible) {
  return updateElementState(element, 'hidden', !visible);
}

/**
 * Sets an element to active state in a group
 * @param {HTMLElement} element - The element to activate
 * @param {NodeList|Array} group - Group of elements to deactivate
 * @returns {boolean} Whether the operation was successful
 */
export function setActiveInGroup(element, group) {
  if (!element || !group || !group.length) {
    console.warn('Invalid element or group provided to setActiveInGroup');
    return false;
  }
  
  try {
    // Deactivate all elements in the group
    group.forEach(el => {
      if (el !== element) {
        updateElementState(el, 'active', false);
      }
    });
    
    // Activate the selected element
    updateElementState(element, 'active', true);
    return true;
  } catch (error) {
    console.error('Error setting active element in group:', error);
    return false;
  }
}