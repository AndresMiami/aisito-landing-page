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
    const instance = new ComponentClass({ ...config, ...runtimeConfig });

    this.instances.set(id, instance);
    instance.initialize();
    return instance;
  }

  clear() {
    this.instances.clear();
    this.components.clear();
    console.log('Component registry cleared.');
  }
}

const registry = new ComponentRegistry();
export default registry;