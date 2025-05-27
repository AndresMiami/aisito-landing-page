# API Service for Miami AI Concierge

This module provides a centralized service for handling booking-related API calls in the Miami AI Concierge project. It includes various services that manage interactions with the backend API, ensuring a clean and maintainable codebase.

## Services Overview

- **BookingService**: Handles all booking-related API calls, including creating, retrieving, updating, and canceling bookings. It incorporates centralized error handling and event emission for API errors.

- **VehicleService**: Manages API calls related to vehicle data, such as fetching available vehicles and their details.

- **LocationService**: Handles API calls for location-related data, including fetching location details and validating addresses.

- **AnalyticsService**: Manages API calls for tracking user interactions and analytics data.

## Core Components

- **ApiClient**: Provides a centralized interface for making API requests, handling common configurations, and managing request/response transformations.

- **RequestHandler**: Manages the setup and execution of API requests, including error handling and response parsing.

- **ErrorHandler**: Provides methods for handling and logging errors that occur during API calls.

## Types

- **Booking Types**: Defines types and interfaces related to booking data structures, including Booking and BookingResponse types.

- **Vehicle Types**: Defines types and interfaces related to vehicle data structures, including Vehicle and VehicleResponse types.

- **Common Types**: Exports common types and interfaces used across the application, such as APIResponse and Error types.

## Configuration

- **Endpoints**: Configuration object that defines the API endpoints used throughout the application.

- **Environment**: Exports environment-specific configurations, such as API base URLs and feature flags.

## Utilities

- **Validation**: Utility functions for validating input data, including form validation and data integrity checks.

- **Formatting**: Utility functions for formatting data, such as date formatting and currency formatting.

## Testing

Unit tests are provided for the services and core components to ensure functionality and error handling.

## Setup Instructions

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Configure environment variables as needed.
4. Run tests using `npm test`.

## Usage

Import the necessary services in your application to interact with the API. For example:

```javascript
import BookingService from './src/services/BookingService';
```

This will allow you to utilize the methods provided by the BookingService for managing bookings in the Miami AI Concierge application.