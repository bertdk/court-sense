import { test, expect } from '@playwright/test';

test.describe('Pass Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Create a new game
    await page.click('text=Create New Game');
    
    // Wait for game setup page
    await page.waitForURL(/\/game\/\d+\/setup/);
    
    // Fill in team name
    await page.fill('input[placeholder="Enter team name"]', 'Test Team');
    
    // Add a player
    await page.fill('input[placeholder="Enter player name"]', 'Player 1');
    await page.click('text=Add Player');
    
    // Add another player
    await page.fill('input[placeholder="Enter player name"]', 'Player 2');
    await page.click('text=Add Player');
    
    // Start the game
    await page.click('text=Start Game');
    
    // Wait for game mode
    await page.waitForURL(/\/game\/\d+\/play/);
  });

  test('pass buttons should be enabled when clock is running', async ({ page }) => {
    // Start the clock
    await page.click('text=Start');
    
    // Wait a moment for clock to start
    await page.waitForTimeout(500);
    
    // Check that pass buttons are enabled
    const passIncrementButton = page.locator('button:has-text("+")').filter({ hasText: /^\+$/ }).first();
    const passDecrementButton = page.locator('button:has-text("−")').filter({ hasText: /^−$/ }).first();
    
    await expect(passIncrementButton).toBeEnabled();
    await expect(passDecrementButton).toBeEnabled();
    
    // Verify initial pass count is 0
    const passCount = page.locator('.passes-count');
    await expect(passCount).toHaveText('0');
    
    // Click increment button
    await passIncrementButton.click();
    
    // Verify pass count increased to 1
    await expect(passCount).toHaveText('1');
    
    // Click increment again
    await passIncrementButton.click();
    
    // Verify pass count increased to 2
    await expect(passCount).toHaveText('2');
    
    // Click decrement button
    await passDecrementButton.click();
    
    // Verify pass count decreased to 1
    await expect(passCount).toHaveText('1');
    
    // Click decrement again
    await passDecrementButton.click();
    
    // Verify pass count decreased to 0
    await expect(passCount).toHaveText('0');
    
    // Verify decrement button is disabled at 0
    await expect(passDecrementButton).toBeDisabled();
  });

  test('pass buttons should work correctly during active offense', async ({ page }) => {
    // Start the clock
    await page.click('text=Start');
    
    // Wait for clock to be running
    await page.waitForTimeout(500);
    
    // Verify clock is running (time should be > 0 after a moment)
    const timeDisplay = page.locator('.clock-time');
    await page.waitForTimeout(1500); // Wait 1.5 seconds
    
    // Increment passes multiple times while clock is running
    const passIncrementButton = page.locator('button:has-text("+")').filter({ hasText: /^\+$/ }).first();
    const passCount = page.locator('.passes-count');
    
    for (let i = 0; i < 5; i++) {
      await passIncrementButton.click();
      await expect(passCount).toHaveText(String(i + 1));
    }
    
    // Verify we can decrement while clock is running
    const passDecrementButton = page.locator('button:has-text("−")').filter({ hasText: /^−$/ }).first();
    
    await passDecrementButton.click();
    await expect(passCount).toHaveText('4');
    
    await passDecrementButton.click();
    await expect(passCount).toHaveText('3');
  });

  test('pass count should persist when clock is paused', async ({ page }) => {
    // Start the clock
    await page.click('text=Start');
    await page.waitForTimeout(500);
    
    // Increment passes
    const passIncrementButton = page.locator('button:has-text("+")').filter({ hasText: /^\+$/ }).first();
    const passCount = page.locator('.passes-count');
    
    await passIncrementButton.click();
    await passIncrementButton.click();
    await passIncrementButton.click();
    await expect(passCount).toHaveText('3');
    
    // Pause the clock
    await page.click('text=Pause');
    
    // Verify pass count is still 3
    await expect(passCount).toHaveText('3');
    
    // Pass buttons should still work when paused
    await passIncrementButton.click();
    await expect(passCount).toHaveText('4');
  });
});

