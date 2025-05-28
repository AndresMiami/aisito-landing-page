/**
 * ComponentRegistry.js - Component registration and management for Miami Concierge
 * 
 * This module provides a centralized registry for all components in the application,
 * allowing for lifecycle management, dependency injection, and event coordination.
 * 
 * Features:
 * - Component lifecycle management (init, destroy)
 * - Dependency injection and resolution
 * - Event coordination between components
 * - Lazy loading and instantiation
 * - Error handling and recovery
 * 
 * Usage:
 * import ComponentRegistry from './core/ComponentRegistry.js';
 * 
 * // Register a component
 * ComponentRegistry.register('booking-form', BookingFormComponent);
 * 
 * // Get a component instance
 * const bookingForm = ComponentRegistry.get('booking-form');
 */

import eventBus from '../eventBus.js';
import EventDefinitions from './EventDefinitions.js';

/**
 * Base Component class that all components should extend
 */
export class BaseComponent {
  constructor(options = {}) {
    this.componentId = options.componentId || 'unknown';
    this.dependencies = options.dependencies || {};
    this.eventBus = options.eventBus || eventBus;
    this.config = options.config || {};
    this.isInitialized = false;
    this.isDestroyed = false;
    
    // Bind lifecycle methods
    this.initialize = this.initialize.bind(this);
    this.destroy = this.destroy.bind(this);
    this.onError = this.onError.bind(this);
  }
  
  /**
   * Initialize the component - override in subclasses
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn(`Component ${this.componentId} is already initialized`);
      return;
    }
    
    try {
      console.log(`🔧 Initializing component: ${this.componentId}`);
      
      // Override this method in subclasses
      await this.onInitialize();
      
      this.isInitialized = true;
      
      // Emit initialization event
      this.eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_INITIALIZED, {
        componentId: this.componentId,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error(`❌ Error initializing component ${this.componentId}:`, error);
      this.onError(error, 'initialization');
    }
  }
  
  /**
   * Override this method in subclasses for initialization logic
   */
  async onInitialize() {
    // Implementation in subclasses
  }
  
  /**
   * Destroy the component - cleanup resources
   */
  async destroy() {
    if (this.isDestroyed) {
      console.warn(`Component ${this.componentId} is already destroyed`);
      return;
    }
    
    try {
      console.log(`🗑️ Destroying component: ${this.componentId}`);
      
      // Override this method in subclasses
      await this.onDestroy();
      
      this.isDestroyed = true;
      this.isInitialized = false;
      
      // Emit destruction event
      this.eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_DESTROYED, {
        componentId: this.componentId,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error(`❌ Error destroying component ${this.componentId}:`, error);
      this.onError(error, 'destruction');
    }
  }
  
  /**
   * Override this method in subclasses for cleanup logic
   */
  async onDestroy() {
    // Implementation in subclasses
  }
  
  /**
   * Error handler - override in subclasses for custom error handling
   */
  onError(error, context = 'unknown') {
    console.error(`Component ${this.componentId} error in ${context}:`, error);
    
    // Emit error event
    this.eventBus.emit(EventDefinitions.EVENTS.ERROR.COMPONENT_ERROR, {
      componentId: this.componentId,
      error: error.message,
      context,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get a dependency by ID
   */
  getDependency(id) {
    return this.dependencies[id] || null;
  }
  
  /**
   * Check if component is ready (initialized and not destroyed)
   */
  isReady() {
    return this.isInitialized && !this.isDestroyed;
  }
}

/**
 * Component Registry for managing application components
 */
class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.instances = new Map();
  }

  register(id, ComponentClass, dependencies = [], config = {}) {
    if (this.components.has(id)) {
      console.warn(`Component with ID "${id}" is already registered.`);
      return false;
    }
    this.components.set(id, { ComponentClass, dependencies, config });
    console.log(`Component "${id}" registered successfully.`);
    return true;
  }

  registerMany(componentsMap) {
    let count = 0;
    for (const [id, componentData] of Object.entries(componentsMap)) {
      if (this.register(id, componentData.ComponentClass, componentData.dependencies, componentData.config)) {
        count++;
      }
    }
    return count;
  }

  get(id, runtimeConfig = {}) {
    if (!this.components.has(id)) {
      console.warn(`Component with ID "${id}" is not registered.`);
      return null;
    }

    if (this.instances.has(id)) {
      return this.instances.get(id);
    }

    const { ComponentClass, dependencies, config } = this.components.get(id);
    const mergedConfig = { ...config, ...runtimeConfig };
    const instance = new ComponentClass(mergedConfig);
    
    this.instances.set(id, instance);
    if (instance.initialize) {
      instance.initialize();
    }
    return instance;
  }

  async initializeAll() {
    for (const [id, { ComponentClass }] of this.components) {
      if (!this.instances.has(id)) {
        const instance = new ComponentClass();
        this.instances.set(id, instance);
        if (instance.initialize) {
          await instance.initialize();
        }
      }
    }
  }

  async destroyAll() {
    for (const [id, instance] of this.instances) {
      if (instance && typeof instance.destroy === 'function') {
        await instance.destroy();
      }
    }
    this.instances.clear();
  }

  clear() {
    this.instances.clear();
    this.components.clear();
    console.log('Component registry cleared.');
  }
}

// Create singleton instance
const registry = new ComponentRegistry();

// ONLY export the registry (remove duplicate BaseComponent export)
export default registry;