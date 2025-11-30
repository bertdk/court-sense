import { test, expect } from '@playwright/test';

test.describe('Team Merging Functionality', () => {
  test('teams with same name should merge all players', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Step 1: Create first game with MyTeam and 6 players
    await page.click('text=Create New Game');
    await page.waitForURL(/\/game\/\d+\/setup/);
    
    // Fill in team name
    await page.fill('input[placeholder="Enter team name"]', 'MyTeam');
    
    // Add 6 players
    const firstGamePlayers = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6'];
    for (const playerName of firstGamePlayers) {
      await page.fill('input[placeholder="Enter player name"]', playerName);
      await page.click('text=Add Player');
      await page.waitForTimeout(100);
    }
    
    // Verify 6 players are added
    const playerItems1 = page.locator('.player-item');
    await expect(playerItems1).toHaveCount(6);
    
    // Start the game
    await page.click('text=Start Game');
    await page.waitForURL(/\/game\/\d+\/play/);
    
    // Step 2: Go to home menu
    await page.click('text=Home');
    await page.waitForURL('/');
    
    // Step 3: Create a new game and select MyTeam
    await page.click('text=Create New Game');
    
    // Wait for team selection modal (if it appears) or go directly to setup
    const modalVisible = await page.locator('.modal-overlay').isVisible().catch(() => false);
    
    if (modalVisible) {
      // Select MyTeam from dropdown
      await page.selectOption('select', 'MyTeam');
      await page.click('text=Use Selected Team');
    }
    
    // Wait for game setup page
    await page.waitForURL(/\/game\/\d+\/setup/, { timeout: 5000 });
    
    // Verify team name is MyTeam
    const teamNameInput = page.locator('input[placeholder="Enter team name"]');
    await expect(teamNameInput).toHaveValue('MyTeam');
    
    // Verify all 6 players are prefilled
    const playerItems2 = page.locator('.player-item');
    await expect(playerItems2).toHaveCount(6);
    
    // Step 4: Adjust player list - remove 2 players and add 2 new players
    // Remove first player
    await page.locator('.player-item').first().locator('button:has-text("×")').click();
    await page.waitForTimeout(200);
    
    // Remove second player
    await page.locator('.player-item').first().locator('button:has-text("×")').click();
    await page.waitForTimeout(200);
    
    // Add 2 new players
    await page.fill('input[placeholder="Enter player name"]', 'New Player 7');
    await page.click('text=Add Player');
    await page.waitForTimeout(200);
    
    await page.fill('input[placeholder="Enter player name"]', 'New Player 8');
    await page.click('text=Add Player');
    await page.waitForTimeout(200);
    
    // Verify we now have 6 players (6 original - 2 removed + 2 new = 6 total)
    const playerItems3 = page.locator('.player-item');
    await expect(playerItems3).toHaveCount(6);
    
    // Start the game
    await page.click('text=Start Game');
    await page.waitForURL(/\/game\/\d+\/play/);
    
    // Step 5: Go to home menu again
    await page.click('text=Home');
    await page.waitForURL('/');
    
    // Step 6: Create a new game and check existing teams
    await page.click('text=Create New Game');
    
    // Wait for team selection modal
    await page.waitForSelector('.modal-overlay', { timeout: 2000 });
    
    // Check that there's only 1 team "MyTeam" in the dropdown
    const select = page.locator('select');
    const options = await select.locator('option').allTextContents();
    const myTeamOptions = options.filter(opt => opt === 'MyTeam');
    expect(myTeamOptions.length).toBe(1); // Should appear only once
    
    // Select MyTeam
    await page.selectOption('select', 'MyTeam');
    await page.click('text=Use Selected Team');
    
    // Wait for game setup
    await page.waitForURL(/\/game\/\d+\/setup/);
    
    // Verify team name
    await expect(teamNameInput).toHaveValue('MyTeam');
    
    // Verify all players from previous steps are present
    // Should have: Player 3, Player 4, Player 5, Player 6 (from first game, after removing 1 and 2)
    //              New Player 7, New Player 8 (from second game)
    // Total: 6 players (merged from both games)
    
    const allPlayerNames = await page.locator('.player-name').allTextContents();
    
    // Check for original players (3-6) from first game
    expect(allPlayerNames).toContain('Player 3');
    expect(allPlayerNames).toContain('Player 4');
    expect(allPlayerNames).toContain('Player 5');
    expect(allPlayerNames).toContain('Player 6');
    
    // Check for new players from second game
    expect(allPlayerNames).toContain('New Player 7');
    expect(allPlayerNames).toContain('New Player 8');
    
    // Verify total count is 6 (merged from both games)
    const finalPlayerItems = page.locator('.player-item');
    await expect(finalPlayerItems).toHaveCount(6);
  });
});

