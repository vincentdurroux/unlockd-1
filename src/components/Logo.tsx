import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export function Logo({ className, showTagline = false }: LogoProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <img 
        src="/logo.png" 
        alt="Unlock'd Logo" 
        className="h-10 md:h-12 w-auto object-contain"
        referrerPolicy="no-referrer"
      />

      {showTagline && (
        <p className="text-[11px] md:text-[14px] font-bold text-slate-400 mt-2 tracking-wide uppercase">
          Unlock your <span className="text-brand-blue">new city</span> together.
        </p>
      )}
    </div>
  );
}
