// This file contains the implementation of the EventBus, which is used for event-driven communication within the application. It provides methods to emit and listen for events.

class EventBus {
    constructor() {
        this.listeners = {};
    }

    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(data));
        }
    }

    off(event, listener) {
        if (!this.listeners[event]) return;

        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
}

const eventBus = new EventBus();
export default eventBus;