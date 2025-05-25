# 🏖️ Miami AI Concierge

> **Luxury transportation and concierge platform powered by AI-driven event architecture**

An intelligent booking platform for Miami's premium transportation and luxury experiences, built with modern JavaScript architecture featuring event-driven components and real-time validation.

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://your-username.github.io/miami-ai-concierge/)
[![GitHub license](https://img.shields.io/github/license/your-username/miami-ai-concierge)](https://github.com/your-username/miami-ai-concierge/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/your-username/miami-ai-concierge)](https://github.com/your-username/miami-ai-concierge/stargazers)

## ✨ Features

### 🚗 **Transportation Services**
- **One-Way Transfers** - Airport, hotel, and point-to-point luxury transportation
- **Hourly Chauffeur** - Flexible hourly service for business and leisure
- **Premium Fleet** - Tesla Model Y, Cadillac Escalade, Mercedes Sprinter

### 🎯 **Experience+ Services**
- **Yacht & Boat Charters** - Luxury marine experiences on Biscayne Bay
- **Miami Relocation** - Comprehensive moving and housing consultation
- **Tours & Excursions** - Curated experiences with local expert guides
- **Airport Transfers** - Reliable, tracked service to all Miami airports

### 🏗️ **Technical Architecture**
- **Event-Driven System** - Centralized EventBus for component communication
- **Component Registry** - Modular architecture with dependency injection
- **DOMManager** - Centralized DOM manipulation with performance caching
- **Real-time Validation** - Advanced form validation with instant user feedback
- **Error Recovery** - Comprehensive error handling with automatic recovery

### 🎨 **User Experience**
- **Mobile-First Design** - Responsive design optimized for all device sizes
- **Google Maps Integration** - Real-time location autocomplete with Places API
- **Accessibility** - WCAG 2.1 AA compliant with full ARIA support
- **Performance** - Optimized loading with lazy component initialization

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Local web server (for development)
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/miami-ai-concierge.git
   ```

2. **Set up configuration**
   ```bash
   cp .env.example .env
   ```

3. **Serve locally**
   ```bash
   npm install
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🏗️ Architecture Overview

### Core System
```
src/
├── core/
│   ├── EventBus.js          # Centralized event management
│   ├── EventDefinitions.js  # Event constants and payload creators
│   ├── DOMManager.js        # Safe DOM manipulation with caching
│   ├── ComponentRegistry.js # Component lifecycle and dependencies
│   └── BaseComponent.js     # Base class for all components
├── components/
│   ├── BookingFormComponent.js    # Form management and validation
│   ├── TabNavigationComponent.js  # Tab switching and state
│   ├── ExperienceSelectorComponent.js # Experience selection logic
│   ├── VehicleSelectionComponent.js # Vehicle selection logic
│   ├── LocationPickerComponent.js # Location selection logic
│   ├── DateTimePickerComponent.js # Date and time selection logic
│   └── ErrorHandlerComponent.js   # Error display and recovery
└── modules/
    ├── formValidation.js    # Business rule validation
    ├── formSubmission.js    # Form submission handling
    ├── errorHandling.js     # Error management
    ├── mapsIntegration.js    # Google Maps integration
    └── analyticsTracker.js   # User interaction tracking
```

### Event Flow
```mermaid
graph TD
```