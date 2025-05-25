import { BaseComponent } from './BaseComponent.js';
import EventBus from './EventBus.js';
import DOMManager from './DOMManager.js';

/**
 * Component Registry class for managing all application components
 */
class ComponentRegistry {
  constructor() {
    this.components = new Map();
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
    const componentData = this.components.get(id);
    if (!componentData) {
      console.warn(`Component with ID "${id}" not found.`);
      return null;
    }
    const { ComponentClass, config } = componentData;
    const mergedConfig = { ...config, ...runtimeConfig };
    const instance = new ComponentClass(mergedConfig);
    instance.initialize();
    return instance;
  }

  /**
   * Initialize all registered components
   */
  async initializeAll() {
    for (const [id, { ComponentClass }] of this.components) {
      const instance = new ComponentClass();
      await instance.initialize();
    }
  }

  /**
   * Destroy all registered components
   */
  async destroyAll() {
    for (const [id, { ComponentClass }] of this.components) {
      const instance = new ComponentClass();
      await instance.destroy();
    }
  }
}

// Create singleton instance
const registry = new ComponentRegistry();

// Export the registry singleton and BaseComponent class
export default registry;