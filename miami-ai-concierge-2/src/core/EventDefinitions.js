export const EVENTS = {
  ERROR: {
    SHOW: 'error:show',
    CLEAR: 'error:clear',
    CLEAR_ALL: 'error:clear-all',
    GLOBAL: 'error:global',
    GLOBAL_CLEAR: 'error:global-clear',
    SHOWN_CONFIRMED: 'error:shown:confirmed',
    CLEARED_CONFIRMED: 'error:cleared:confirmed',
    COMPONENT_ERROR: 'error:component'
  },
  FORM: {
    SUBMIT: 'form:submit',
    SUBMISSION_STARTED: 'form:submission:started',
    SUBMISSION_SUCCEEDED: 'form:submission:succeeded',
    SUBMISSION_FAILED: 'form:submission:failed',
    FIELD_CHANGED: 'form:field:changed',
    FIELD_VALIDATED: 'form:field:validated',
    FIELD_VALIDATION_SUCCESS: 'form:field:validation-success',
    FIELD_VALIDATION_FAILURE: 'form:field:validation-failure',
    VALIDATION_REQUESTED: 'form:validation-requested',
    VALIDATION_CHANGED: 'form:validation:changed',
    VALIDATED: 'form:validated',
    LOADING_STARTED: 'form:loading:started',
    LOADING_ENDED: 'form:loading:ended',
    DATA_PROCESSED: 'form:data:processed'
  },
  MAP: {
    AUTOCOMPLETE_INITIALIZED: 'map:autocomplete:initialized',
    PLACES_SUGGESTIONS: 'map:places:suggestions',
    LOCATION_SELECTED: 'map:location:selected',
    CURRENT_LOCATION_REQUESTED: 'map:current-location:requested',
    CURRENT_LOCATION_SUCCESS: 'map:current-location:success',
    CURRENT_LOCATION_FAILED: 'map:current-location:failed',
    GEOCODING_STARTED: 'map:geocoding:started',
    GEOCODING_COMPLETED: 'map:geocoding:completed'
  },
  ANALYTICS: {
    TRACK: 'analytics:track',
    PAGE_VIEW: 'analytics:page-view',
    FORM_SUBMITTED: 'analytics:form-submitted',
    LOCATION_SELECTED: 'analytics:location-selected',
    ERROR_TRACKED: 'analytics:error-tracked',
    USER_INTERACTION: 'analytics:user-interaction'
  },
  LOCATION: {
    VALIDATION_REQUIRED: 'location:validation-required',
    VALIDATION_SUCCESS: 'location:validation-success',
    VALIDATION_FAILURE: 'location:validation-failure',
    AUTOCOMPLETE_SEARCH: 'location:autocomplete:search',
    FIELD_UPDATED: 'location:field:updated'
  },
  UI: {
    LOADING_SHOW: 'ui:loading:show',
    LOADING_HIDE: 'ui:loading:hide',
    MODAL_OPEN: 'ui:modal:open',
    MODAL_CLOSE: 'ui:modal:close',
    TAB_CHANGED: 'ui:tab:changed',
    FIELD_STYLED: 'ui:field:styled',
    ERROR_SHOWN: 'ui:error:shown'
  },
  SYSTEM: {
    INITIALIZED: 'system:initialized',
    READY: 'system:ready',
    COMPONENT_REGISTERED: 'system:component:registered',
    COMPONENT_INITIALIZED: 'system:component:initialized',
    COMPONENT_DESTROYED: 'system:component:destroyed',
    COMPONENT_RECOVERED: 'system:component:recovered',
    COMPONENTS_INITIALIZED: 'system:components:initialized',
    COMPONENTS_DESTROYED: 'system:components:destroyed',
    ERROR: 'system:error',
    DEBUG_ENABLED: 'system:debug:enabled',
    DEBUG_DISABLED: 'system:debug:disabled'
  }
};