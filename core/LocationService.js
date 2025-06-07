/**
 * LocationService.js - Advanced Google Places API Service for Miami AI Concierge
 * 
 * Replaces Google's shadow DOM web components with a modern, cacheable,
 * and highly performant location service specifically optimized for Miami.
 * 
 * Features:
 * - Geographic biasing for Miami area
 * - Intelligent caching with 5-minute TTL
 * - Debounced search for performance
 * - Structured error handling
 * - ES6 module compatibility
 * - Promise-based async operations
 */

class LocationService {
    /**
     * Initialize the LocationService
     * @param {Object} options - Configuration options
     * @param {string} options.apiKey - Google Maps API key
     * @param {Object} options.biasLocation - Geographic bias location
     * @param {string} options.language - Language preference
     * @param {string} options.region - Region preference
     * @param {boolean} options.enableCaching - Enable result caching
     * @param {number} options.cacheTimeout - Cache timeout in milliseconds
     */
    constructor(options = {}) {
        // Configuration
        this.config = {
            apiKey: options.apiKey || process.env.GOOGLE_MAPS_API_KEY,
            biasLocation: options.biasLocation || {
                lat: 25.7617,  // Miami coordinates
                lng: -80.1918
            },
            language: options.language || 'en',
            region: options.region || 'us',
            enableCaching: options.enableCaching !== false,
            cacheTimeout: options.cacheTimeout || 5 * 60 * 1000, // 5 minutes
            debounceDelay: options.debounceDelay || 300,
            maxResults: options.maxResults || 10
        };

        // Services
        this.autocompleteService = null;
        this.placesService = null;
        this.geocoder = null;

        // Caching system
        this.cache = new Map();
        this.debounceTimers = new Map();

        // Initialization state
        this.isInitialized = false;
        this.initializationPromise = null;

        // Performance metrics
        this.metrics = {
            cacheHits: 0,
            cacheMisses: 0,
            apiCalls: 0,
            errors: 0
        };

        console.log('🏢 LocationService initialized with Miami bias:', this.config.biasLocation);
    }

    /**
     * Initialize Google Places API services
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        if (this.isInitialized) {
            return true;
        }

        if (this.initializationPromise) {
            return await this.initializationPromise;
        }

        this.initializationPromise = this._performInitialization();
        return await this.initializationPromise;
    }

    /**
     * Internal initialization method
     * @private
     */
    async _performInitialization() {
        try {
            console.log('🔄 LocationService: Initializing Google Places API services...');

            // Wait for Google Maps API to be available
            if (!window.google || !window.google.maps) {
                await this._waitForGoogleMapsAPI();
            }

            // Validate API availability
            if (!window.google.maps.places) {
                throw new Error('Google Places API not available. Make sure to include places library.');
            }

            // Initialize services
            this.autocompleteService = new google.maps.places.AutocompleteService();
            this.geocoder = new google.maps.Geocoder();
            
            // Create a temporary div for PlacesService (required by Google API)
            const tempDiv = document.createElement('div');
            this.placesService = new google.maps.places.PlacesService(tempDiv);

            this.isInitialized = true;
            console.log('✅ LocationService: Google Places API services initialized successfully');
            
            return true;

        } catch (error) {
            console.error('❌ LocationService: Initialization failed:', error);
            this.metrics.errors++;
            throw new Error(`LocationService initialization failed: ${error.message}`);
        }
    }

    /**
     * Wait for Google Maps API to load
     * @private
     */
    _waitForGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            const checkInterval = 100;

            const checkAPI = () => {
                attempts++;
                
                if (window.google && window.google.maps && window.google.maps.places) {
                    console.log('✅ Google Maps API loaded successfully');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Google Maps API failed to load within timeout'));
                } else {
                    setTimeout(checkAPI, checkInterval);
                }
            };

            checkAPI();
        });
    }

    /**
     * Initialize Google Maps services with proper configuration
     * @private
     */
    _initializeGoogleServices() {
        try {
            // Instead of using deprecated AutocompleteService, use Places API with SessionToken
            this.placesService = new google.maps.places.PlacesService(this._getMapElement());
            this.sessionToken = new google.maps.places.AutocompleteSessionToken();
            this.geocoder = new google.maps.Geocoder();
            
            // Add warning about deprecation
            console.warn('🔶 Note: Google Maps Places API components are being deprecated. The LocationService implements a custom solution as a replacement.');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Google Maps services:', error);
            return false;
        }
    }

    /**
     * Get or create a map element for PlacesService
     * @private
     */
    _getMapElement() {
        // Check if we already have a map element
        if (this._mapElement) {
            return this._mapElement;
        }
        
        // Create a hidden map element
        this._mapElement = document.createElement('div');
        this._mapElement.style.display = 'none';
        document.body.appendChild(this._mapElement);
        
        // Initialize a map on the element
        this._hiddenMap = new google.maps.Map(this._mapElement, {
            center: this.config.biasLocation,
            zoom: 10,
            disableDefaultUI: true
        });
        
        return this._mapElement;
    }

    /**
     * Search for places with autocomplete functionality
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Array of place predictions
     */
    async searchPlaces(query, options = {}) {
        try {
            // Validate inputs
            if (!query || typeof query !== 'string' || query.trim().length < 2) {
                return [];
            }

            const trimmedQuery = query.trim();
            
            // Initialize if needed
            await this.initialize();

            // Check cache first
            const cacheKey = this._generateCacheKey('search', trimmedQuery, options);
            const cachedResult = this._getFromCache(cacheKey);
            
            if (cachedResult) {
                console.log(`🎯 LocationService: Cache hit for query "${trimmedQuery}"`);
                this.metrics.cacheHits++;
                return cachedResult;
            }

            this.metrics.cacheMisses++;
            console.log(`🔍 LocationService: Searching for "${trimmedQuery}"`);

            // Prepare search request
            const request = this._buildSearchRequest(trimmedQuery, options);

            // Perform search with debouncing
            const results = await this._performDebouncedSearch(cacheKey, request);

            // Process and cache results
            const processedResults = this._processSearchResults(results);
            this._setCache(cacheKey, processedResults);

            console.log(`✅ LocationService: Found ${processedResults.length} results for "${trimmedQuery}"`);
            return processedResults;

        } catch (error) {
            console.error('❌ LocationService: Search error:', error);
            this.metrics.errors++;
            
            // Return empty array instead of throwing to maintain UX
            return [];
        }
    }

    /**
     * Get detailed information about a specific place
     * @param {string} placeId - Google Places place ID
     * @param {Array} fields - Fields to retrieve
     * @returns {Promise<Object>} Place details
     */
    async getPlaceDetails(placeId, fields = null) {
        try {
            // Validate inputs
            if (!placeId || typeof placeId !== 'string') {
                throw new Error('Valid place ID is required');
            }

            // Initialize if needed
            await this.initialize();

            // Default fields for Miami Concierge
            const defaultFields = [
                'place_id',
                'name',
                'formatted_address',
                'geometry',
                'address_components',
                'types',
                'international_phone_number',
                'website',
                'rating',
                'user_ratings_total'
            ];

            const requestFields = fields || defaultFields;

            // Check cache
            const cacheKey = this._generateCacheKey('details', placeId, { fields: requestFields });
            const cachedResult = this._getFromCache(cacheKey);
            
            if (cachedResult) {
                console.log(`🎯 LocationService: Cache hit for place details ${placeId}`);
                this.metrics.cacheHits++;
                return cachedResult;
            }

            this.metrics.cacheMisses++;
            console.log(`🔍 LocationService: Getting details for place ${placeId}`);

            // Get place details
            const placeDetails = await this._getPlaceDetailsFromAPI(placeId, requestFields);
            
            // Process and structure the result
            const processedDetails = this._processPlaceDetails(placeDetails);
            
            // Cache the result
            this._setCache(cacheKey, processedDetails);

            console.log(`✅ LocationService: Retrieved details for ${processedDetails.name}`);
            return processedDetails;

        } catch (error) {
            console.error('❌ LocationService: Place details error:', error);
            this.metrics.errors++;
            throw new Error(`Failed to get place details: ${error.message}`);
        }
    }

    /**
     * Geocode an address to coordinates
     * @param {string} address - Address to geocode
     * @returns {Promise<Object>} Geocoding result
     */
    async geocodeAddress(address) {
        try {
            if (!address || typeof address !== 'string') {
                throw new Error('Valid address is required');
            }

            await this.initialize();

            const cacheKey = this._generateCacheKey('geocode', address);
            const cachedResult = this._getFromCache(cacheKey);
            
            if (cachedResult) {
                this.metrics.cacheHits++;
                return cachedResult;
            }

            this.metrics.cacheMisses++;
            
            const result = await this._performGeocoding(address);
            this._setCache(cacheKey, result);
            
            return result;

        } catch (error) {
            console.error('❌ LocationService: Geocoding error:', error);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Get current user location
     * @param {Object} options - Geolocation options
     * @returns {Promise<Object>} User location
     */
    async getCurrentLocation(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            const defaultOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000 // 1 minute cache
            };

            const geoOptions = { ...defaultOptions, ...options };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    };
                    
                    console.log('📍 LocationService: Got current location:', location);
                    resolve(location);
                },
                (error) => {
                    console.error('❌ LocationService: Geolocation error:', error);
                    this.metrics.errors++;
                    reject(error);
                },
                geoOptions
            );
        });
    }

    /**
     * Build search request object
     * @private
     */
    _buildSearchRequest(query, options) {
        // Create location bias for Miami area
        const locationBias = new google.maps.LatLngBounds(
            new google.maps.LatLng(25.6, -80.5),  // Southwest
            new google.maps.LatLng(26.2, -80.0)   // Northeast
        );

        return {
            input: query,
            locationBias: locationBias,
            componentRestrictions: { country: this.config.region },
            language: this.config.language,
            types: options.types || ['establishment', 'geocode'],
            ...options
        };
    }

    /**
     * Perform debounced search
     * @private
     */
    async _performDebouncedSearch(cacheKey, request) {
        return new Promise((resolve, reject) => {
            // Clear existing timer for this query
            if (this.debounceTimers.has(cacheKey)) {
                clearTimeout(this.debounceTimers.get(cacheKey));
            }

            // Set new debounced timer
            const timer = setTimeout(async () => {
                try {
                    this.debounceTimers.delete(cacheKey);
                    this.metrics.apiCalls++;

                    this.autocompleteService.getPlacePredictions(
                        request,
                        (predictions, status) => {
                            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                                resolve(predictions);
                            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                                resolve([]);
                            } else {
                                reject(new Error(`Places API error: ${status}`));
                            }
                        }
                    );
                } catch (error) {
                    reject(error);
                }
            }, this.config.debounceDelay);

            this.debounceTimers.set(cacheKey, timer);
        });
    }

    /**
     * Process search results into standardized format
     * @private
     */
    _processSearchResults(predictions) {
        return predictions
            .slice(0, this.config.maxResults)
            .map(prediction => ({
                place_id: prediction.place_id,
                name: prediction.structured_formatting?.main_text || prediction.description,
                formatted_address: prediction.description,
                secondary_text: prediction.structured_formatting?.secondary_text || '',
                types: prediction.types || [],
                isAirport: this._isAirportLocation(prediction),
                confidence: this._calculateConfidence(prediction)
            }))
            .filter(place => this._isValidUSLocation(place));
    }

    /**
     * Get place details from Google API
     * @private
     */
    async _getPlaceDetailsFromAPI(placeId, fields) {
        return new Promise((resolve, reject) => {
            this.metrics.apiCalls++;

            const request = {
                placeId: placeId,
                fields: fields
            };

            this.placesService.getDetails(request, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    resolve(place);
                } else {
                    reject(new Error(`Place details API error: ${status}`));
                }
            });
        });
    }

    /**
     * Process place details into standardized format
     * @private
     */
    _processPlaceDetails(place) {
        const location = place.geometry?.location;
        
        return {
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            coordinates: location ? {
                lat: location.lat(),
                lng: location.lng()
            } : null,
            address_components: place.address_components || [],
            types: place.types || [],
            phone: place.international_phone_number,
            website: place.website,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            isAirport: this._isAirportFromTypes(place.types),
            businessStatus: place.business_status,
            priceLevel: place.price_level
        };
    }

    /**
     * Perform geocoding
     * @private
     */
    async _performGeocoding(address) {
        return new Promise((resolve, reject) => {
            this.metrics.apiCalls++;

            this.geocoder.geocode({
                address: address,
                componentRestrictions: { country: this.config.region },
                bounds: new google.maps.LatLngBounds(
                    new google.maps.LatLng(25.6, -80.5),
                    new google.maps.LatLng(26.2, -80.0)
                )
            }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const result = results[0];
                    const location = result.geometry.location;
                    
                    resolve({
                        formatted_address: result.formatted_address,
                        coordinates: {
                            lat: location.lat(),
                            lng: location.lng()
                        },
                        address_components: result.address_components,
                        types: result.types,
                        place_id: result.place_id
                    });
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
    }

    /**
     * Check if location is an airport
     * @private
     */
    _isAirportLocation(prediction) {
        const description = prediction.description?.toLowerCase() || '';
        const types = prediction.types || [];
        
        return types.includes('airport') || 
               description.includes('airport') ||
               description.includes('mia') ||
               description.includes('miami international');
    }

    /**
     * Check if place types include airport
     * @private
     */
    _isAirportFromTypes(types = []) {
        return types.includes('airport');
    }

    /**
     * Validate US location
     * @private
     */
    _isValidUSLocation(place) {
        // Simple validation - could be enhanced with more sophisticated checks
        return true; // Currently accepting all results since we use country restriction
    }

    /**
     * Calculate confidence score for predictions
     * @private
     */
    _calculateConfidence(prediction) {
        let confidence = 0.5; // Base confidence
        
        // Boost confidence for structured formatting
        if (prediction.structured_formatting) {
            confidence += 0.2;
        }
        
        // Boost for match quality
        if (prediction.matched_substrings && prediction.matched_substrings.length > 0) {
            confidence += 0.2;
        }
        
        // Boost for Miami area (simplified check)
        if (prediction.description?.toLowerCase().includes('miami')) {
            confidence += 0.1;
        }
        
        return Math.min(confidence, 1.0);
    }

    /**
     * Generate cache key
     * @private
     */
    _generateCacheKey(type, query, options = {}) {
        const optionsString = JSON.stringify(options);
        return `${type}:${query}:${optionsString}`;
    }

    /**
     * Get item from cache
     * @private
     */
    _getFromCache(key) {
        if (!this.config.enableCaching) {
            return null;
        }

        const cached = this.cache.get(key);
        if (!cached) {
            return null;
        }

        // Check expiration
        if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set item in cache
     * @private
     */
    _setCache(key, data) {
        if (!this.config.enableCaching) {
            return;
        }

        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });

        // Cleanup old entries if cache gets too large
        if (this.cache.size > 100) {
            this._cleanupCache();
        }
    }

    /**
     * Cleanup expired cache entries
     * @private
     */
    _cleanupCache() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.config.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
        const cacheHitRate = totalRequests > 0 ? (this.metrics.cacheHits / totalRequests * 100).toFixed(1) : 0;

        return {
            ...this.metrics,
            totalRequests,
            cacheHitRate: `${cacheHitRate}%`,
            cacheSize: this.cache.size
        };
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 LocationService: Cache cleared');
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Clear all timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();

        // Clear cache
        this.clearCache();

        // Reset services
        this.autocompleteService = null;
        this.placesService = null;
        this.geocoder = null;
        this.isInitialized = false;

        console.log('🧹 LocationService: Destroyed and cleaned up');
    }
}

// Export as ES6 module
export default LocationService;

// Also make available globally for non-module usage
if (typeof window !== 'undefined') {
    window.LocationService = LocationService;
}

console.log('🏢 LocationService module loaded successfully');