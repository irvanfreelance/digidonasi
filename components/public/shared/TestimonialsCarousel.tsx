"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Testimonial = {
  person_name: string;
  person_role: string;
  person_type: string;
  initials: string;
  quote: string;
  avatar_url: string | null;
};

export default function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const count = testimonials.length;

  const scrollToIndex = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[i] as HTMLElement | undefined;
    if (card) {
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }
  }, []);

  const go = useCallback((delta: number) => {
    setIndex((prev) => {
      const next = (prev + delta + count) % count;
      scrollToIndex(next);
      return next;
    });
  }, [count, scrollToIndex]);

  useEffect(() => {
    if (isPaused || count <= 1) return;
    const id = setInterval(() => go(1), 4500);
    return () => clearInterval(id);
  }, [isPaused, count, go]);

  if (count === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
      >
        {testimonials.map((t) => (
          <div
            key={t.person_name}
            className="hover-lift shrink-0 snap-start basis-full sm:basis-[calc(50%-10px)] lg:basis-[calc(33.333%-14px)] bg-[#f8fafc] rounded-2xl p-7 border border-[#e2e8f0] relative"
          >
            <div className="text-[48px] text-[#e8f0fb] font-cabin font-bold leading-none mb-2">"</div>
            <p className="text-[14.5px] text-[#475569] leading-relaxed italic mb-6 line-clamp-4">{t.quote}</p>
            <div className="flex items-center gap-3">
              {t.avatar_url ? (
                <img src={t.avatar_url} alt={t.person_name} className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#83b64e] flex items-center justify-center font-cabin font-bold text-[15px] text-white shrink-0">
                  {t.initials}
                </div>
              )}
              <div>
                <div className="font-cabin font-bold text-[14px]">{t.person_name}</div>
                <div className="text-[12.5px] text-[#94a3b8]">{t.person_role}</div>
                <div className={`text-[11px] px-2 py-0.5 rounded-full inline-block mt-1 font-bold ${t.person_type === 'muzakki' ? 'bg-[#eef5e4] text-[#83b64e]' : 'bg-[#fdf3e3] text-[#c9892a]'}`}>
                  {t.person_type === 'muzakki' ? 'Muzakki' : 'Mustahiq'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Sebelumnya"
            onClick={() => go(-1)}
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[#e2e8f0] shadow-md items-center justify-center text-[#0f1b35] transition-all hover:bg-[#83b64e] hover:text-white hover:scale-110"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Berikutnya"
            onClick={() => go(1)}
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[#e2e8f0] shadow-md items-center justify-center text-[#0f1b35] transition-all hover:bg-[#83b64e] hover:text-white hover:scale-110"
          >
            <ChevronRight size={18} />
          </button>

          <div className="flex justify-center gap-2 mt-7">
            {testimonials.map((t, i) => (
              <button
                key={t.person_name}
                type="button"
                aria-label={`Ke testimoni ${i + 1}`}
                onClick={() => { setIndex(i); scrollToIndex(i); }}
                className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-[#83b64e]" : "w-2 bg-[#e2e8f0] hover:bg-[#c8d5e0]"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
