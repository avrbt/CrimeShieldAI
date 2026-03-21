import React from 'react';

export function AshokaChakra({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      {/* Outer circle */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="#FF6EC7" strokeWidth="2"/>
      
      {/* Inner circle */}
      <circle cx="50" cy="50" r="8" fill="#FF6EC7"/>
      
      {/* 24 spokes */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 360) / 24;
        const rad = (angle * Math.PI) / 180;
        const x1 = 50 + 8 * Math.cos(rad);
        const y1 = 50 + 8 * Math.sin(rad);
        const x2 = 50 + 48 * Math.cos(rad);
        const y2 = 50 + 48 * Math.sin(rad);
        
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#FF6EC7"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}
