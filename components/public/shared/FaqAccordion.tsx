'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

export default function FaqAccordion({ faqs = [] }: { faqs: FaqItem[] }) {
  // Default to expanding the first question so user sees example open state
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faqs.length === 0) {
    return (
      <div className="text-[#475569] p-6 bg-white rounded-xl border border-[#e2e8f0] text-center">
        Belum ada FAQ dipublikasikan.
      </div>
    );
  }

  return (
    <div className="grid gap-3.5">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`
              bg-white rounded-xl border transition-all duration-200 overflow-hidden
              ${isOpen ? 'border-[#83b64e]/40 shadow-sm' : 'border-[#e2e8f0] hover:border-slate-300'}
            `}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full p-4 flex justify-between items-center text-left cursor-pointer transition-colors hover:bg-slate-50/50"
              aria-expanded={isOpen}
            >
              <span className={`font-cabin font-bold text-[14.5px] pr-4 transition-colors ${isOpen ? 'text-[#83b64e]' : 'text-[#0f1b35]'}`}>
                {faq.question}
              </span>
              <ChevronDown
                size={18}
                className={`text-[#475569] shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[#83b64e]' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-4 pb-4.5 text-[13.5px] text-[#475569] leading-relaxed border-t border-[#e2e8f0]/60 pt-3 animate-in fade-in duration-200">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
