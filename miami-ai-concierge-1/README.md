# 🏖️ Miami AI Concierge

An intelligent booking platform for Miami transportation and luxury experiences, built with modern JavaScript architecture and AI-powered features.

## ✨ Features

### 🚗 **Transportation Services**
- **One-Way Transfers** - Airport, hotel, and point-to-point transportation
- **Hourly Chauffeur** - Flexible hourly service for business and leisure
- **Premium Vehicles** - Luxury sedans, SUVs, and VIP sprinters

### 🎯 **Experience+ Services**
- **Yacht & Boat Charters** - Luxury marine experiences
- **Miami Relocation** - Comprehensive moving and housing services
- **Tours & Excursions** - Curated Miami experiences
- **Airport Transfers** - Reliable, tracked airport service

### 🏗️ **Technical Architecture**
- **Event-Driven Architecture** - Centralized EventBus for component communication
- **Component Registry** - Modular component management with dependency injection
- **DOMManager** - Centralized DOM manipulation with caching
- **Real-time Validation** - Advanced form validation with instant feedback
- **Error Handling** - Comprehensive error management with user-friendly messaging

### 🎨 **User Experience**
- **Mobile-First Design** - Responsive design optimized for all devices
- **Google Maps Integration** - Real-time location autocomplete
- **Accessibility** - WCAG compliant with ARIA attributes
- **Loading States** - Smooth animations and loading indicators

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/miami-ai-concierge.git
   cd miami-ai-concierge
   ```

2. **Set up configuration**
   ```bash
   cp config.example.js config.js
   # Edit config.js with your API keys
   ```

3. **Serve locally**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

4. **Open in browser**
   Open `http://localhost:8000` in your web browser.

## 🏗️ Architecture

### Core Modules
- **EventBus** (`src/core/EventBus.js`) - Centralized event management
- **DOMManager** (`src/core/DOMManager.js`) - Safe DOM manipulation
- **ComponentRegistry** (`src/core/ComponentRegistry.js`) - Component lifecycle management
- **EventDefinitions** (`src/core/EventDefinitions.js`) - Centralized event constants
- **BaseComponent** (`src/core/BaseComponent.js`) - Standardized component lifecycle

### Form Management
- **Form Validation** (`src/modules/validation/formValidation.js`) - Real-time validation with business rules
- **Error Handling** (`src/modules/validation/errorHandling.js`) - User-friendly error display
- **Form Submission** (`src/modules/submission/formSubmission.js`) - Async form processing

### UI Components
- **Tab Navigation** - Dynamic tab switching
- **Vehicle Selection** - Interactive vehicle cards
- **Date/Time Pickers** - Flatpickr integration
- **Location Autocomplete** - Google Places API

## 🔧 Development

### Debug Mode
Enable debug mode by adding `?debug=true` to the URL or running on localhost:

**Debug Panel Shortcuts:**
- `Ctrl + Shift + D` - Toggle debug panel
- `Ctrl + Shift + E` - Toggle event monitor
- `Ctrl + Shift + C` - Clear event history

### Event Monitoring
Real-time event monitoring dashboard for debugging:
```javascript
// Access via browser console
window.eventMonitor.show()
window.eventMonitor.clear()
window.ComponentRegistry.getStats()
```

### Component Development
```javascript
import { BaseComponent } from './core/BaseComponent.js';

class MyComponent extends BaseComponent {
  async onInitialize() { /* Initialization logic */ }
}

// Register component
ComponentRegistry.register('my-component', MyComponent, ['dependency1', 'dependency2']);
```

## 🚀 Deployment

### Production Checklist
- [ ] Remove debug validation files
- [ ] Ensure all environment variables are set in `.env` file
- [ ] Optimize assets for production

## 📜 License
This project is licensed under the MIT License. See the LICENSE file for details.