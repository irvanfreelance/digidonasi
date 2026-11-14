'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function CountUp({ target }: { target: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        let start = 0;
        const step = target / 60;
        const t = setInterval(() => {
          start += step;
          if (start >= target) { 
            setN(target); 
            clearInterval(t); 
          }
          else {
            setN(Math.floor(start));
          }
        }, 25);
        obs.disconnect();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{n.toLocaleString("id-ID")}</span>;
}
