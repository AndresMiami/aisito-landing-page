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

import eventBus from './EventBus.js';
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
 * Component Registry class for managing all application components
 */
class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.instances = new Map();
    this.dependencies = new Map();
    this.initialized = false;
    this.eventListeners = new Map();
    
    // Bind methods to maintain context
    this.register = this.register.bind(this);
    this.registerMany = this.registerMany.bind(this);
    this.get = this.get.bind(this);
    this.getAll = this.getAll.bind(this);
    this.initialize = this.initialize.bind(this);
    this.destroy = this.destroy.bind(this);
    this.waitFor = this.waitFor.bind(this);
    
    // Set up error handling
    this.setupErrorHandling();
  }
  
  /**
   * Set up global error handling for components
   */
  setupErrorHandling() {
    // Listen for component errors
    eventBus.on(EventDefinitions.EVENTS.ERROR.COMPONENT_ERROR, (data) => {
      console.error(`🚨 Component error received:`, data);
      
      // Attempt recovery if possible
      this.attemptRecovery(data.componentId, data.context);
    });
  }
  
  /**
   * Register a component with the registry
   * @param {string} id - Unique component identifier
   * @param {Class} ComponentClass - Component constructor
   * @param {Array<string>} dependencies - IDs of components this component depends on
   * @param {Object} config - Default configuration for the component
   * @returns {boolean} - Success status
   */
  register(id, ComponentClass, dependencies = [], config = {}) {
    if (this.components.has(id)) {
      console.warn(`⚠️ Component with ID "${id}" is already registered`);
      return false;
    }
    
    // Validate ComponentClass
    if (typeof ComponentClass !== 'function') {
      console.error(`❌ Invalid ComponentClass for "${id}": must be a constructor function`);
      return false;
    }
    
    this.components.set(id, {
      ComponentClass,
      config
    });
    
    if (dependencies.length > 0) {
      this.dependencies.set(id, dependencies);
    }
    
    console.log(`📝 Registered component: ${id}`, {
      dependencies,
      hasConfig: Object.keys(config).length > 0
    });
    
    // Emit registration event
    eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_REGISTERED, {
      id,
      componentName: ComponentClass.name,
      dependencies,
      timestamp: Date.now()
    });
    
    return true;
  }
  
  /**
   * Register multiple components at once
   * @param {Object} componentsMap - Map of component IDs to component data
   * @returns {number} - Number of successfully registered components
   */
  registerMany(componentsMap) {
    let successCount = 0;
    
    Object.entries(componentsMap).forEach(([id, componentData]) => {
      const {
        ComponentClass,
        dependencies = [],
        config = {}
      } = componentData;
      
      if (this.register(id, ComponentClass, dependencies, config)) {
        successCount++;
      }
    });
    
    console.log(`📋 Registered ${successCount}/${Object.keys(componentsMap).length} components`);
    return successCount;
  }
  
  /**
   * Get a component instance by ID
   * @param {string} id - Component ID
   * @param {Object} runtimeConfig - Runtime configuration to merge with default config
   * @returns {Object|null} - Component instance or null if not found
   */
  get(id, runtimeConfig = {}) {
    // Return existing instance if available
    if (this.instances.has(id)) {
      return this.instances.get(id);
    }
    
    // Check if component is registered
    if (!this.components.has(id)) {
      console.warn(`⚠️ Component with ID "${id}" is not registered`);
      return null;
    }
    
    try {
      return this.createInstance(id, runtimeConfig);
    } catch (error) {
      console.error(`❌ Error getting component "${id}":`, error);
      return null;
    }
  }
  
  /**
   * Create a component instance
   * @param {string} id - Component ID
   * @param {Object} runtimeConfig - Runtime configuration
   * @returns {Object} - Component instance
   * @private
   */
  createInstance(id, runtimeConfig = {}) {
    const componentData = this.components.get(id);
    const { ComponentClass, config: defaultConfig } = componentData;
    
    // Resolve dependencies
    const resolvedDependencies = this.resolveDependencies(id);
    
    if (resolvedDependencies === null) {
      throw new Error(`Failed to resolve dependencies for component "${id}"`);
    }
    
    // Merge configurations
    const finalConfig = {
      ...defaultConfig,
      ...runtimeConfig
    };
    
    // Create component instance
    const instance = new ComponentClass({
      componentId: id,
      dependencies: resolvedDependencies,
      eventBus,
      config: finalConfig
    });
    
    // Store instance
    this.instances.set(id, instance);
    
    // Initialize if registry is already initialized
    if (this.initialized && typeof instance.initialize === 'function') {
      instance.initialize().catch(error => {
        console.error(`❌ Error auto-initializing component "${id}":`, error);
      });
    }
    
    console.log(`✅ Created instance of component: ${id}`);
    return instance;
  }
  
  /**
   * Resolve dependencies for a component
   * @param {string} id - Component ID
   * @returns {Object|null} - Resolved dependencies or null if failed
   * @private
   */
  resolveDependencies(id) {
    const resolvedDependencies = {};
    
    if (this.dependencies.has(id)) {
      const dependencies = this.dependencies.get(id);
      
      for (const depId of dependencies) {
        // Prevent circular dependencies
        if (depId === id) {
          console.error(`❌ Circular dependency detected: ${id} depends on itself`);
          return null;
        }
        
        // Get dependency instance (this may create it if not exists)
        const dependency = this.get(depId);
        
        if (!dependency) {
          console.error(`❌ Dependency "${depId}" for component "${id}" could not be resolved`);
          return null;
        }
        
        resolvedDependencies[depId] = dependency;
      }
    }
    
    return resolvedDependencies;
  }
  
  /**
   * Get all component instances
   * @returns {Object} - Map of component IDs to instances
   */
  getAll() {
    const result = {};
    
    this.instances.forEach((instance, id) => {
      result[id] = instance;
    });
    
    return result;
  }
  
  /**
   * Wait for a component to be ready
   * @param {string} id - Component ID
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} - Promise that resolves with component instance
   */
  async waitFor(id, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for component "${id}"`));
      }, timeout);
      
      const checkComponent = () => {
        const instance = this.instances.get(id);
        if (instance && instance.isReady && instance.isReady()) {
          clearTimeout(timeoutId);
          resolve(instance);
          return;
        }
        
        // Check again in next tick
        setTimeout(checkComponent, 10);
      };
      
      checkComponent();
    });
  }
  
  /**
   * Initialize all registered components
   * @returns {Promise<boolean>} - Success status
   */
  async initialize() {
    if (this.initialized) {
      console.warn('⚠️ ComponentRegistry is already initialized');
      return false;
    }
    
    console.log('🚀 Initializing ComponentRegistry...');
    
    try {
      // Get initialization order
      const initOrder = this.getInitializationOrder();
      
      console.log('📋 Component initialization order:', initOrder);
      
      // Initialize components in order
      for (const id of initOrder) {
        try {
          // Get or create instance
          const instance = this.get(id);
          
          // Initialize if it has initialize method
          if (instance && typeof instance.initialize === 'function') {
            await instance.initialize();
          }
        } catch (error) {
          console.error(`❌ Error initializing component "${id}":`, error);
          // Continue with other components
        }
      }
      
      this.initialized = true;
      
      console.log('✅ ComponentRegistry initialization complete');
      
      // Emit initialization event
      eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENTS_INITIALIZED, {
        componentCount: this.instances.size,
        componentIds: Array.from(this.instances.keys()),
        timestamp: Date.now()
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Error during ComponentRegistry initialization:', error);
      return false;
    }
  }
  
  /**
   * Destroy all component instances
   * @returns {Promise<boolean>} - Success status
   */
  async destroy() {
    console.log('🗑️ Destroying ComponentRegistry...');
    
    try {
      // Get reverse initialization order
      const destroyOrder = this.getInitializationOrder().reverse();
      
      // Destroy components in reverse order
      for (const id of destroyOrder) {
        const instance = this.instances.get(id);
        
        if (instance && typeof instance.destroy === 'function') {
          try {
            await instance.destroy();
          } catch (error) {
            console.error(`❌ Error destroying component "${id}":`, error);
          }
        }
      }
      
      // Clear instances
      this.instances.clear();
      this.initialized = false;
      
      console.log('✅ ComponentRegistry destruction complete');
      
      // Emit destruction event
      eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENTS_DESTROYED, {
        timestamp: Date.now()
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Error during ComponentRegistry destruction:', error);
      return false;
    }
  }
  
  /**
   * Attempt to recover a failed component
   * @param {string} id - Component ID
   * @param {string} context - Error context
   * @private
   */
  async attemptRecovery(id, context) {
    console.log(`🔄 Attempting recovery for component "${id}" (context: ${context})`);
    
    try {
      const instance = this.instances.get(id);
      
      if (instance) {
        // Try to destroy and recreate
        if (typeof instance.destroy === 'function') {
          await instance.destroy();
        }
        
        // Remove from instances
        this.instances.delete(id);
        
        // Recreate instance
        const newInstance = this.get(id);
        
        if (newInstance && typeof newInstance.initialize === 'function') {
          await newInstance.initialize();
        }
        
        console.log(`✅ Successfully recovered component "${id}"`);
        
        // Emit recovery event
        eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_RECOVERED, {
          componentId: id,
          context,
          timestamp: Date.now()
        });
        
      }
    } catch (error) {
      console.error(`❌ Failed to recover component "${id}":`, error);
    }
  }
  
  /**
   * Get initialization order based on dependencies
   * @returns {Array<string>} - Component IDs in initialization order
   * @private
   */
  getInitializationOrder() {
    const visited = new Set();
    const visiting = new Set();
    const result = [];
    
    // Helper function for topological sort with cycle detection
    const visit = (id) => {
      // Check for circular dependency
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected involving component "${id}"`);
      }
      
      // Skip if already visited
      if (visited.has(id)) return;
      
      // Mark as currently visiting
      visiting.add(id);
      
      // Visit dependencies first
      if (this.dependencies.has(id)) {
        for (const depId of this.dependencies.get(id)) {
          // Ensure dependency is registered
          if (!this.components.has(depId)) {
            console.warn(`⚠️ Dependency "${depId}" for component "${id}" is not registered`);
            continue;
          }
          visit(depId);
        }
      }
      
      // Mark as visited and remove from visiting
      visiting.delete(id);
      visited.add(id);
      
      // Add to result
      result.push(id);
    };
    
    try {
      // Visit all components
      for (const id of this.components.keys()) {
        visit(id);
      }
    } catch (error) {
      console.error('❌ Error calculating initialization order:', error);
      // Fallback to simple registration order
      return Array.from(this.components.keys());
    }
    
    return result;
  }
  
  /**
   * Get registry statistics
   * @returns {Object} - Registry statistics
   */
  getStats() {
    const registeredCount = this.components.size;
    const instanceCount = this.instances.size;
    const initializedCount = Array.from(this.instances.values())
      .filter(instance => instance.isReady && instance.isReady()).length;
    
    return {
      registered: registeredCount,
      instantiated: instanceCount,
      initialized: initializedCount,
      isInitialized: this.initialized,
      components: Array.from(this.components.keys())
    };
  }
}

// Create singleton instance
const registry = new ComponentRegistry();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.ComponentRegistry = registry;
}

console.log('🏗️ ComponentRegistry loaded and ready');

// Export the registry singleton and BaseComponent class
export default registry;
export { BaseComponent };