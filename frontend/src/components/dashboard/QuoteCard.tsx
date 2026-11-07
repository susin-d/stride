import React from 'react';
import { Quote } from 'lucide-react';

export const QuoteCard: React.FC = () => {
  return (
    <div className="quote-glass-card p-6 flex flex-col justify-between h-[310px] text-white relative overflow-hidden group">
      {/* Decorative oversized quotation watermark */}
      <div className="absolute -bottom-6 -right-6 text-white/5 pointer-events-none transform rotate-12 transition-transform duration-700 group-hover:scale-105">
        <Quote className="w-40 h-40" />
      </div>

      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2 z-10">
        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
          <Quote className="w-3.5 h-3.5 text-neutral-300" />
        </div>
        <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          Daily Motivation
        </span>
      </div>

      <div className="my-auto z-10 py-3">
        <p className="text-lg md:text-xl font-medium tracking-tight text-neutral-100 leading-snug">
          "Small steps create big changes."
        </p>
        <p className="text-xs text-neutral-400 mt-2 font-medium">
          Consistency beats intensity every single time.
        </p>
      </div>

      <div className="flex items-center justify-between z-10 pt-3 border-t border-white/10">
        <span className="text-[10px] tracking-wider text-neutral-400 uppercase font-semibold">
          STRIDE Principle #1
        </span>
        <span className="text-[10px] text-neutral-500 font-mono">Today & Beyond</span>
      </div>
    </div>
  );
};
