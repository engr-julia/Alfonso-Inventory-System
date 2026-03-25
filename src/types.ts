export type Category = 'Sauces' | 'Syrups' | 'Others' | 'Lazada Supplies' | 'S&R Supplies';

export interface InventoryItem {
  id: string;
  name: string;
  emoji?: string;
  category: Category;
  quantity: string; // Using string to support "1 & 3/4", "2 boxes + 2 pcs"
  unit: string;
  lowStockThreshold: number;
  lastUpdated: number; // Timestamp
  isCounted?: boolean;
}

export interface InventorySummary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
}
