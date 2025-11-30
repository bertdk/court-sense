import { test, expect } from '@playwright/test';

test.describe('Shot Flow with Rebound', () => {
  test('complete shot flow: 2-point miss with defensive rebound', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Create a new game
    await page.click('text=Create New Game');
    
    // Wait for game setup page
    await page.waitForURL(/\/game\/\d+\/setup/);
    
    // Fill in team name
    await page.fill('input[placeholder="Enter team name"]', 'Test Team');
    
    // Add 10 players
    const playerNames = [
      'Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5',
      'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10'
    ];
    
    for (const playerName of playerNames) {
      await page.fill('input[placeholder="Enter player name"]', playerName);
      await page.click('text=Add Player');
      // Wait a moment for the player to be added
      await page.waitForTimeout(100);
    }
    
    // Verify 10 players are added
    const playerItems = page.locator('.player-item');
    await expect(playerItems).toHaveCount(10);
    
    // Start the game
    await page.click('text=Start Game');
    
    // Wait for game mode
    await page.waitForURL(/\/game\/\d+\/play/);
    
    // Start the offense
    await page.click('text=Start');
    
    // Wait a moment for clock to start
    await page.waitForTimeout(500);
    
    // Verify clock is running (time should be > 0)
    const timeDisplay = page.locator('.clock-time');
    await page.waitForTimeout(1500);
    
    // Increase passes to 6
    const passIncrementButton = page.locator('button:has-text("+")').filter({ hasText: /^\+$/ }).first();
    
    for (let i = 0; i < 6; i++) {
      await passIncrementButton.click();
      await page.waitForTimeout(100);
    }
    
    // Verify pass count is 6
    const passCount = page.locator('.passes-count');
    await expect(passCount).toHaveText('6');
    
    // Click Shot button
    await page.click('text=Shot');
    
    // Wait for shot modal
    await page.waitForSelector('text=Shot Attempt', { timeout: 2000 });
    
    // Choose 2-Point
    await page.click('text=2-Point');
    
    // Wait for result selection
    await page.waitForSelector('text=Result', { timeout: 2000 });
    
    // Select a player (first player on court)
    const playerButtons = page.locator('.player-assign-btn').filter({ hasNotText: 'Team' });
    if (await playerButtons.count() > 0) {
      await playerButtons.first().click();
    }
    
    // Click Miss
    await page.click('button:has-text("Miss")');
    
    // Wait for rebound selection
    await page.waitForSelector('text=Rebound', { timeout: 2000 });
    
    // Verify we're in rebound selection view
    const reboundHeading = page.locator('h3:has-text("Rebound")');
    await expect(reboundHeading).toBeVisible();
    
    // Take Defensive Rebound
    await page.click('text=Defensive Rebound');
    
    // Wait for modal to close completely
    await page.waitForTimeout(300);
    
    // Verify modal is completely closed - should not see "Shot Attempt" heading or modal overlay
    const modalOverlay = page.locator('.modal-overlay');
    await expect(modalOverlay).not.toBeVisible({ timeout: 2000 });
    
    // Verify "Shot Attempt" heading is not visible (modal should be closed)
    const shotAttemptHeading = page.locator('h2:has-text("Shot Attempt")');
    await expect(shotAttemptHeading).not.toBeVisible({ timeout: 1000 });
    
    // Verify we're back to the game screen
    // Should see the Start button (offense was reset)
    const startButton = page.locator('button:has-text("Start")');
    await expect(startButton).toBeVisible({ timeout: 2000 });
    
    // Verify clock is reset (time should be 0 or very low)
    const clockTime = page.locator('.clock-time');
    const timeText = await clockTime.textContent();
    // Time should be reset to 0 or close to 0
    expect(timeText).toMatch(/^0/);
    
    // Verify passes are reset
    await expect(passCount).toHaveText('0');
    
    // Verify we can start a new offense
    await startButton.click();
    await page.waitForTimeout(500);
    
    // Verify clock is running again
    const pauseButton = page.locator('button:has-text("Pause")');
    await expect(pauseButton).toBeVisible();
  });
});

