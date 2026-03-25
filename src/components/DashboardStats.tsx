import React from 'react';
import { Package, AlertCircle, ShoppingCart, TrendingUp, RefreshCw } from 'lucide-react';
import { InventorySummary } from '../types';
import { cn } from '../lib/utils';

interface Props {
  summary: InventorySummary;
  onSyncEmojis?: () => void;
}

export const DashboardStats: React.FC<Props> = ({ summary, onSyncEmojis }) => {
  const stats = [
    {
      label: 'Total Catalog',
      value: summary.totalItems,
      icon: () => <img src="/alfonso.jpg" alt="Logo" referrerPolicy="no-referrer" className="w-full h-full rounded-md md:rounded-lg object-cover" />,
      textColor: 'text-brand-dark dark:text-brand-light',
      bgColor: 'bg-brand-dark/5 dark:bg-white/5'
    },
    {
      label: 'Low Stock',
      value: summary.lowStockCount,
      icon: AlertCircle,
      textColor: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'Out of Stock',
      value: summary.outOfStockCount,
      icon: ShoppingCart,
      textColor: 'text-error',
      bgColor: 'bg-error/10'
    },
    {
      label: 'Healthy Stock',
      value: summary.totalItems - summary.lowStockCount - summary.outOfStockCount,
      icon: TrendingUp,
      textColor: 'text-success',
      bgColor: 'bg-success/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-brand-brown/10 border border-brand-brown/10 rounded-[20px] md:rounded-[32px] overflow-hidden mb-6 md:mb-12 shadow-sm">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className="bg-brand-light-brown p-3 md:p-8 flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-2 md:gap-6 hover:bg-brand-brown/5 transition-colors relative group"
        >
          {stat.label === 'Total Catalog' && onSyncEmojis && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSyncEmojis();
              }}
              className="absolute top-1 right-1 md:top-4 md:right-4 p-1 md:p-2 bg-brand-brown/5 hover:bg-brand-brown/10 rounded-lg md:rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
              title="Sync Emojis"
            >
              <RefreshCw size={10} className="text-brand-brown md:w-[14px] md:h-[14px]" />
            </button>
          )}
          <div className={cn(
            "w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
            stat.bgColor,
            stat.textColor
          )}>
            <stat.icon size={16} className="md:w-7 md:h-7" />
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-brand-brown/70 mb-0 md:mb-1">{stat.label}</p>
            <h3 className={cn(
              "text-xl md:text-3xl font-black tracking-tighter",
              stat.label === 'Total Catalog' ? 'text-brand-brown' : stat.textColor
            )}>{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};
