import React from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-brand-dark/60 backdrop-blur-xl">
      <div className="premium-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-500 border border-white/10">
        <div className="p-8 md:p-12 text-center">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-500 text-white rounded-2xl md:rounded-[32px] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-2xl shadow-rose-500/30 border-4 border-white/20">
            <AlertTriangle size={32} className="md:w-12 md:h-12" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-brand-dark dark:text-brand-light mb-3 md:mb-4 tracking-tighter">Reset All?</h2>
          <p className="text-brand-brown dark:text-brand-tan/80 mb-8 md:mb-12 leading-relaxed font-bold text-base md:text-lg">
            This will set <span className="text-brand-dark dark:text-brand-light font-black">all item quantities to zero</span>. This action is permanent.
          </p>
          
          <div className="flex flex-col gap-3 md:gap-5">
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full py-4 md:py-6 bg-rose-500 text-white rounded-2xl md:rounded-[32px] font-black text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-rose-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 md:gap-4 shadow-2xl shadow-rose-500/20"
            >
              <RotateCcw size={20} className="md:w-6 md:h-6" />
              Confirm Reset
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 md:py-6 bg-brand-dark/5 dark:bg-white/5 text-brand-brown dark:text-brand-tan rounded-2xl md:rounded-[32px] font-black text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-brand-dark/10 dark:hover:bg-white/10 active:scale-[0.98] transition-all border border-brand-dark/5 dark:border-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
