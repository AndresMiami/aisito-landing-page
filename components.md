# BEM Components Inventory

## booking-form
- **Purpose**: Main container for all booking functionality
- **Elements**: 
  - `__group`: Container for input + label + error
  - `__label`: Form field label
  - `__input`: Input element
  - `__error`: Error message
  - `__button`: Form button
  - `__scheduled`: Container for scheduled booking inputs
  - `__actions`: Container for form action buttons
  - `__confirmation`: Success message after form submission
- **Modifiers**:
  - `__input--date`: Date input styling
  - `__input--error`: Input with validation error
  - `__button--selected`: Selected button state
  - `__scheduled--hidden`: Hidden scheduled inputs
  - `__confirmation--hidden`: Hidden confirmation message

## tab-navigation
- **Purpose**: Switches between form sections
- **Elements**:
  - `__container`: Container for tab buttons
  - `__button`: Tab button
  - `__panel`: Content panel associated with a tab
- **Modifiers**:
  - `__button--active`: Active tab state
  - `__button--inactive`: Inactive tab state
  - `__panel--hidden`: Hidden panel state

## vehicle-selector
- **Purpose**: Allows selection of vehicle type
- **Elements**:
  - `__heading`: Section heading
  - `__card`: Vehicle option card
  - `__image-container`: Vehicle image wrapper
  - `__image`: Vehicle image
  - `__details`: Container for vehicle details
  - `__title`: Vehicle title
  - `__specs`: Container for vehicle specifications
  - `__spec`: Individual specification item
  - `__icon`: Icon within spec item
  - `__spec-value`: Numerical value in spec
  - `__model`: Vehicle model example
  - `__badges`: Container for feature badges
  - `__badge`: Feature badge
  - `__radio`: Hidden radio input for selection
- **Modifiers**:
  - `--visible`: Visible state for container
  - `__card--selected`: Selected card state
  - `__badge--blue`: Blue variant of badge

## experience-options
- **Purpose**: Experience-specific form fields and options
- **Elements**:
  - `__container`: Container for specific experience type
  - `__dropdown`: Experience selection dropdown
  - `__description`: Experience description
  - `__preferences`: Timing preferences container
  - `__preference`: Individual preference option
  - `__contact`: Contact information container
- **Modifiers**:
  - `__container--hidden`: Hidden container state
  - `__dropdown--error`: Dropdown with error