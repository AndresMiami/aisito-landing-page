const { test, expect } = require('@playwright/test');

test.describe('Example Test Suite', () => {
    test('should verify functionality', async ({ page }) => {
        await page.goto('https://example.com');
        const title = await page.title();
        expect(title).toBe('Example Domain');
    });
});