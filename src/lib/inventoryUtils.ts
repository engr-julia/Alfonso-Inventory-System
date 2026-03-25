import { InventoryItem } from '../types';

/**
 * Parses a quantity string to a numeric value for comparison (low stock check).
 * This is a heuristic and might not be perfect for all mixed formats.
 */
export function parseQuantity(qty: string): number {
  if (!qty) return 0;
  
  // Handle "Half"
  if (qty.toLowerCase().includes('half')) return 0.5;
  
  // Handle fractions like ½, ¾, ¼
  const fractionMap: { [key: string]: number } = {
    '½': 0.5,
    '¾': 0.75,
    '¼': 0.25,
    '1/2': 0.5,
    '3/4': 0.75,
    '1/4': 0.25,
  };

  for (const [char, val] of Object.entries(fractionMap)) {
    if (qty.includes(char)) {
      // If it's something like "4½", we want 4.5
      const base = parseFloat(qty.replace(char, '').trim()) || 0;
      return base + val;
    }
  }

  // Handle "1 & 3/4"
  const mixedMatch = qty.match(/(\d+)\s*&\s*(\d+)\/(\d+)/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const num = parseInt(mixedMatch[2]);
    const den = parseInt(mixedMatch[3]);
    return whole + (num / den);
  }

  // Handle "2 boxes + 2 pcs" - just take the first number for threshold check
  const firstNumMatch = qty.match(/(\d+(\.\d+)?)/);
  if (firstNumMatch) {
    return parseFloat(firstNumMatch[1]);
  }

  return 0;
}

export function getStockStatus(item: InventoryItem): 'in-stock' | 'low-stock' | 'out-of-stock' {
  const val = parseQuantity(item.quantity);
  if (val <= 0) return 'out-of-stock';
  if (val <= item.lowStockThreshold) return 'low-stock';
  return 'in-stock';
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString([], { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
