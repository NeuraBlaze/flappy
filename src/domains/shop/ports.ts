/**
 * Shop Domain - Ports (Interfaces)
 * Handles item purchasing, inventory management, and shop catalog
 */

// Shop catalog management
export interface ShopPort {
  getAvailableItems(): ShopItem[];
  getItemsByCategory(category: ItemCategory): ShopItem[];
  purchaseItem(itemId: string, playerCoins: number): PurchaseResult;
  getItemPrice(itemId: string): number;
  isItemAvailable(itemId: string): boolean;
}

// Inventory management
export interface InventoryPort {
  getOwnedItems(): OwnedItem[];
  hasItem(itemId: string): boolean;
  addItem(item: OwnedItem): void;
  getEquippedItems(): EquippedItems;
  equipItem(itemId: string, slot: EquipmentSlot): boolean;
  unequipItem(slot: EquipmentSlot): boolean;
}

// Transaction handling
export interface TransactionPort {
  processTransaction(transaction: Transaction): TransactionResult;
  getTransactionHistory(): Transaction[];
  refundTransaction(transactionId: string): RefundResult;
  validatePurchase(itemId: string, playerCoins: number): ValidationResult;
}

// Types and Interfaces

export type ItemCategory = 'skins' | 'powerups' | 'upgrades' | 'consumables';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type EquipmentSlot = 'bird_skin' | 'trail_effect' | 'background' | 'power_boost';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  price: number;
  icon: string;
  preview?: string; // Image or emoji for preview
  unlockRequirement?: {
    type: 'achievement' | 'level' | 'score' | 'games_played';
    value: string | number;
  };
  effects?: ItemEffect[];
  metadata?: {
    author?: string;
    version?: string;
    tags?: string[];
  };
}

export interface ItemEffect {
  type: 'stat_boost' | 'visual_effect' | 'gameplay_modifier';
  property: string;
  value: number | string;
  duration?: number; // in seconds, for temporary effects
}

export interface OwnedItem {
  itemId: string;
  purchaseDate: number;
  purchasePrice: number;
  timesUsed?: number;
  isEquipped?: boolean;
  equipmentSlot?: EquipmentSlot;
}

export interface EquippedItems {
  bird_skin?: string;
  trail_effect?: string;
  background?: string;
  power_boost?: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  playerId: string;
  amount: number;
  timestamp: number;
  type: 'purchase' | 'refund';
  status: 'pending' | 'completed' | 'failed';
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  transaction?: Transaction;
  newBalance?: number;
  item?: ShopItem;
}

export interface TransactionResult {
  success: boolean;
  message: string;
  transactionId: string;
  newBalance: number;
}

export interface RefundResult {
  success: boolean;
  message: string;
  refundAmount: number;
  newBalance: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  requiredCoins?: number;
  missingRequirement?: string;
}

// Shop events for reactive updates
export interface ShopEvents {
  onItemPurchased: (item: ShopItem, transaction: Transaction) => void;
  onItemEquipped: (itemId: string, slot: EquipmentSlot) => void;
  onInsufficientFunds: (required: number, available: number) => void;
  onUnlockRequirementNotMet: (requirement: string) => void;
}