"use client";

import React from "react";

interface SacredIconProps {
  className?: string;
  glow?: boolean;
}

/**
 * Common Gold SVG Definitions for consistent, luxurious 24k Gold render
 */
export const GoldGradientDefs: React.FC = () => (
  <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
    <defs>
      {/* Primary Warm Gold Gradient */}
      <linearGradient id="kvGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF2A8" />
        <stop offset="30%" stopColor="#F5D061" />
        <stop offset="70%" stopColor="#E6B848" />
        <stop offset="100%" stopColor="#99701E" />
      </linearGradient>

      {/* Radiant Bright Gold Gradient */}
      <linearGradient id="kvGoldRadiant" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="50%" stopColor="#FFE885" />
        <stop offset="100%" stopColor="#C5A059" />
      </linearGradient>

      {/* Pure White Tiruman Gradient */}
      <linearGradient id="kvNamamWhite" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="70%" stopColor="#F8F8F5" />
        <stop offset="100%" stopColor="#E8E8E0" />
      </linearGradient>

      {/* Sacred Sricharanam Red-Gold Gradient */}
      <linearGradient id="kvNamamRed" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF4D4D" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>

      {/* Soft Glow Filter */}
      <filter id="kvGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      {/* Deep Aura Glow Filter */}
      <filter id="kvAuraGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComponentTransfer in="blur" result="brightBlur">
          <feFuncA type="linear" slope="0.6" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="brightBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

/**
 * 1. Sacred Garuda Swamy (24k Gold Winged Devotee in Namaskaram)
 */
export const SacredGaruda: React.FC<SacredIconProps> = ({ className = "w-16 h-24", glow = true }) => {
  return (
    <svg
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      filter={glow ? "url(#kvGoldGlow)" : undefined}
      aria-label="Sacred Garuda Swamy"
    >
      {/* Crown */}
      <path d="M 52 10 L 62 26 L 42 26 Z" fill="url(#kvGoldRadiant)" stroke="url(#kvGoldGradient)" strokeWidth="1.5" />
      <path d="M 52 2 L 56 10 L 48 10 Z" fill="url(#kvNamamRed)" />
      <circle cx="52" cy="18" r="2.5" fill="#FFF" />

      {/* Wings */}
      <path
        d="M 44 32 C 18 24, 2 48, 8 98 C 20 78, 34 60, 48 56 Z"
        fill="url(#kvNamamWhite)"
        stroke="url(#kvGoldGradient)"
        strokeWidth="2"
      />
      <path d="M 14 55 Q 32 55 44 50" stroke="url(#kvGoldRadiant)" strokeWidth="1.5" />
      <path d="M 18 72 Q 34 68 46 62" stroke="url(#kvGoldRadiant)" strokeWidth="1.5" />

      {/* Head & Profile */}
      <path
        d="M 48 26 C 58 26, 66 32, 66 38 C 66 42, 74 44, 78 43 C 82 42, 82 46, 76 49 C 68 52, 60 52, 54 50 L 48 38 Z"
        fill="url(#kvGoldGradient)"
        stroke="url(#kvGoldRadiant)"
        strokeWidth="2"
      />
      <circle cx="62" cy="34" r="2" fill="#0A0A0A" />

      {/* Hands in Namaskaram */}
      <path d="M 54 56 L 82 48 L 84 54 L 56 64 Z" fill="url(#kvGoldRadiant)" stroke="url(#kvGoldGradient)" strokeWidth="1.5" />

      {/* Kneeling Body & Dhoti */}
      <path
        d="M 54 74 C 54 92, 34 96, 26 112 C 22 124, 38 132, 70 132 C 76 132, 80 124, 72 114 C 64 104, 56 90, 54 74 Z"
        fill="url(#kvGoldGradient)"
        stroke="url(#kvGoldRadiant)"
        strokeWidth="2"
      />
      <path d="M 40 102 Q 58 106 72 98" stroke="url(#kvNamamRed)" strokeWidth="3" fill="none" />

      {/* Base */}
      <rect x="22" y="132" width="60" height="6" rx="3" fill="url(#kvGoldGradient)" stroke="url(#kvGoldRadiant)" strokeWidth="1" />
    </svg>
  );
};

/**
 * 2. Sacred Sudarshana Chakra (24k Gold Discus on Pedestal)
 */
export const SacredChakra: React.FC<SacredIconProps> = ({ className = "w-16 h-24", glow = true }) => {
  return (
    <svg
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      filter={glow ? "url(#kvGoldGlow)" : undefined}
      aria-label="Sacred Sudarshana Chakra"
    >
      {/* Flame Crest */}
      <path d="M 50 14 Q 56 4 50 0 Q 44 4 50 14 Z" fill="url(#kvNamamRed)" stroke="url(#kvGoldRadiant)" strokeWidth="1" />
      <circle cx="50" cy="14" r="3" fill="url(#kvGoldGradient)" />

      {/* Outer Discus Ring */}
      <circle cx="50" cy="58" r="38" stroke="url(#kvGoldGradient)" strokeWidth="3" fill="none" />
      <circle cx="50" cy="58" r="30" stroke="url(#kvGoldRadiant)" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />

      {/* Inner Hub */}
      <circle cx="50" cy="58" r="12" fill="url(#kvGoldGradient)" />
      <circle cx="50" cy="58" r="6" fill="#0A0A0A" />

      {/* 8 Radiant Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 50 58)`}>
          <line x1="50" y1="20" x2="50" y2="46" stroke="url(#kvGoldGradient)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 50 16 L 54 22 L 46 22 Z" fill="url(#kvNamamRed)" />
        </g>
      ))}

      {/* Pedestal Base */}
      <path d="M 44 112 Q 50 120 56 112 Z" fill="url(#kvNamamRed)" />
      <rect x="28" y="122" width="44" height="6" rx="2" fill="url(#kvGoldGradient)" stroke="url(#kvGoldRadiant)" strokeWidth="1" />
      <rect x="20" y="128" width="60" height="8" rx="3" fill="url(#kvGoldRadiant)" stroke="url(#kvGoldGradient)" strokeWidth="1" />
    </svg>
  );
};

/**
 * 3. Sacred Tirumala Namam (Solid Pure White Tiruman & Kasthuri Sricharanam)
 */
export const SacredNamam: React.FC<SacredIconProps> = ({ className = "w-20 h-28", glow = true }) => {
  return (
    <svg
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      filter={glow ? "url(#kvGoldGlow)" : undefined}
      aria-label="Sacred Namam"
    >
      {/* Outer White Tiruman U-Shape */}
      <path
        d="M 18 10 
           C 20 60, 28 105, 50 118 
           C 72 105, 80 60, 82 10 
           L 68 10 
           C 66 50, 60 90, 50 100 
           C 40 90, 34 50, 32 10 
           Z"
        fill="url(#kvNamamWhite)"
        stroke="url(#kvGoldRadiant)"
        strokeWidth="2"
      />
      
      {/* Center Kasthuri Sricharanam */}
      <path
        d="M 45 4 
           L 55 4 
           L 55 96 
           C 55 101, 53 106, 50 109 
           C 47 106, 45 101, 45 96 
           Z"
        fill="url(#kvNamamRed)"
        stroke="url(#kvGoldGradient)"
        strokeWidth="1.2"
      />

      {/* Base Kasturi Dot */}
      <circle cx="50" cy="115" r="4" fill="#FFFFFF" stroke="url(#kvGoldRadiant)" strokeWidth="1.5" />

      {/* Pedestal Base */}
      <rect x="28" y="124" width="44" height="6" rx="2" fill="url(#kvGoldGradient)" stroke="url(#kvGoldRadiant)" strokeWidth="1" />
      <rect x="20" y="130" width="60" height="8" rx="3" fill="url(#kvGoldRadiant)" stroke="url(#kvGoldGradient)" strokeWidth="1" />
    </svg>
  );
};

/**
 * 4. Sacred Panchajanya Shanku (Solid Pure White Conch on Pedestal)
 */
export const SacredShanku: React.FC<SacredIconProps> = ({ className = "w-16 h-24", glow = true }) => {
  return (
    <svg
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      filter={glow ? "url(#kvGoldGlow)" : undefined}
      aria-label="Sacred Shanku Conch"
    >
      {/* Flame Crest */}
      <path d="M 50 14 Q 56 4 50 0 Q 44 4 50 14 Z" fill="url(#kvNamamRed)" stroke="url(#kvGoldRadiant)" strokeWidth="1" />
      <circle cx="50" cy="14" r="3" fill="url(#kvGoldGradient)" />

      {/* Conch Shell Silhouette */}
      <path
        d="M 50 18 
           C 68 18, 88 32, 84 56 
           C 81 76, 62 96, 45 102 
           C 34 105, 20 96, 16 82 
           C 12 68, 19 54, 30 48 
           C 41 42, 54 44, 58 53 
           C 61 60, 56 68, 47 70"
        fill="url(#kvNamamWhite)"
        stroke="url(#kvGoldGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Spiral Grooves */}
      <path d="M 68 36 Q 80 48 74 66" stroke="url(#kvGoldRadiant)" strokeWidth="1.8" fill="none" />
      <path d="M 60 30 Q 72 40 66 56" stroke="url(#kvGoldRadiant)" strokeWidth="1.5" fill="none" />

      {/* Pedestal Base */}
      <path d="M 44 112 Q 50 120 56 112 Z" fill="url(#kvNamamRed)" />
      <rect x="28" y="122" width="44" height="6" rx="2" fill="url(#kvGoldGradient)" stroke="url(#kvGoldRadiant)" strokeWidth="1" />
      <rect x="20" y="128" width="60" height="8" rx="3" fill="url(#kvGoldRadiant)" stroke="url(#kvGoldGradient)" strokeWidth="1" />
    </svg>
  );
};

/**
 * 5. Sacred Hanuman Swamy (24k Gold Anjaneya Devotee in Namaskaram)
 */
export const SacredHanuman: React.FC<SacredIconProps> = ({ className = "w-16 h-24", glow = true }) => {
  return (
    <svg
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      filter={glow ? "url(#kvGoldGlow)" : undefined}
      aria-label="Sacred Hanuman Swamy"
    >
      {/* Crown */}
      <path d="M 48 10 L 38 26 L 58 26 Z" fill="url(#kvGoldRadiant)" stroke="url(#kvGoldGradient)" strokeWidth="1.5" />
      <path d="M 48 2 L 44 10 L 52 10 Z" fill="url(#kvNamamRed)" />
      <circle cx="48" cy="18" r="2.5" fill="#FFF" />

      {/* Arcing Tail */}
      <path
        d="M 52 74 C 74 70, 96 52, 92 24 C 88 4, 72 6, 78 16 Q 84 10 88 24 C 90 44, 72 60, 52 66"
        stroke="url(#kvGoldRadiant)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="78" cy="16" r="3" fill="url(#kvGoldGradient)" />

      {/* Head & Profile */}
      <path
        d="M 52 26 C 42 26, 34 32, 34 38 C 34 42, 26 44, 22 43 C 18 42, 18 46, 24 49 C 32 52, 40 52, 46 50 L 52 38 Z"
        fill="url(#kvGoldGradient)"
        stroke="url(#kvGoldRadiant)"
        strokeWidth="2"
      />
      <circle cx="38" cy="34" r="2" fill="#0A0A0A" />

      {/* Hands in Namaskaram */}
      <path d="M 46 56 L 18 48 L 16 54 L 44 64 Z" fill="url(#kvGoldRadiant)" stroke="url(#kvGoldGradient)" strokeWidth="1.5" />

      {/* Kneeling Body & Dhoti */}
      <path
        d="M 46 74 C 46 92, 66 96, 74 112 C 78 124, 62 132, 30 132 C 24 132, 20 124, 28 114 C 36 104, 44 90, 46 74 Z"
        fill="url(#kvGoldGradient)"
        stroke="url(#kvGoldRadiant)"
        strokeWidth="2"
      />
      <path d="M 60 102 Q 42 106 28 98" stroke="url(#kvNamamRed)" strokeWidth="3" fill="none" />

      {/* Base */}
      <rect x="18" y="132" width="60" height="6" rx="3" fill="url(#kvGoldGradient)" stroke="url(#kvGoldRadiant)" strokeWidth="1" />
    </svg>
  );
};

/**
 * Ananda Nilayam Gopuram Silhouette (Tirumala Temple Gopuram Outline)
 */
export const TirumalaGopuramSilhouette: React.FC<SacredIconProps> = ({ className = "w-32 h-32", glow = true }) => {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      filter={glow ? "url(#kvAuraGlow)" : undefined}
      aria-label="Ananda Nilayam Gopuram Silhouette"
    >
      {/* Kalasam Crest at top */}
      <path d="M 80 12 L 83 24 L 77 24 Z" fill="url(#kvGoldRadiant)" />
      <circle cx="80" cy="10" r="2.5" fill="url(#kvGoldGradient)" />

      {/* Tier 1 Top Spire */}
      <path d="M 72 24 L 88 24 L 85 38 L 75 38 Z" fill="url(#kvGoldGradient)" opacity="0.9" />

      {/* Tier 2 Middle Layer */}
      <path
        d="M 66 40 L 94 40 L 91 58 L 69 58 Z"
        stroke="url(#kvGoldRadiant)"
        strokeWidth="1.5"
        fill="url(#kvGoldGradient)"
        fillOpacity="0.15"
      />

      {/* Tier 3 Main Gopuram Tier */}
      <path
        d="M 58 60 L 102 60 L 98 84 L 62 84 Z"
        stroke="url(#kvGoldGradient)"
        strokeWidth="1.5"
        fill="url(#kvGoldGradient)"
        fillOpacity="0.2"
      />

      {/* Tier 4 Base Tier */}
      <path
        d="M 48 86 L 112 86 L 108 116 L 52 116 Z"
        stroke="url(#kvGoldRadiant)"
        strokeWidth="1.8"
        fill="url(#kvGoldGradient)"
        fillOpacity="0.25"
      />

      {/* Sacred Archway Entry */}
      <path d="M 68 116 Q 80 100 92 116" stroke="url(#kvGoldRadiant)" strokeWidth="2" fill="none" />

      {/* Decorative Ornate Horizontal Bands */}
      <line x1="60" y1="72" x2="100" y2="72" stroke="url(#kvGoldGradient)" strokeWidth="1" />
      <line x1="52" y1="100" x2="108" y2="100" stroke="url(#kvGoldGradient)" strokeWidth="1" />
    </svg>
  );
};
