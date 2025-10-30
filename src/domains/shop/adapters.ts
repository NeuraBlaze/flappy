/**
 * Shop Domain Adapters
 * Concrete implementations for shop functionality
 */

import { 
  ShopPort, 
  InventoryPort, 
  TransactionPort,
  ShopItem,
  OwnedItem,
  EquippedItems,
  Transaction,
  PurchaseResult,
  TransactionResult,
  RefundResult,
  ValidationResult,
  ItemCategory,
  EquipmentSlot,
  ShopEvents
} from './ports';
import { 
  ShopCatalogModel, 
  InventoryModel, 
  TransactionModel, 
  ShopEconomyModel 
} from './models';
import { DEFAULT_SHOP_ITEMS } from '../../shared/constants/shop.constants';

/**
 * Shop Adapter - Manages shop catalog and item purchasing
 */
export class ShopAdapter implements ShopPort {
  private catalogModel: ShopCatalogModel;
  private economyModel: ShopEconomyModel;
  private events?: ShopEvents;

  constructor(customItems: ShopItem[] = []) {
    this.catalogModel = new ShopCatalogModel([...DEFAULT_SHOP_ITEMS, ...customItems]);
    this.economyModel = new ShopEconomyModel();
  }

  setEventHandlers(events: ShopEvents): void {
    this.events = events;
  }

  getAvailableItems(): ShopItem[] {
    return this.catalogModel.getAllItems();
  }

  getItemsByCategory(category: ItemCategory): ShopItem[] {
    return this.catalogModel.getItemsByCategory(category);
  }

  purchaseItem(itemId: string, playerCoins: number, hasItem: boolean = false, playerStats?: any): PurchaseResult {
    const item = this.catalogModel.getItem(itemId);
    
    if (!item) {
      return {
        success: false,
        message: 'Item not found'
      };
    }

    // Validate purchase
    const validation = this.economyModel.validatePurchase(item, playerCoins, hasItem, playerStats);
    if (!validation.valid) {
      // Trigger events for different failure reasons
      if (validation.reason === 'Insufficient coins' && this.events?.onInsufficientFunds) {
        this.events.onInsufficientFunds(validation.requiredCoins!, playerCoins);
      }
      if (validation.reason === 'Unlock requirement not met' && this.events?.onUnlockRequirementNotMet) {
        this.events.onUnlockRequirementNotMet(validation.missingRequirement!);
      }

      return {
        success: false,
        message: validation.reason!,
        newBalance: playerCoins
      };
    }

    const finalPrice = this.economyModel.calculatePrice(item.price, item.id);
    const newBalance = playerCoins - finalPrice;

    return {
      success: true,
      message: `Successfully purchased ${item.name}!`,
      newBalance,
      item
    };
  }

  getItemPrice(itemId: string): number {
    const item = this.catalogModel.getItem(itemId);
    if (!item) return 0;
    
    return this.economyModel.calculatePrice(item.price, item.id);
  }

  isItemAvailable(itemId: string, playerStats?: any): boolean {
    return this.catalogModel.isItemAvailable(itemId, playerStats);
  }

  searchItems(query: string): ShopItem[] {
    return this.catalogModel.searchItems(query);
  }

  getItemsByRarity(rarity: string): ShopItem[] {
    return this.catalogModel.getItemsByRarity(rarity);
  }

  setDiscount(itemId: string, discountPercent: number): void {
    this.economyModel.setDiscount(itemId, discountPercent);
  }

  setPriceMultiplier(itemId: string, multiplier: number): void {
    this.economyModel.setPriceMultiplier(itemId, multiplier);
  }
}

/**
 * Inventory Adapter - Manages owned and equipped items
 */
export class InventoryAdapter implements InventoryPort {
  private inventoryModel: InventoryModel;
  private events?: ShopEvents;

  constructor() {
    this.inventoryModel = new InventoryModel();
  }

  setEventHandlers(events: ShopEvents): void {
    this.events = events;
  }

  getOwnedItems(): OwnedItem[] {
    return this.inventoryModel.getAllOwnedItems();
  }

  hasItem(itemId: string): boolean {
    return this.inventoryModel.hasItem(itemId);
  }

  addItem(item: OwnedItem): void {
    this.inventoryModel.addItem(item);
  }

  getEquippedItems(): EquippedItems {
    return this.inventoryModel.getEquippedItems();
  }

  equipItem(itemId: string, slot: EquipmentSlot): boolean {
    const success = this.inventoryModel.equipItem(itemId, slot);
    
    if (success && this.events?.onItemEquipped) {
      this.events.onItemEquipped(itemId, slot);
    }
    
    return success;
  }

  unequipItem(slot: EquipmentSlot): boolean {
    return this.inventoryModel.unequipItem(slot);
  }

  getEquippedItem(slot: EquipmentSlot): string | undefined {
    return this.inventoryModel.getEquippedItem(slot);
  }

  removeItem(itemId: string): boolean {
    return this.inventoryModel.removeItem(itemId);
  }

  incrementUsage(itemId: string): void {
    this.inventoryModel.incrementUsage(itemId);
  }

  getOwnedItem(itemId: string): OwnedItem | undefined {
    return this.inventoryModel.getOwnedItem(itemId);
  }
}

/**
 * Transaction Adapter - Handles purchase transactions and history
 */
export class TransactionAdapter implements TransactionPort {
  private transactionModel: TransactionModel;

  constructor() {
    this.transactionModel = new TransactionModel();
  }

  processTransaction(transaction: Transaction): TransactionResult {
    // In a real implementation, this would handle payment processing
    const success = this.transactionModel.completeTransaction(transaction.id);
    
    if (success) {
      return {
        success: true,
        message: 'Transaction completed successfully',
        transactionId: transaction.id,
        newBalance: 0 // This would be calculated based on the actual transaction
      };
    } else {
      this.transactionModel.failTransaction(transaction.id);
      return {
        success: false,
        message: 'Transaction failed',
        transactionId: transaction.id,
        newBalance: 0
      };
    }
  }

  getTransactionHistory(): Transaction[] {
    return this.transactionModel.getAllTransactions();
  }

  refundTransaction(transactionId: string): RefundResult {
    const transaction = this.transactionModel.getTransaction(transactionId);
    
    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found',
        refundAmount: 0,
        newBalance: 0
      };
    }

    if (transaction.status !== 'completed') {
      return {
        success: false,
        message: 'Can only refund completed transactions',
        refundAmount: 0,
        newBalance: 0
      };
    }

    // Create refund transaction
    const refundTransaction = this.transactionModel.createTransaction(
      transaction.itemId,
      transaction.playerId,
      transaction.amount,
      'refund'
    );

    const success = this.transactionModel.completeTransaction(refundTransaction.id);

    if (success) {
      return {
        success: true,
        message: 'Refund processed successfully',
        refundAmount: transaction.amount,
        newBalance: transaction.amount // This would be the new balance after refund
      };
    } else {
      return {
        success: false,
        message: 'Refund failed',
        refundAmount: 0,
        newBalance: 0
      };
    }
  }

  validatePurchase(itemId: string, playerCoins: number): ValidationResult {
    // Basic validation - this would be enhanced in a real implementation
    if (playerCoins <= 0) {
      return {
        valid: false,
        reason: 'Insufficient coins',
        requiredCoins: 1
      };
    }

    return { valid: true };
  }

  createTransaction(itemId: string, playerId: string, amount: number): Transaction {
    return this.transactionModel.createTransaction(itemId, playerId, amount);
  }

  getTotalSpent(playerId: string): number {
    return this.transactionModel.getTotalSpent(playerId);
  }

  getTotalRefunded(playerId: string): number {
    return this.transactionModel.getTotalRefunded(playerId);
  }
}