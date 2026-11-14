"use client";

import React, { useState } from 'react';
import CountUp from './CountUp';
import DistributionMapModal from './distribution-map-modal';
import { Map } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ImpactMetricsDisplay({
  metrics,
  variant = 'hero',
  points
}: {
  metrics: any[],
  variant?: 'hero' | 'section',
  points?: any[]
}) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <>
      {variant === 'hero' ? (
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((d: any, i: number) => {
            const isMapTrigger = d.metric_key?.includes('province') || d.label.toLowerCase().includes('provinsi');
            
            return (
              <div 
                key={i} 
                onClick={() => isMapTrigger && setIsMapOpen(true)}
                className={cn(
                  "bg-white/5 border border-white/10 rounded-xl p-5 text-center transition-all relative overflow-hidden",
                  isMapTrigger && "cursor-pointer hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 group"
                )}
              >
                <div className="font-cabin text-[28px] font-bold text-white relative z-10">
                  <CountUp target={Number(d.value)} />{d.suffix}
                </div>
                <div className="text-[12.5px] text-white/65 mt-1 relative z-10">{d.label}</div>
                
                {isMapTrigger && (
                  <div className="absolute top-2 right-2 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Map size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((d: any, i: number) => {
            const isMapTrigger = d.metric_key?.includes('province') || d.label.toLowerCase().includes('provinsi');
            
            return (
              <div 
                key={i}
                onClick={() => isMapTrigger && setIsMapOpen(true)}
                className={cn(
                  "bg-white/10 border border-white/10 rounded-xl py-8 px-6 text-center transition-all relative overflow-hidden",
                  isMapTrigger && "cursor-pointer hover:bg-white/20 hover:border-white/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 group"
                )}
              >
                <div className="font-cabin text-[36px] font-bold text-white relative z-10">
                  <CountUp target={Number(d.value)} />{d.suffix}
                </div>
                <div className="text-[14px] text-white/70 mt-2 relative z-10">{d.label}</div>
                
                {isMapTrigger && (
                  <div className="absolute top-3 right-3 text-white/50 bg-black/10 p-2 rounded-full opacity-50 group-hover:opacity-100 group-hover:bg-[#76b541] group-hover:text-white transition-all">
                    <Map size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DistributionMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        metrics={metrics}
        points={points}
      />
    </>
  );
}
