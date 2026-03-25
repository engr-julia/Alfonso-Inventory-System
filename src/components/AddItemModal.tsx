import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Category, InventoryItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
}

const CATEGORIES: Category[] = ['Sauces', 'Syrups', 'Others', 'Lazada Supplies', 'S&R Supplies'];

export const AddItemModal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Sauces');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [threshold, setThreshold] = useState('1');
  const [emoji, setEmoji] = useState('📦');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      category,
      quantity,
      unit,
      lowStockThreshold: parseFloat(threshold) || 1,
      emoji,
    });
    setName('');
    setQuantity('');
    setUnit('');
    setThreshold('1');
    setEmoji('📦');
    onClose();
  };

  const SUGGESTED_EMOJIS = [
    '📦', '🥫', '🍯', '🥛', '☕', '🥤', '🍫', '🧂', '🥯', '🥐',
    '🍰', '🍦', '🍓', '🍋', '🍎', '🍵', '🍶', '🧊', '🥄', '🥣',
    '🥡', '🥢', '🧼', '🧻', '🧴', '🧤', '🧹', '🧺', '🛍️', '🏷️'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-brand-dark/60 backdrop-blur-xl">
      <div className="premium-card w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-500 !p-0 border border-white/10 max-h-[95vh] flex flex-col">
        <div className="p-5 md:p-10 border-b border-white/10 flex justify-between items-center bg-white/5 dark:bg-white/5 shrink-0">
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-0.5 md:mb-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-brand-tan rounded-full" />
              <p className="text-[10px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-tan">New Entry</p>
            </div>
            <h2 className="text-xl md:text-3xl font-black text-brand-dark dark:text-brand-light tracking-tighter">Add to Catalog</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center hover:bg-brand-dark/5 dark:hover:bg-white/5 rounded-xl md:rounded-2xl transition-all text-brand-brown dark:text-brand-tan border border-white/10">
            <X size={18} className="md:w-6 md:h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 md:p-10 space-y-5 md:space-y-8 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-5 md:gap-8">
            <div className="w-full md:w-32">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-brown dark:text-brand-tan mb-2 md:mb-3 ml-1">Icon</label>
              <div className="relative group">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full h-16 md:h-24 text-3xl md:text-5xl text-center rounded-2xl md:rounded-3xl bg-white/40 dark:bg-white/5 border border-brand-dark/5 dark:border-white/5 focus:border-brand-tan outline-none transition-all shadow-inner"
                  maxLength={2}
                />
                <div className="absolute top-full left-0 mt-2 p-2 glass rounded-2xl shadow-2xl border border-white/20 hidden group-focus-within:grid grid-cols-5 gap-1.5 z-20 w-[220px] animate-in slide-in-from-top-2">
                  {SUGGESTED_EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-brand-tan hover:text-white rounded-lg text-xl transition-all"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-brown dark:text-brand-tan mb-2 md:mb-3 ml-1">Product Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 md:px-6 md:py-5 rounded-2xl md:rounded-3xl bg-white/40 dark:bg-white/5 border border-brand-dark/5 dark:border-white/5 focus:border-brand-tan outline-none transition-all text-brand-dark dark:text-brand-light font-black text-lg md:text-xl tracking-tight placeholder:text-brand-brown/20 shadow-inner"
                placeholder="e.g. White Choco"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-brown dark:text-brand-tan mb-2 md:mb-3 ml-1">Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-5 md:px-6 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-white/40 dark:bg-white/5 border border-brand-dark/5 dark:border-white/5 focus:border-brand-tan outline-none transition-all appearance-none font-black text-brand-dark dark:text-brand-light tracking-tight shadow-inner cursor-pointer text-sm md:text-base"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute right-5 md:right-6 top-1/2 -translate-y-1/2 pointer-events-none text-brand-tan">
                  <Plus size={14} className="rotate-45" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-brown dark:text-brand-tan mb-2 md:mb-3 ml-1">Unit of Measure</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-5 md:px-6 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-white/40 dark:bg-white/5 border border-brand-dark/5 dark:border-white/5 focus:border-brand-tan outline-none transition-all font-black text-brand-dark dark:text-brand-light tracking-tight placeholder:text-brand-brown/20 shadow-inner text-sm md:text-base"
                placeholder="e.g. pcs, jars, kg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-brown dark:text-brand-tan mb-2 md:mb-3 ml-1">Initial Quantity</label>
              <input
                required
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-5 md:px-6 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-white/40 dark:bg-white/5 border border-brand-dark/5 dark:border-white/5 focus:border-brand-tan outline-none transition-all font-black text-brand-dark dark:text-brand-light tracking-tight placeholder:text-brand-brown/20 shadow-inner text-sm md:text-base"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-brown dark:text-brand-tan mb-2 md:mb-3 ml-1">Low Stock Alert Level</label>
              <input
                required
                type="number"
                step="0.1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full px-5 md:px-6 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-white/40 dark:bg-white/5 border border-brand-dark/5 dark:border-white/5 focus:border-brand-tan outline-none transition-all font-black text-brand-dark dark:text-brand-light tracking-tight shadow-inner text-sm md:text-base"
              />
            </div>
          </div>

          <div className="pt-2 md:pt-6 pb-2">
            <button
              type="submit"
              className="w-full py-4 md:py-6 bg-brand-dark dark:bg-brand-light text-brand-light dark:text-brand-dark rounded-2xl md:rounded-[32px] font-black text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 md:gap-4 shadow-2xl shadow-brand-dark/20 dark:shadow-brand-light/10"
            >
              <Plus size={20} className="md:w-6 md:h-6" />
              Register Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
