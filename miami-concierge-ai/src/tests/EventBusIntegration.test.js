import { eventBus } from '../core/EventBus';
import { showError, clearError } from '../events/FormEvents';
import { validateForm } from '../events/ValidationEvents';

describe('EventBus Integration Tests', () => {
    let errorMessage;

    beforeEach(() => {
        errorMessage = '';
        eventBus.on('error:show', ({ message }) => {
            errorMessage = message;
        });
    });

    afterEach(() => {
        errorMessage = '';
        clearError('from-location');
        clearError('to-address');
    });

    test('should show error when form validation fails', () => {
        const invalidData = { fromLocation: '', toAddress: '' };
        validateForm(invalidData);

        expect(errorMessage).toBe('Please enter a "From" location.');
    });

    test('should clear error when field is corrected', () => {
        const invalidData = { fromLocation: '', toAddress: '' };
        validateForm(invalidData);
        expect(errorMessage).toBe('Please enter a "From" location.');

        clearError('from-location');
        expect(errorMessage).toBe('');
    });

    test('should emit global error event', () => {
        const globalErrorMessage = 'Global error occurred';
        eventBus.emit('error:global', { message: globalErrorMessage });

        expect(errorMessage).toBe(globalErrorMessage);
    });

    test('should handle multiple event subscriptions', () => {
        let secondErrorMessage = '';
        eventBus.on('error:show', ({ message }) => {
            secondErrorMessage = message;
        });

        const invalidData = { fromLocation: '', toAddress: '' };
        validateForm(invalidData);

        expect(errorMessage).toBe('Please enter a "From" location.');
        expect(secondErrorMessage).toBe('Please enter a "From" location.');
    });
});