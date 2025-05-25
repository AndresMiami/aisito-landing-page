/**
 * UIEvents.js - Standardized UI interaction event definitions
 */

export const UI_EVENTS = {
  // Tab navigation events
  TAB_CHANGED: 'ui:tab:changed',
  TAB_CONTENT_SHOWN: 'ui:tab:content:shown',
  TAB_CONTENT_HIDDEN: 'ui:tab:content:hidden',
  
  // Modal events
  MODAL_OPENED: 'ui:modal:opened',
  MODAL_CLOSED: 'ui:modal:closed',
  
  // Button events
  BUTTON_CLICKED: 'ui:button:clicked',
  BUTTON_STATE_CHANGED: 'ui:button:state-changed',
  
  // Loading states
  LOADING_STARTED: 'ui:loading:started',
  LOADING_COMPLETED: 'ui:loading:completed',
  
  // Toast/notification events
  TOAST_SHOWN: 'ui:toast:shown',
  TOAST_DISMISSED: 'ui:toast:dismissed'
};

export function createTabChangeObject(fromTab, toTab, source = 'user-click') {
  return {
    fromTab,
    toTab,
    source,
    timestamp: Date.now()
  };
}

export function createButtonStateObject(buttonId, state, disabled = false) {
  return {
    buttonId,
    state,
    disabled,
    timestamp: Date.now()
  };
}

export default {
  UI_EVENTS,
  createTabChangeObject,
  createButtonStateObject
};