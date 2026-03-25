import React, { useState, useMemo } from 'react';
import { Plus, Minus, Edit2, Check, X, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { InventoryItem, Category } from '../types';
import { CATEGORIES } from '../App';
import { getStockStatus, formatTimestamp } from '../lib/inventoryUtils';
import { cn } from '../lib/utils';

interface Props {
  items: InventoryItem[];
  onUpdate: (id: string, updates: Partial<InventoryItem>) => void;
  onDelete: (id: string) => void;
  onEdit: (item: InventoryItem) => void;
  hideCategory?: boolean;
}

export const InventoryTable: React.FC<Props> = ({ items, onUpdate, onDelete, onEdit, hideCategory }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSave = (id: string) => {
    onUpdate(id, { quantity: editValue, lastUpdated: Date.now() });
    setEditingId(null);
  };

  const handleQuickAdjust = (item: InventoryItem, delta: number) => {
    const current = parseFloat(item.quantity);
    if (!isNaN(current)) {
      const newVal = Math.max(0, current + delta).toString();
      onUpdate(item.id, { quantity: newVal, lastUpdated: Date.now() });
    } else {
      setEditingId(item.id);
      setEditValue(item.quantity);
    }
  };

  const statusColors = {
    'in-stock': 'bg-green-600/10 text-green-600 border-green-600/20',
    'low-stock': 'bg-orange-600/10 text-orange-600 border-orange-600/20',
    'out-of-stock': 'bg-red-600/10 text-red-600 border-red-600/20',
  };

  const groupedItems = useMemo(() => {
    const groups: { [key in Category]?: InventoryItem[] } = {};
    items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    });
    return groups;
  }, [items]);

  const categories = useMemo(() => {
    return CATEGORIES.filter(cat => groupedItems[cat]);
  }, [groupedItems]);

  return (
    <div className="data-grid bg-brand-light-brown rounded-[32px] overflow-hidden border border-brand-brown/10 shadow-sm">
      {/* Header - Hidden on small screens */}
      <div className="hidden md:grid grid-cols-[48px_1.5fr_1fr_120px_100px] gap-4 px-8 py-5 bg-brand-brown/5 border-b border-brand-brown/10">
        <div className="w-6"></div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown opacity-60">Product Details</div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown opacity-60 text-center">Stock Level</div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown opacity-60 text-center">Status</div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown opacity-60 text-right">Actions</div>
      </div>

      <div className="divide-y divide-brand-brown/5">
        {categories.map(category => (
          <React.Fragment key={category}>
            {/* Category Header Row */}
            <div id={`category-${category}`} className="px-4 md:px-8 py-3 md:py-4 bg-brand-light-brown border-y border-brand-brown/10 flex items-center gap-4">
              <h3 className="text-[11px] md:text-sm font-black text-brand-brown uppercase tracking-[0.2em]">{category}</h3>
              <div className="h-px flex-1 bg-brand-brown/20" />
              <span className="text-[10px] md:text-[10px] font-black text-brand-brown">{groupedItems[category].length} Items</span>
            </div>

            {groupedItems[category].map((item) => {
              const status = getStockStatus(item);
              const isEditing = editingId === item.id;
              const isCounted = item.isCounted || false;

              return (
                  <div 
                    key={item.id} 
                    className={cn(
                      "flex flex-col md:grid md:grid-cols-[48px_1.5fr_1fr_120px_100px] gap-2 md:gap-4 px-4 md:px-8 py-3 md:py-5 items-stretch md:items-center group transition-all relative",
                      isCounted 
                        ? "bg-brand-brown/[0.02] opacity-75" 
                        : "hover:bg-brand-brown/[0.04]"
                    )}
                  >
                    {/* Checkbox Container - Larger hit area */}
                    <div className="absolute top-0 left-0 w-12 h-14 md:relative md:w-auto md:h-auto flex items-center justify-center z-10">
                      <button
                        onClick={() => onUpdate(item.id, { isCounted: !isCounted })}
                        className={cn(
                          "w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg border-2 flex items-center justify-center transition-all shrink-0 shadow-sm active:scale-90",
                          isCounted 
                            ? "bg-brand-brown border-brand-brown text-white" 
                            : "border-brand-brown/20 hover:border-brand-brown/40 bg-brand-brown/5"
                        )}
                      >
                        {isCounted && <Check size={12} strokeWidth={4} className="md:w-[14px] md:h-[14px]" />}
                      </button>
                    </div>

                    {/* Product Details */}
                    <div className="flex items-center justify-between md:justify-start gap-2 md:gap-5 min-w-0 w-full md:w-auto pl-8 md:pl-0">
                      <div className="flex items-center gap-2.5 md:gap-5 min-w-0">
                        <div className={cn(
                          "w-8 h-8 md:w-11 md:h-11 bg-brand-brown/5 rounded-lg md:rounded-2xl flex items-center justify-center text-lg md:text-2xl border border-brand-brown/10 shrink-0 shadow-sm transition-all",
                          isCounted ? "opacity-40 grayscale" : "group-hover:scale-110"
                        )}>
                          {item.emoji || '📦'}
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <span className={cn(
                            "block font-black text-sm md:text-sm tracking-tight leading-tight truncate transition-all",
                            isCounted 
                              ? "text-brand-brown/40 line-through decoration-brand-brown/50 decoration-1" 
                              : "text-brand-brown"
                          )}>{item.name}</span>
                          <span className={cn(
                            "block text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all",
                            isCounted ? "text-brand-brown/20" : "text-brand-brown/70"
                          )}>#{item.id.slice(0, 6)}</span>
                        </div>
                      </div>
                    </div>

                  {/* Stock Level */}
                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto gap-2 md:gap-6 pl-8 md:pl-0">
                    <span className="md:hidden text-[8px] font-black uppercase tracking-widest text-brand-brown/30">Stock</span>
                    <div className="flex items-center bg-brand-brown/5 rounded-lg md:rounded-2xl p-0.5 md:p-1 border border-brand-brown/10 w-auto shadow-inner">
                      <button
                        onClick={() => handleQuickAdjust(item, -1)}
                        disabled={isCounted}
                        className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center hover:bg-brand-brown hover:text-white rounded-md md:rounded-xl transition-all active:scale-90 text-brand-brown disabled:opacity-30"
                      >
                        <Minus size={14} className="md:w-[18px] md:h-[18px]" />
                      </button>
                      
                      <div className="w-12 md:w-24 text-center px-1">
                        {isEditing && !isCounted ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full bg-transparent text-xs md:text-sm font-black text-center outline-none text-brand-brown"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave(item.id)}
                            onBlur={() => handleSave(item.id)}
                          />
                        ) : (
                          <div 
                            className={cn("cursor-pointer select-none py-0.5", isCounted && "cursor-default")}
                            onClick={() => {
                              if (!isCounted) {
                                setEditingId(item.id);
                                setEditValue(item.quantity);
                              }
                            }}
                          >
                              <span className={cn(
                                "font-black text-sm md:text-sm",
                                isCounted ? "text-brand-brown/40" : "text-brand-brown"
                              )}>
                                {item.quantity}
                              </span>
                              <span className={cn(
                                "text-[9px] md:text-[10px] font-bold uppercase ml-0.5",
                                isCounted ? "text-brand-brown/30" : "text-brand-brown/70"
                              )}>{item.unit}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleQuickAdjust(item, 1)}
                        disabled={isCounted}
                        className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center hover:bg-brand-brown hover:text-white rounded-md md:rounded-xl transition-all active:scale-90 text-brand-brown disabled:opacity-30"
                      >
                        <Plus size={14} className="md:w-[18px] md:h-[18px]" />
                      </button>
                    </div>
                  </div>

                  {/* Status & Actions - Row on mobile */}
                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto gap-2 md:gap-6 mt-1 md:mt-0 pl-8 md:pl-0">
                    <div className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-sm",
                      statusColors[status]
                    )}>
                      <div className="w-1 h-1 rounded-full bg-current" />
                      {status.replace('-', ' ')}
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-3">
                      <button 
                        onClick={() => onEdit(item)}
                        className="p-2 md:p-2.5 text-brand-brown hover:bg-brand-brown hover:text-white rounded-lg md:rounded-2xl transition-all border border-brand-brown/10 bg-brand-light-brown shadow-sm active:scale-90"
                        title="Edit Item"
                      >
                          <Edit2 size={14} className="md:w-[18px] md:h-[18px]" />
                      </button>
                      <button 
                        onClick={() => onDelete(item.id)}
                        className="p-2 md:p-2.5 text-red-600 hover:bg-red-600 hover:text-white rounded-lg md:rounded-2xl transition-all border border-red-600/10 bg-red-600/5 shadow-sm active:scale-90"
                        title="Delete Item"
                      >
                          <Trash2 size={14} className="md:w-[18px] md:h-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
