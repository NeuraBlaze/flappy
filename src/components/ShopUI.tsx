/**
 * Shop UI Component
 * Interactive shop interface for purchasing items
 */

import React, { useState } from 'react';
import { ShopItem, ItemCategory, EquippedItems, OwnedItem } from '../domains/shop';

interface ShopUIProps {
  isVisible: boolean;
  onClose: () => void;
  playerCoins: number;
  availableItems: ShopItem[];
  ownedItems: OwnedItem[];
  equippedItems: EquippedItems;
  onPurchase: (itemId: string) => void;
  onEquip: (itemId: string, slot: string) => void;
  onPreview: (itemId: string) => void;
}

export const ShopUI: React.FC<ShopUIProps> = ({
  isVisible,
  onClose,
  playerCoins,
  availableItems,
  ownedItems,
  equippedItems,
  onPurchase,
  onEquip,
  onPreview
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('skins');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'rarity' | 'name'>('price');
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);

  if (!isVisible) return null;

  const categories: { id: ItemCategory; name: string; icon: string }[] = [
    { id: 'skins', name: 'Bird Skins', icon: '🐦' },
    { id: 'powerups', name: 'Power-ups', icon: '⚡' },
    { id: 'upgrades', name: 'Upgrades', icon: '⬆️' },
    { id: 'consumables', name: 'Consumables', icon: '💊' }
  ];

  const rarityColors = {
    common: '#95a5a6',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f39c12'
  };

  const getRarityStyle = (rarity: string) => ({
    borderColor: rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common,
    boxShadow: `0 0 10px ${rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common}33`
  });

  const ownedItemIds = new Set(ownedItems.map(item => item.itemId));

  const filteredItems = availableItems
    .filter(item => item.category === selectedCategory)
    .filter(item => showOnlyOwned ? ownedItemIds.has(item.id) : true)
    .filter(item => 
      !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
          return (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
        default:
          return 0;
      }
    });

  const getEquipmentSlot = (item: ShopItem): string => {
    switch (item.category) {
      case 'skins':
        return 'bird_skin';
      default:
        return item.category;
    }
  };

  const isItemEquipped = (itemId: string): boolean => {
    return Object.values(equippedItems).includes(itemId);
  };

  const canAfford = (price: number): boolean => {
    return playerCoins >= price;
  };

  const formatRequirement = (requirement: any): string => {
    switch (requirement?.type) {
      case 'achievement':
        return `🏆 ${requirement.value}`;
      case 'level':
        return `📊 Level ${requirement.value}`;
      case 'score':
        return `🎯 Score ${requirement.value}`;
      case 'games_played':
        return `🎮 ${requirement.value} games`;
      default:
        return '';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: 'monospace'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50, #34495e)',
        color: 'white',
        padding: '20px',
        borderRadius: '15px',
        maxWidth: '90vw',
        width: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '2px solid #3498db',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #3498db',
          paddingBottom: '15px'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#3498db', fontSize: '24px' }}>
              🛍️ Bird Shop
            </h2>
            <div style={{ 
              color: '#f39c12', 
              fontSize: '18px', 
              fontWeight: 'bold',
              marginTop: '5px'
            }}>
              💰 {playerCoins} coins
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '35px',
              height: '35px',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #3498db',
              background: '#34495e',
              color: 'white',
              fontSize: '14px',
              minWidth: '150px'
            }}
          />

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #3498db',
              background: '#34495e',
              color: 'white',
              fontSize: '14px'
            }}
          >
            <option value="price">Sort by Price</option>
            <option value="name">Sort by Name</option>
            <option value="rarity">Sort by Rarity</option>
          </select>

          {/* Show owned only */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={showOnlyOwned}
              onChange={(e) => setShowOnlyOwned(e.target.checked)}
            />
            Show owned only
          </label>
        </div>

        {/* Categories */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '10px 15px',
                borderRadius: '8px',
                border: selectedCategory === category.id ? '2px solid #3498db' : '2px solid transparent',
                background: selectedCategory === category.id ? '#3498db' : '#34495e',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '15px',
          padding: '10px'
        }}>
          {filteredItems.map(item => {
            const isOwned = ownedItemIds.has(item.id);
            const isEquipped = isItemEquipped(item.id);
            const affordable = canAfford(item.price);

            return (
              <div
                key={item.id}
                style={{
                  background: '#34495e',
                  padding: '15px',
                  borderRadius: '12px',
                  border: '2px solid',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  ...getRarityStyle(item.rarity)
                }}
                onClick={() => onPreview(item.id)}
              >
                {/* Item Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '24px' }}>{item.icon}</div>
                  <div style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    background: rarityColors[item.rarity] || rarityColors.common,
                    color: 'white'
                  }}>
                    {item.rarity.toUpperCase()}
                  </div>
                </div>

                {/* Item Info */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginBottom: '5px',
                    color: isOwned ? '#2ecc71' : 'white'
                  }}>
                    {item.name} {isOwned && '✓'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#bdc3c7',
                    lineHeight: '1.3',
                    marginBottom: '8px'
                  }}>
                    {item.description}
                  </div>

                  {/* Unlock Requirement */}
                  {item.unlockRequirement && (
                    <div style={{
                      fontSize: '11px',
                      color: '#e67e22',
                      marginBottom: '8px'
                    }}>
                      Requires: {formatRequirement(item.unlockRequirement)}
                    </div>
                  )}

                  {/* Price */}
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: isOwned ? '#95a5a6' : affordable ? '#f39c12' : '#e74c3c'
                  }}>
                    {isOwned ? 'OWNED' : `💰 ${item.price} coins`}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '5px' }}>
                  {!isOwned && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPurchase(item.id);
                      }}
                      disabled={!affordable}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: affordable ? '#2ecc71' : '#95a5a6',
                        color: 'white',
                        cursor: affordable ? 'pointer' : 'not-allowed',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {affordable ? 'BUY' : 'TOO EXPENSIVE'}
                    </button>
                  )}

                  {isOwned && item.category === 'skins' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEquip(item.id, getEquipmentSlot(item));
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isEquipped ? '#e67e22' : '#3498db',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#95a5a6',
            fontSize: '16px',
            padding: '40px'
          }}>
            {searchQuery ? 'No items found matching your search.' : 'No items in this category.'}
          </div>
        )}
      </div>
    </div>
  );
};