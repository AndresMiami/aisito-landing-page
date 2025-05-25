# 🏖️ Miami Concierge - AI-Powered Luxury Transportation Booking

A sophisticated booking system for luxury transportation services in Miami, featuring intelligent Google Places integration and seamless user experience.

## ✨ Features

- **Smart Location Detection**: Advanced Google Places autocomplete with Shadow DOM handling
- **Real-time Validation**: Instant form validation with visual feedback
- **Vehicle Selection**: Automatic display of available vehicles based on route
- **Responsive Design**: Mobile-first approach with glassmorphism UI
- **Event-Driven Architecture**: Modular components with EventBus communication

## 🚀 Recent Achievements

- ✅ Solved Google Places Shadow DOM validation challenges
- ✅ Implemented automatic vehicle selection display
- ✅ Added real-time form state synchronization
- ✅ Created modular component architecture
- ✅ Integrated EventBus for error handling

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Styling**: Tailwind CSS, Custom Glassmorphism
- **APIs**: Google Places API, Google Maps API
- **Architecture**: EventBus pattern, BEM methodology
- **Build Tools**: Node.js, NPM

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/miami-concierge-ai.git

# Navigate to project
cd miami-concierge-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎯 Usage

1. Open `dashboard.html` in your browser
2. Fill in pickup and destination locations
3. Select booking time preference
4. Choose from automatically displayed vehicle options
5. Complete booking with passenger details

## 🏗️ Architecture

- `/src/components/` - Reusable UI components
- `/src/core/` - Core services (EventBus, DOMManager)
- `/src/events/` - Event definitions and handling
- `/src/utils/` - Utility functions for logging and validation
- `/src/tests/` - Unit and integration tests
- `/css/components/` - BEM-structured stylesheets
- `/js/` - Legacy JavaScript files

## 🔄 EventBus Integration

This project uses an event-driven architecture for component communication:

### Error Handling Events

- `error:show` - Display field-specific errors
- `error:clear` - Clear specific field errors  
- `error:clear-all` - Clear all errors
- `error:global` - Show application-wide notifications

### Usage Example

```javascript
// Show an error
eventBus.emit('error:show', {
  fieldId: 'from-location',
  message: 'Location is required',
  severity: 'error',
  source: 'validation'
});

// Clear an error
eventBus.emit('error:clear', { fieldId: 'from-location' });
```

### Form Validation Events

- `form:field-changed` - Triggered when form field value changes
- `form:validation-requested` - Request validation for specific fields
- `form:valid` - Form passes all validation rules
- `form:invalid` - Form has validation errors

### Vehicle Selection Events

- `vehicle:selection-ready` - Vehicle options are available
- `vehicle:selected` - User has selected a vehicle
- `pricing:updated` - Pricing information has been calculated

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Places API for location services
- Tailwind CSS for rapid prototyping
- Flatpickr for date/time selection