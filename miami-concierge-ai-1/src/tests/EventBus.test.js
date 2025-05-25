import { eventBus } from '../core/EventBus';

describe('EventBus', () => {
  let callback;
  let unsubscribe;

  beforeEach(() => {
    callback = jest.fn();
    unsubscribe = eventBus.on('test:event', callback);
  });

  afterEach(() => {
    eventBus.off('test:event', callback);
  });

  test('should subscribe to an event', () => {
    eventBus.emit('test:event', { data: 'test data' });
    expect(callback).toHaveBeenCalledWith({ data: 'test data' });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should unsubscribe from an event', () => {
    unsubscribe();
    eventBus.emit('test:event', { data: 'test data' });
    expect(callback).not.toHaveBeenCalled();
  });

  test('should emit an event with data', () => {
    const data = { key: 'value' };
    eventBus.emit('test:event', data);
    expect(callback).toHaveBeenCalledWith(data);
  });

  test('should handle errors in event handlers', () => {
    const errorCallback = jest.fn(() => {
      throw new Error('Test error');
    });
    eventBus.on('error:event', errorCallback);
    eventBus.emit('error:event', { data: 'error data' });
    expect(errorCallback).toHaveBeenCalled();
  });

  test('should allow one-time event subscription', () => {
    const oneTimeCallback = jest.fn();
    eventBus.once('one-time:event', oneTimeCallback);
    eventBus.emit('one-time:event', { data: 'one-time data' });
    expect(oneTimeCallback).toHaveBeenCalledWith({ data: 'one-time data' });
    expect(oneTimeCallback).toHaveBeenCalledTimes(1);

    // Emit again to ensure it does not get called
    eventBus.emit('one-time:event', { data: 'should not call' });
    expect(oneTimeCallback).toHaveBeenCalledTimes(1);
  });
});