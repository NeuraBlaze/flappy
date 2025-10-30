/**
 * Shop Domain - Models
 * Core shop entities and business logic
 */

import { 
  ShopItem, 
  OwnedItem, 
  EquippedItems, 
  Transaction, 
  PurchaseResult, 
  TransactionResult, 
  ValidationResult,
  ItemCategory,
  EquipmentSlot,
  ItemEffect
} from './ports';

/**
 * Shop Catalog Model - Manages available items and shop logic
 */
export class ShopCatalogModel {
  private items: Map<string, ShopItem> = new Map();

  constructor(initialItems: ShopItem[] = []) {
    initialItems.forEach(item => this.addItem(item));
  }

  addItem(item: ShopItem): void {
    this.items.set(item.id, item);
  }

  removeItem(itemId: string): boolean {
    return this.items.delete(itemId);
  }

  getItem(itemId: string): ShopItem | undefined {
    return this.items.get(itemId);
  }

  getAllItems(): ShopItem[] {
    return Array.from(this.items.values());
  }

  getItemsByCategory(category: ItemCategory): ShopItem[] {
    return this.getAllItems().filter(item => item.category === category);
  }

  getItemsByRarity(rarity: string): ShopItem[] {
    return this.getAllItems().filter(item => item.rarity === rarity);
  }

  searchItems(query: string): ShopItem[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllItems().filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery) ||
      item.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  isItemAvailable(itemId: string, playerStats?: any): boolean {
    const item = this.getItem(itemId);
    if (!item) return false;

    // Check unlock requirements
    if (item.unlockRequirement && playerStats) {
      return this.checkUnlockRequirement(item.unlockRequirement, playerStats);
    }

    return true;
  }

  private checkUnlockRequirement(requirement: any, playerStats: any): boolean {
    switch (requirement.type) {
      case 'achievement':
        return playerStats.unlockedAchievements?.includes(requirement.value);
      case 'level':
        return (playerStats.level || 0) >= requirement.value;
      case 'score':
        return (playerStats.highScore || 0) >= requirement.value;
      case 'games_played':
        return (playerStats.gamesPlayed || 0) >= requirement.value;
      default:
        return true;
    }
  }
}

/**
 * Inventory Model - Manages owned and equipped items
 */
export class InventoryModel {
  private ownedItems: Map<string, OwnedItem> = new Map();
  private equippedItems: EquippedItems = {};

  constructor() {}

  addItem(item: OwnedItem): void {
    this.ownedItems.set(item.itemId, item);
  }

  removeItem(itemId: string): boolean {
    const item = this.ownedItems.get(itemId);
    if (item?.isEquipped) {
      // Unequip before removing
      this.unequipItem(item.equipmentSlot!);
    }
    return this.ownedItems.delete(itemId);
  }

  hasItem(itemId: string): boolean {
    return this.ownedItems.has(itemId);
  }

  getOwnedItem(itemId: string): OwnedItem | undefined {
    return this.ownedItems.get(itemId);
  }

  getAllOwnedItems(): OwnedItem[] {
    return Array.from(this.ownedItems.values());
  }

  getOwnedItemsByCategory(category: ItemCategory): OwnedItem[] {
    // This would require access to shop catalog to get item categories
    return this.getAllOwnedItems();
  }

  equipItem(itemId: string, slot: EquipmentSlot): boolean {
    const item = this.ownedItems.get(itemId);
    if (!item) return false;

    // Unequip current item in slot
    const currentlyEquipped = this.equippedItems[slot];
    if (currentlyEquipped) {
      this.unequipItem(slot);
    }

    // Equip new item
    this.equippedItems[slot] = itemId;
    item.isEquipped = true;
    item.equipmentSlot = slot;

    return true;
  }

  unequipItem(slot: EquipmentSlot): boolean {
    const itemId = this.equippedItems[slot];
    if (!itemId) return false;

    const item = this.ownedItems.get(itemId);
    if (item) {
      item.isEquipped = false;
      item.equipmentSlot = undefined;
    }

    delete this.equippedItems[slot];
    return true;
  }

  getEquippedItems(): EquippedItems {
    return { ...this.equippedItems };
  }

  getEquippedItem(slot: EquipmentSlot): string | undefined {
    return this.equippedItems[slot];
  }

  incrementUsage(itemId: string): void {
    const item = this.ownedItems.get(itemId);
    if (item) {
      item.timesUsed = (item.timesUsed || 0) + 1;
    }
  }
}

/**
 * Transaction Model - Handles purchase transactions and history
 */
export class TransactionModel {
  private transactions: Map<string, Transaction> = new Map();
  private nextTransactionId: number = 1;

  constructor() {}

  createTransaction(
    itemId: string, 
    playerId: string, 
    amount: number, 
    type: 'purchase' | 'refund' = 'purchase'
  ): Transaction {
    const transaction: Transaction = {
      id: `txn_${this.nextTransactionId++}`,
      itemId,
      playerId,
      amount,
      timestamp: Date.now(),
      type,
      status: 'pending'
    };

    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  completeTransaction(transactionId: string): boolean {
    const transaction = this.transactions.get(transactionId);
    if (transaction && transaction.status === 'pending') {
      transaction.status = 'completed';
      return true;
    }
    return false;
  }

  failTransaction(transactionId: string): boolean {
    const transaction = this.transactions.get(transactionId);
    if (transaction && transaction.status === 'pending') {
      transaction.status = 'failed';
      return true;
    }
    return false;
  }

  getTransaction(transactionId: string): Transaction | undefined {
    return this.transactions.get(transactionId);
  }

  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values());
  }

  getTransactionsByPlayer(playerId: string): Transaction[] {
    return this.getAllTransactions().filter(txn => txn.playerId === playerId);
  }

  getTransactionsByType(type: 'purchase' | 'refund'): Transaction[] {
    return this.getAllTransactions().filter(txn => txn.type === type);
  }

  getTotalSpent(playerId: string): number {
    return this.getTransactionsByPlayer(playerId)
      .filter(txn => txn.type === 'purchase' && txn.status === 'completed')
      .reduce((total, txn) => total + txn.amount, 0);
  }

  getTotalRefunded(playerId: string): number {
    return this.getTransactionsByPlayer(playerId)
      .filter(txn => txn.type === 'refund' && txn.status === 'completed')
      .reduce((total, txn) => total + txn.amount, 0);
  }
}

/**
 * Shop Economy Model - Handles pricing and purchase validation
 */
export class ShopEconomyModel {
  private priceMultipliers: Map<string, number> = new Map();
  private discounts: Map<string, number> = new Map();

  constructor() {}

  setPriceMultiplier(itemId: string, multiplier: number): void {
    this.priceMultipliers.set(itemId, multiplier);
  }

  setDiscount(itemId: string, discountPercent: number): void {
    this.discounts.set(itemId, Math.max(0, Math.min(100, discountPercent)));
  }

  calculatePrice(basePrice: number, itemId: string): number {
    let price = basePrice;

    // Apply multiplier
    const multiplier = this.priceMultipliers.get(itemId) || 1;
    price *= multiplier;

    // Apply discount
    const discount = this.discounts.get(itemId) || 0;
    price *= (100 - discount) / 100;

    return Math.round(price);
  }

  validatePurchase(
    item: ShopItem, 
    playerCoins: number, 
    hasItem: boolean,
    playerStats?: any
  ): ValidationResult {
    // Check if already owned
    if (hasItem) {
      return {
        valid: false,
        reason: 'Item already owned'
      };
    }

    // Check unlock requirements
    if (item.unlockRequirement && playerStats) {
      const meetsRequirement = this.checkUnlockRequirement(item.unlockRequirement, playerStats);
      if (!meetsRequirement) {
        return {
          valid: false,
          reason: 'Unlock requirement not met',
          missingRequirement: this.formatRequirement(item.unlockRequirement)
        };
      }
    }

    // Check if player has enough coins
    const finalPrice = this.calculatePrice(item.price, item.id);
    if (playerCoins < finalPrice) {
      return {
        valid: false,
        reason: 'Insufficient coins',
        requiredCoins: finalPrice
      };
    }

    return { valid: true };
  }

  private checkUnlockRequirement(requirement: any, playerStats: any): boolean {
    switch (requirement.type) {
      case 'achievement':
        return playerStats.unlockedAchievements?.includes(requirement.value);
      case 'level':
        return (playerStats.level || 0) >= requirement.value;
      case 'score':
        return (playerStats.highScore || 0) >= requirement.value;
      case 'games_played':
        return (playerStats.gamesPlayed || 0) >= requirement.value;
      default:
        return true;
    }
  }

  private formatRequirement(requirement: any): string {
    switch (requirement.type) {
      case 'achievement':
        return `Unlock achievement: ${requirement.value}`;
      case 'level':
        return `Reach level ${requirement.value}`;
      case 'score':
        return `Achieve score of ${requirement.value}`;
      case 'games_played':
        return `Play ${requirement.value} games`;
      default:
        return 'Unknown requirement';
    }
  }
}