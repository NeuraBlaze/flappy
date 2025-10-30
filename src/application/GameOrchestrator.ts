/**
 * Application Orchestrator
 * Coordinates between domains and manages the overall game flow
 */

import { 
  BirdAdapter, 
  BirdSkinAdapter, 
  BirdAbilitiesAdapter 
} from '../domains/bird';
import { 
  GameStateAdapter, 
  GameLoopAdapter, 
  CollisionAdapter, 
  GameObjectsAdapter, 
  InputAdapter 
} from '../domains/game';
import {
  BiomeAdapter,
  WeatherAdapter,
  ParticleSystemAdapter,
  BackgroundAdapter
} from '../domains/environment';
import {
  AchievementAdapter,
  ScoreAdapter,
  StatsAdapter,
  LeaderboardAdapter,
  Achievement,
  GameStats
} from '../domains/scoring';
import {
  ShopAdapter,
  InventoryAdapter,
  TransactionAdapter,
  ShopItem,
  OwnedItem,
  EquippedItems,
  PurchaseResult
} from '../domains/shop';
import { BirdSkin, BirdAbilities, GameState, Biome } from '../shared/types';

export class GameOrchestrator {
  // Domain adapters
  private birdAdapter: BirdAdapter;
  private birdSkinAdapter: BirdSkinAdapter;
  private birdAbilitiesAdapter: BirdAbilitiesAdapter;
  private gameStateAdapter: GameStateAdapter;
  private gameLoopAdapter: GameLoopAdapter;
  private collisionAdapter: CollisionAdapter;
  private gameObjectsAdapter: GameObjectsAdapter;
  private inputAdapter: InputAdapter;
  
  // Environment adapters
  private biomeAdapter: BiomeAdapter;
  private weatherAdapter: WeatherAdapter;
  private particleSystemAdapter: ParticleSystemAdapter;
  private backgroundAdapter: BackgroundAdapter;

  // Scoring adapters
  private achievementAdapter: AchievementAdapter;
  private scoreAdapter: ScoreAdapter;
  private statsAdapter: StatsAdapter;
  private leaderboardAdapter: LeaderboardAdapter;

  // Shop adapters
  private shopAdapter: ShopAdapter;
  private inventoryAdapter: InventoryAdapter;
  private transactionAdapter: TransactionAdapter;

  // Game state
  private coins: number = 0;
  private gameStartTime: number = 0;

  // Achievement notifications
  private onAchievementUnlocked?: (achievement: Achievement) => void;

  constructor(
    availableSkins: BirdSkin[],
    defaultSkin: BirdSkin,
    defaultAbilities: BirdAbilities,
    availableBiomes: Biome[],
    defaultBiome: Biome
  ) {
    // Initialize domain adapters
    this.birdSkinAdapter = new BirdSkinAdapter(availableSkins, defaultSkin.id);
    this.birdAbilitiesAdapter = new BirdAbilitiesAdapter(defaultAbilities);
    this.birdAdapter = new BirdAdapter(defaultSkin, defaultAbilities);
    
    this.gameStateAdapter = new GameStateAdapter();
    this.gameLoopAdapter = new GameLoopAdapter();
    this.collisionAdapter = new CollisionAdapter();
    this.gameObjectsAdapter = new GameObjectsAdapter();
    this.inputAdapter = new InputAdapter();

    // Initialize environment adapters
    this.biomeAdapter = new BiomeAdapter(availableBiomes, defaultBiome);
    this.weatherAdapter = new WeatherAdapter('clear');
    this.particleSystemAdapter = new ParticleSystemAdapter();
    this.backgroundAdapter = new BackgroundAdapter();

    // Initialize scoring adapters
    this.achievementAdapter = new AchievementAdapter();
    this.scoreAdapter = new ScoreAdapter();
    this.statsAdapter = new StatsAdapter();
    this.leaderboardAdapter = new LeaderboardAdapter();

    // Initialize shop adapters
    this.shopAdapter = new ShopAdapter();
    this.inventoryAdapter = new InventoryAdapter();
    this.transactionAdapter = new TransactionAdapter();

    this.setupGameLoop();
    this.setupInputHandlers();
  }

  private setupGameLoop(): void {
    this.gameLoopAdapter.setUpdateCallback((deltaTime: number) => {
      this.update(deltaTime);
    });
  }

  private setupInputHandlers(): void {
    // Register jump handler
    this.inputAdapter.registerJumpHandler(() => {
      if (this.gameStateAdapter.isPlaying()) {
        this.birdAdapter.jump();
        this.statsAdapter.incrementStat('totalJumps');
      } else if (this.gameStateAdapter.isGameOver()) {
        this.restart();
      } else if (this.gameStateAdapter.getCurrentState() === GameState.MENU) {
        this.start();
      }
    });

    // Register pause handler
    this.inputAdapter.registerKeyHandler('p', () => {
      if (this.gameStateAdapter.isPlaying()) {
        this.pause();
      } else if (this.gameStateAdapter.isPaused()) {
        this.resume();
      }
    });

    // Register restart handler
    this.inputAdapter.registerKeyHandler('r', () => {
      this.restart();
    });

    // Register biome change handlers
    this.inputAdapter.registerKeyHandler('1', () => {
      this.changeBiome('forest');
    });
    this.inputAdapter.registerKeyHandler('2', () => {
      this.changeBiome('city');
    });
    this.inputAdapter.registerKeyHandler('3', () => {
      this.changeBiome('space');
    });
    this.inputAdapter.registerKeyHandler('4', () => {
      this.changeBiome('ocean');
    });

    // Register weather toggle handler
    this.inputAdapter.registerKeyHandler('w', () => {
      const weatherTypes = ['clear', 'rain', 'snow', 'fog', 'aurora'] as const;
      const currentWeather = this.weatherAdapter.getCurrentWeather();
      const currentIndex = weatherTypes.indexOf(currentWeather.type as any);
      const nextIndex = (currentIndex + 1) % weatherTypes.length;
      this.setWeather(weatherTypes[nextIndex]);
    });
  }

  private update(deltaTime: number): void {
    if (!this.gameStateAdapter.isPlaying()) return;

    // Update bird physics
    this.birdAdapter.update(deltaTime);

    // Update game objects
    this.gameObjectsAdapter.updatePipes(deltaTime);
    this.gameObjectsAdapter.updatePowerUps(deltaTime);
    this.gameObjectsAdapter.updateCoins(deltaTime);
    this.gameObjectsAdapter.updateParticles(deltaTime);

    // Update environment
    this.biomeAdapter.updateBiome(deltaTime);
    this.weatherAdapter.updateWeather(deltaTime);
    this.particleSystemAdapter.updateParticles(deltaTime);

    // Spawn environmental particles based on weather
    const weather = this.weatherAdapter.getCurrentWeather();
    if (weather.type === 'rain' && Math.random() < 0.1) {
      this.particleSystemAdapter.addParticles('rain', 3, { x: 900, y: 0 });
    } else if (weather.type === 'snow' && Math.random() < 0.05) {
      this.particleSystemAdapter.addParticles('snow', 2, { x: 900, y: 0 });
    }

    // Spawn new objects
    this.gameObjectsAdapter.spawnPipe();
    this.gameObjectsAdapter.spawnPowerUp();
    this.gameObjectsAdapter.spawnCoin();

    // Update collision system with current game objects
    this.collisionAdapter.setPipes(this.gameObjectsAdapter.getPipes());
    this.collisionAdapter.setPowerUps(this.gameObjectsAdapter.getPowerUps());
    this.collisionAdapter.setCoins(this.gameObjectsAdapter.getCoins());

    // Check collisions
    this.checkCollisions();
    this.checkScoring();
  }

  private checkCollisions(): void {
    const birdCollision = this.birdAdapter.getCollisionCircle();

    // Check bird vs environment collisions
    const collision = this.collisionAdapter.checkBirdCollisions(birdCollision);
    if (collision.hasCollision && !this.birdAbilitiesAdapter.hasShield()) {
      this.gameOver();
      return;
    }

    // Check power-up collisions
    const powerUpCollisions = this.collisionAdapter.checkPowerUpCollisions(birdCollision);
    powerUpCollisions.forEach(collision => {
      this.collectPowerUp(collision.type, collision.index);
    });

    // Check coin collisions
    const coinCollisions = this.collisionAdapter.checkCoinCollisions(birdCollision);
    coinCollisions.forEach(collision => {
      this.collectCoin(collision.value, collision.index);
    });
  }

  private checkScoring(): void {
    const birdX = this.birdAdapter.getPosition().x;
    const pipes = this.gameObjectsAdapter.getPipes();

    pipes.forEach(pipe => {
      if (pipe.canScore(birdX)) {
        pipe.markAsPassed();
        this.scoreAdapter.addScore(1);
        this.statsAdapter.incrementStat('pipesCleared');
        this.checkAchievements();
      }
    });
  }

  private collectPowerUp(type: string, index: number): void {
    this.gameObjectsAdapter.collectPowerUp(index);
    
    switch (type) {
      case 'shield':
        this.birdAbilitiesAdapter.activateShield(5); // 5 seconds
        this.activateShield();
        break;
      case 'slow':
        this.gameObjectsAdapter.setGameSpeed(1); // Slow down
        setTimeout(() => this.gameObjectsAdapter.setGameSpeed(2), 3000);
        this.usePowerUp();
        break;
      case 'score':
        this.scoreAdapter.addScore(5);
        this.usePowerUp();
        break;
      // Add other power-up effects...
    }
  }

  private collectCoin(value: number, index: number): void {
    this.gameObjectsAdapter.collectCoin(index);
    this.coins += value;
    this.statsAdapter.incrementStat('coinsCollected');
    this.checkAchievements();
  }

  // Public game control methods
  start(): void {
    this.gameStateAdapter.startGame();
    this.gameLoopAdapter.start();
  }

  pause(): void {
    this.gameStateAdapter.pauseGame();
    this.gameLoopAdapter.pause();
  }

  resume(): void {
    this.gameStateAdapter.resumeGame();
    this.gameLoopAdapter.resume();
  }

  restart(): void {
    // Reset all adapters
    this.birdAdapter.reset();
    this.gameObjectsAdapter.clearAllObjects();
    this.birdAbilitiesAdapter.resetModifiers();
    
    // Reset game state
    this.scoreAdapter.resetScore();
    
    // Restart game
    this.gameStateAdapter.restartGame();
    this.gameLoopAdapter.start();
  }

  gameOver(): void {
    this.gameStateAdapter.endGame();
    this.gameLoopAdapter.stop();
  }

  stop(): void {
    this.gameLoopAdapter.stop();
    this.inputAdapter.destroy();
  }

  // Getters for UI
  getBird() {
    return this.birdAdapter.getBird();
  }

  getGameState() {
    return this.gameStateAdapter.getCurrentState();
  }

  getGameObjects() {
    return {
      pipes: this.gameObjectsAdapter.getPipes(),
      powerUps: this.gameObjectsAdapter.getPowerUps(),
      coins: this.gameObjectsAdapter.getCoins(),
      particles: this.gameObjectsAdapter.getParticles()
    };
  }

  getScore(): number {
    return this.scoreAdapter.getCurrentScore();
  }

  getCoins(): number {
    return this.coins;
  }

  getCurrentSkin(): BirdSkin {
    return this.birdSkinAdapter.getCurrentSkin();
  }

  getAvailableSkins(): BirdSkin[] {
    return this.birdSkinAdapter.getAvailableSkins();
  }

  changeSkin(skinId: string): void {
    this.birdSkinAdapter.setSkin(skinId);
    const newSkin = this.birdSkinAdapter.getCurrentSkin();
    this.birdAdapter.getBird().setSkin(newSkin);
  }

  getFPS(): number {
    return this.gameLoopAdapter.getCurrentFPS();
  }

  // Environment getters
  getCurrentBiome(): Biome {
    return this.biomeAdapter.getCurrentBiome();
  }

  changeBiome(biomeId: string): void {
    this.biomeAdapter.setBiome(biomeId);
  }

  getCurrentWeather() {
    return this.weatherAdapter.getCurrentWeather();
  }

  setWeather(weather: 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'aurora'): void {
    this.weatherAdapter.setWeather(weather);
  }

  getEnvironmentParticles() {
    return this.particleSystemAdapter.getParticles();
  }

  getBackgroundAdapter() {
    return this.backgroundAdapter;
  }

  // Scoring system methods
  setAchievementCallback(callback: (achievement: Achievement) => void): void {
    this.onAchievementUnlocked = callback;
  }

  getHighScore(): number {
    return this.scoreAdapter.getHighScore();
  }

  getStats(): GameStats {
    return this.statsAdapter.getStats();
  }

  getAchievements(): Achievement[] {
    return this.achievementAdapter.getAchievements();
  }

  getLeaderboard(): any[] {
    return this.leaderboardAdapter.getTopScores();
  }

  usePowerUp(): void {
    this.statsAdapter.incrementStat('powerUpsUsed');
    this.checkAchievements();
  }

  activateShield(): void {
    this.statsAdapter.incrementStat('shieldActivations');
    this.checkAchievements();
  }

  private checkAchievements(): void {
    const stats = this.statsAdapter.getStats();
    const newAchievements = this.achievementAdapter.checkAchievements(stats);
    
    newAchievements.forEach(achievementId => {
      const achievement = this.achievementAdapter.getAchievements()
        .find(a => a.id === achievementId);
      
      if (achievement && this.onAchievementUnlocked) {
        this.onAchievementUnlocked(achievement);
        
        // Award coins for achievement
        if (achievement.reward?.coins) {
          this.coins += achievement.reward.coins;
        }
      }
    });
  }

  // Shop system methods
  getShopItems(): ShopItem[] {
    return this.shopAdapter.getAvailableItems();
  }

  getShopItemsByCategory(category: any): ShopItem[] {
    return this.shopAdapter.getItemsByCategory(category);
  }

  getOwnedItems(): OwnedItem[] {
    return this.inventoryAdapter.getOwnedItems();
  }

  getEquippedItems(): EquippedItems {
    return this.inventoryAdapter.getEquippedItems();
  }

  purchaseItem(itemId: string): PurchaseResult {
    const hasItem = this.inventoryAdapter.hasItem(itemId);
    const playerStats = {
      ...this.statsAdapter.getStats(),
      unlockedAchievements: this.achievementAdapter.getAchievements()
        .filter(a => a.unlocked)
        .map(a => a.id)
    };

    const result = this.shopAdapter.purchaseItem(itemId, this.coins, hasItem, playerStats);
    
    if (result.success && result.item && result.newBalance !== undefined) {
      // Deduct coins
      this.coins = result.newBalance;
      
      // Add to inventory
      const ownedItem: OwnedItem = {
        itemId: result.item.id,
        purchaseDate: Date.now(),
        purchasePrice: result.item.price,
        timesUsed: 0,
        isEquipped: false
      };
      this.inventoryAdapter.addItem(ownedItem);

      // Check for new achievements after purchase
      this.checkAchievements();
    }

    return result;
  }

  equipItem(itemId: string, slot: any): boolean {
    const success = this.inventoryAdapter.equipItem(itemId, slot);
    
    if (success) {
      // Apply item effects here based on the equipped item
      this.applyItemEffects(itemId);
    }
    
    return success;
  }

  unequipItem(slot: any): boolean {
    const currentItem = this.inventoryAdapter.getEquippedItem(slot);
    const success = this.inventoryAdapter.unequipItem(slot);
    
    if (success && currentItem) {
      // Remove item effects
      this.removeItemEffects(currentItem);
    }
    
    return success;
  }

  private applyItemEffects(itemId: string): void {
    const item = this.shopAdapter.getAvailableItems().find(i => i.id === itemId);
    if (!item?.effects) return;

    item.effects.forEach(effect => {
      switch (effect.type) {
        case 'stat_boost':
          this.applyStatBoost(effect.property, effect.value as number);
          break;
        case 'visual_effect':
          this.applyVisualEffect(effect.property, effect.value as string);
          break;
        case 'gameplay_modifier':
          this.applyGameplayModifier(effect.property, effect.value);
          break;
      }
    });
  }

  private removeItemEffects(itemId: string): void {
    const item = this.shopAdapter.getAvailableItems().find(i => i.id === itemId);
    if (!item?.effects) return;

    item.effects.forEach(effect => {
      switch (effect.type) {
        case 'stat_boost':
          this.removeStatBoost(effect.property);
          break;
        case 'visual_effect':
          this.removeVisualEffect(effect.property);
          break;
        case 'gameplay_modifier':
          this.removeGameplayModifier(effect.property);
          break;
      }
    });
  }

  private applyStatBoost(property: string, value: number): void {
    switch (property) {
      case 'jump_power':
        this.birdAbilitiesAdapter.applySpeedModifier(value);
        break;
      case 'gravity':
        // For now, we'll use the speed modifier to affect overall bird behavior
        this.birdAbilitiesAdapter.applySpeedModifier(value);
        break;
    }
  }

  private removeStatBoost(property: string): void {
    // Reset modifiers
    this.birdAbilitiesAdapter.resetModifiers();
  }

  private applyVisualEffect(property: string, value: string): void {
    // Apply visual effects like trails, particles, etc.
    // This would integrate with the environment/particle system
    console.log(`Applied visual effect: ${property} = ${value}`);
  }

  private removeVisualEffect(property: string): void {
    // Remove visual effects
    console.log(`Removed visual effect: ${property}`);
  }

  private applyGameplayModifier(property: string, value: any): void {
    // Apply gameplay modifiers
    switch (property) {
      case 'shield_duration':
        // This would integrate with the shield system
        break;
      case 'game_speed':
        this.gameObjectsAdapter.setGameSpeed(value);
        break;
    }
  }

  private removeGameplayModifier(property: string): void {
    // Remove gameplay modifiers
    switch (property) {
      case 'game_speed':
        this.gameObjectsAdapter.setGameSpeed(2); // Reset to default
        break;
    }
  }

  // Spend coins for items or services
  spendCoins(amount: number): boolean {
    if (this.coins >= amount) {
      this.coins -= amount;
      return true;
    }
    return false;
  }

  // Add coins (for testing or special events)
  addCoins(amount: number): void {
    this.coins += amount;
  }

  // Public method for touch/click jumping
  handleJump(): void {
    if (this.gameStateAdapter.isPlaying()) {
      this.birdAdapter.jump();
      this.statsAdapter.incrementStat('totalJumps');
    } else if (this.gameStateAdapter.isGameOver()) {
      this.restart();
    } else if (this.gameStateAdapter.getCurrentState() === GameState.MENU) {
      this.start();
    }
  }

  // Check if game is playing (for UI)
  isPlaying(): boolean {
    return this.gameStateAdapter.isPlaying();
  }
}