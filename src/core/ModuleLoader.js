/**
 * ModuleLoader - Handles the dynamic loading and initialization of modules
 * with dependency resolution, startup sequence management, and error handling
 */
import eventBus from './EventBus.js';

export class ModuleLoader {
  constructor() {
    this.modules = new Map();
    this.initializedModules = new Set();
    this.startupSequence = [];
    this.isStarted = false;
  }

  /**
   * Register a module with the loader
   * @param {string} name - Module identifier
   * @param {Object} module - The module object with init and destroy methods
   * @param {Array<string>} dependencies - Array of module names this module depends on
   * @param {number} priority - Startup priority (lower numbers start first)
   * @returns {ModuleLoader} - Returns self for chaining
   */
  register(name, module, dependencies = [], priority = 100) {
    if (this.modules.has(name)) {
      console.warn(`Module '${name}' is already registered. Skipping.`);
      return this;
    }
    
    this.modules.set(name, {
      name,
      module,
      dependencies, 
      priority,
      instance: null
    });
    
    // Reset startup sequence as we have a new module
    this._buildStartupSequence();
    
    return this;
  }

  /**
   * Start all registered modules in the correct dependency order
   * @param {Object} config - Configuration object passed to all modules
   * @returns {Promise<boolean>} - Resolves when all modules are started
   */
  async start(config = {}) {
    if (this.isStarted) {
      console.warn('ModuleLoader is already started');
      return true;
    }
    
    this.isStarted = true;
    
    try {
      // If startup sequence is not built or invalidated, rebuild it
      if (this.startupSequence.length === 0) {
        this._buildStartupSequence();
      }
      
      // Start each module in sequence
      for (const moduleName of this.startupSequence) {
        const moduleInfo = this.modules.get(moduleName);
        
        if (!moduleInfo) continue;
        
        // Ensure all dependencies are initialized
        const allDepsInitialized = moduleInfo.dependencies.every(dep => 
          this.initializedModules.has(dep)
        );
        
        if (!allDepsInitialized) {
          throw new Error(`Cannot start module '${moduleName}' as not all dependencies are initialized.`);
        }
        
        // Initialize the module
        try {
          const instance = moduleInfo.module.init ? 
            await moduleInfo.module.init(config) : 
            moduleInfo.module;
          
          moduleInfo.instance = instance;
          this.initializedModules.add(moduleName);
          
          // Publish module initialized event
          eventBus.publish('moduleLoader.moduleInitialized', {
            name: moduleName,
            instance
          });
        } catch (error) {
          console.error(`Failed to initialize module '${moduleName}':`, error);
          throw error;
        }
      }
      
      eventBus.publish('moduleLoader.allModulesInitialized', {
        moduleNames: Array.from(this.initializedModules)
      });
      
      return true;
    } catch (error) {
      this.isStarted = false;
      console.error('ModuleLoader start failed:', error);
      throw error;
    }
  }

  /**
   * Stop all modules in reverse dependency order
   * @returns {Promise<boolean>} - Resolves when all modules are stopped
   */
  async stop() {
    if (!this.isStarted) {
      return true;
    }
    
    try {
      // Stop modules in reverse order
      for (const moduleName of [...this.startupSequence].reverse()) {
        if (this.initializedModules.has(moduleName)) {
          const moduleInfo = this.modules.get(moduleName);
          
          if (moduleInfo?.instance && moduleInfo.module.destroy) {
            try {
              await moduleInfo.module.destroy(moduleInfo.instance);
            } catch (error) {
              console.error(`Error shutting down module '${moduleName}':`, error);
            }
          }
          
          this.initializedModules.delete(moduleName);
          
          // Publish module destroyed event
          eventBus.publish('moduleLoader.moduleDestroyed', {
            name: moduleName
          });
        }
      }
      
      this.isStarted = false;
      eventBus.publish('moduleLoader.allModulesStopped', {});
      return true;
    } catch (error) {
      console.error('ModuleLoader stop failed:', error);
      throw error;
    }
  }

  /**
   * Get an initialized module instance by name
   * @param {string} name - The module name
   * @returns {Object|null} - The module instance or null
   */
  get(name) {
    const moduleInfo = this.modules.get(name);
    return moduleInfo && this.initializedModules.has(name) ? 
      moduleInfo.instance : null;
  }

  /**
   * Build the startup sequence based on dependencies and priorities
   * @private
   */
  _buildStartupSequence() {
    // Reset the sequence
    this.startupSequence = [];
    
    // Create a working copy of modules to process
    const unprocessed = new Map(this.modules);
    
    // Keep track of modules that depend on each module
    const dependents = new Map();
    
    // Initialize the dependents map
    for (const [name, info] of this.modules.entries()) {
      for (const dep of info.dependencies) {
        if (!dependents.has(dep)) {
          dependents.set(dep, new Set());
        }
        dependents.get(dep).add(name);
      }
    }
    
    // Process modules without dependencies first, then by priority
    while (unprocessed.size > 0) {
      const batch = [];
      
      for (const [name, info] of unprocessed.entries()) {
        // Check if all dependencies are already in the startup sequence
        const missingDeps = info.dependencies.filter(
          dep => unprocessed.has(dep) && !this.modules.has(dep)
        );
        
        if (missingDeps.length > 0) {
          console.warn(`Module '${name}' depends on missing modules: ${missingDeps.join(', ')}`);
          continue;
        }
        
        // If all dependencies are processed or this module has no dependencies
        const allDepsProcessed = info.dependencies.every(
          dep => !unprocessed.has(dep) || this.startupSequence.includes(dep)
        );
        
        if (allDepsProcessed) {
          batch.push({ name, priority: info.priority });
        }
      }
      
      if (batch.length === 0) {
        // Circular dependency or missing dependency detected
        const remaining = Array.from(unprocessed.keys());
        console.error(`Circular dependency detected among modules: ${remaining.join(', ')}`);
        throw new Error(`Circular dependency detected among modules: ${remaining.join(', ')}`);
      }
      
      // Sort the batch by priority
      batch.sort((a, b) => a.priority - b.priority);
      
      // Add sorted batch to startup sequence and remove from unprocessed
      for (const { name } of batch) {
        this.startupSequence.push(name);
        unprocessed.delete(name);
      }
    }
    
    return this.startupSequence;
  }
}

// Export a singleton instance
const moduleLoader = new ModuleLoader();
export default moduleLoader;
