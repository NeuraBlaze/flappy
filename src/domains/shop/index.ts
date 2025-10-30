/**
 * Shop Domain - Main Exports
 */

export * from './ports';
export * from './models';
export * from './adapters';

// Re-export commonly used items for convenience
export { 
  ShopAdapter,
  InventoryAdapter,
  TransactionAdapter
} from './adapters';

export type {
  ShopItem,
  OwnedItem,
  EquippedItems,
  Transaction,
  PurchaseResult,
  ItemCategory,
  EquipmentSlot,
  ShopPort,
  InventoryPort,
  TransactionPort
} from './ports';