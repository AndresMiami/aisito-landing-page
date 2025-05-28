import { BaseComponent } from './BaseComponent.js';
import EventBus from './EventBus.js';
import DOMManager from './DOMManager.js';

/**
 * Component Registry class for managing all application components
 */
class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.instances = new Map(); // Add instances map for singleton pattern
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
      console.warn(`Component with ID "${id}" is already registered.`);
      return false;
    }
    this.components.set(id, { ComponentClass, dependencies, config });
    console.log(`Component "${id}" registered successfully.`);
    return true;
  }

  /**
   * Register multiple components at once
   * @param {Object} componentsMap - Map of component IDs to component data
   * @returns {number} - Number of successfully registered components
   */
  registerMany(componentsMap) {
    let count = 0;
    for (const [id, componentData] of Object.entries(componentsMap)) {
      if (this.register(id, componentData.ComponentClass, componentData.dependencies, componentData.config)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get a component instance by ID
   * @param {string} id - Component ID
   * @param {Object} runtimeConfig - Runtime configuration to merge with default config
   * @returns {Object|null} - Component instance or null if not found
   */
  get(id, runtimeConfig = {}) {
    if (!this.components.has(id)) {
      console.warn(`Component with ID "${id}" is not registered.`);
      return null;
    }

    // Return existing instance if already created (singleton pattern)
    if (this.instances.has(id)) {
      return this.instances.get(id);
    }

    const { ComponentClass, dependencies, config } = this.components.get(id);
    const mergedConfig = { ...config, ...runtimeConfig };
    const instance = new ComponentClass(mergedConfig);
    
    // Store instance for singleton pattern
    this.instances.set(id, instance);
    instance.initialize();
    return instance;
  }

  /**
   * Initialize all registered components
   */
  async initializeAll() {
    for (const [id, { ComponentClass }] of this.components) {
      if (!this.instances.has(id)) {
        const instance = new ComponentClass();
        this.instances.set(id, instance);
        await instance.initialize();
      }
    }
  }

  /**
   * Destroy all registered components
   */
  async destroyAll() {
    for (const [id, instance] of this.instances) {
      if (instance && typeof instance.destroy === 'function') {
        await instance.destroy();
      }
    }
    this.instances.clear();
  }

  /**
   * Clear all components and instances
   */
  clear() {
    this.instances.clear();
    this.components.clear();
    console.log('Component registry cleared.');
  }
}

// Create singleton instance
const registry = new ComponentRegistry();

// Export ONLY the registry singleton (remove duplicate BaseComponent export)
export default registry;

// REMOVED: export { BaseComponent }; - This was causing the duplicate export error
// BaseComponent should be imported directly from './BaseComponent.js' where needed