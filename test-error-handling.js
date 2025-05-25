// Simple test file to verify error handling works in both modes

console.log('🧪 Testing Error Handling Integration...');

// Wait for DOM and modules to load
setTimeout(() => {
    console.log('🔬 Starting error handling tests...');
    
    // Test 1: Backward compatibility (direct function calls)
    console.log('📋 Test 1: Direct function calls (backward compatibility)');
    if (window.showError && window.clearError) {
        console.log('✅ Direct functions available');
        
        // Test showing an error
        const elements = window.getElementRefs ? window.getElementRefs() : {};
        window.showError(elements, 'from-location', 'Test error message');
        
        // Test clearing after 2 seconds
        setTimeout(() => {
            window.clearError('from-location');
            console.log('✅ Direct error cleared');
        }, 2000);
    } else {
        console.log('❌ Direct functions not available');
    }
    
    // Test 2: Event-driven approach
    console.log('📋 Test 2: Event-driven approach');
    if (window.eventBus) {
        setTimeout(() => {
            // Test field error via events
            window.eventBus.emit('error:show', {
                fieldId: 'to-address',
                message: 'Test event-driven error',
                severity: 'warning',
                source: 'test'
            });
            
            // Test global error via events
            window.eventBus.emit('error:global', {
                message: 'Test global notification',
                severity: 'info',
                code: 'TEST_001',
                dismissable: true,
                source: 'test'
            });
            
            // Clear field error after 3 seconds
            setTimeout(() => {
                window.eventBus.emit('error:clear', {
                    fieldId: 'to-address',
                    source: 'test'
                });
                console.log('✅ Event-driven field error cleared');
            }, 3000);
            
            console.log('✅ Event-driven tests initiated');
        }, 3000);
    } else {
        console.log('❌ EventBus not available');
    }
    
    // Test 3: Global error severities
    console.log('📋 Test 3: Global error severities');
    setTimeout(() => {
        if (window.showGlobalError) {
            const severities = ['info', 'success', 'warning', 'error'];
            severities.forEach((severity, index) => {
                setTimeout(() => {
                    window.showGlobalError(
                        `Test ${severity} message`,
                        severity,
                        true,
                        `TEST_${severity.toUpperCase()}`
                    );
                }, index * 1000);
            });
            console.log('✅ Global error severity tests initiated');
        }
    }, 5000);
    
    console.log('🏁 All tests initiated - watch for results in console and UI');
    
}, 1000);