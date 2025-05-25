import EventBus from '../../src/core/EventBus.js';
import { EVENTS } from '../../src/core/EventDefinitions.js';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  test('should register an event listener', () => {
    const callback = jest.fn();
    eventBus.on(EVENTS.FORM.SUBMIT, callback);
    
    eventBus.emit(EVENTS.FORM.SUBMIT);
    
    expect(callback).toHaveBeenCalled();
  });

  test('should emit an event with data', () => {
    const callback = jest.fn();
    eventBus.on(EVENTS.FORM.SUBMIT, callback);
    
    const data = { test: 'data' };
    eventBus.emit(EVENTS.FORM.SUBMIT, data);
    
    expect(callback).toHaveBeenCalledWith(data);
  });

  test('should remove an event listener', () => {
    const callback = jest.fn();
    eventBus.on(EVENTS.FORM.SUBMIT, callback);
    eventBus.off(EVENTS.FORM.SUBMIT, callback);
    
    eventBus.emit(EVENTS.FORM.SUBMIT);
    
    expect(callback).not.toHaveBeenCalled();
  });

  test('should handle multiple listeners for the same event', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    eventBus.on(EVENTS.FORM.SUBMIT, callback1);
    eventBus.on(EVENTS.FORM.SUBMIT, callback2);
    
    eventBus.emit(EVENTS.FORM.SUBMIT);
    
    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  test('should not call removed listener', () => {
    const callback = jest.fn();
    eventBus.on(EVENTS.FORM.SUBMIT, callback);
    eventBus.off(EVENTS.FORM.SUBMIT, callback);
    
    eventBus.emit(EVENTS.FORM.SUBMIT);
    
    expect(callback).not.toHaveBeenCalled();
  });
});