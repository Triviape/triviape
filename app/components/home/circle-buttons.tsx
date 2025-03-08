'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';

interface CircleButtonProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  cx: number;
  cy: number;
  r: number;
  isLoading?: boolean;
}

const CircleButton: React.FC<CircleButtonProps> = ({ 
  label, 
  icon, 
  color, 
  onClick, 
  cx, 
  cy, 
  r,
  isLoading = false
}) => {
  return (
    <g 
      onClick={!isLoading ? onClick : undefined} 
      style={{ cursor: isLoading ? 'wait' : 'pointer' }}
      className={cn(
        "transition-transform hover:scale-105",
        isLoading && "opacity-50 pointer-events-none"
      )}
    >
      <circle 
        cx={cx} 
        cy={cy} 
        r={r} 
        fill={color} 
        opacity={0.95}
        className="drop-shadow-lg"
      />
      <foreignObject 
        x={cx - 20} 
        y={cy - 30} 
        width={40} 
        height={40} 
        className="flex items-center justify-center text-center"
      >
        <div className="w-full h-full flex items-center justify-center text-white text-2xl">
          {isLoading ? (
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : icon}
        </div>
      </foreignObject>
      <text 
        x={cx} 
        y={cy + 25} 
        textAnchor="middle" 
        dominantBaseline="middle" 
        fill="white" 
        fontSize="16px"
        fontWeight="medium"
        className="drop-shadow-md"
      >
        {label}
      </text>
    </g>
  );
};

interface CircleButtonGroupProps {
  className?: string;
  onDailyClick?: () => void;
  onTeamClick?: () => void;
  onChallengeClick?: () => void;
  isLoading?: boolean;
}

export function CircleButtonGroup({ 
  className,
  onDailyClick,
  onTeamClick,
  onChallengeClick,
  isLoading = false
}: CircleButtonGroupProps) {
  return (
    <div className={cn("w-full", className)}>
      <svg 
        width="100%" 
        height="180" 
        viewBox="0 0 500 180" 
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
          </filter>
        </defs>
        
        <CircleButton 
          label="Daily" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          color="#3b82f6" 
          onClick={onDailyClick} 
          cx={150} 
          cy={90} 
          r={70} 
          isLoading={isLoading}
        />
        <CircleButton 
          label="Team" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          color="#22c55e" 
          onClick={onTeamClick} 
          cx={250} 
          cy={90} 
          r={70} 
          isLoading={isLoading}
        />
        <CircleButton 
          label="Challenge" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
              <path d="M15 7a5 5 0 0 0-5-5 5 5 0 0 0-5 5v1h10V7z" />
              <path d="M5 8v3a7 7 0 0 0 14 0V8" />
            </svg>
          }
          color="#f97316" 
          onClick={onChallengeClick} 
          cx={350} 
          cy={90} 
          r={70} 
          isLoading={isLoading}
        />
      </svg>
    </div>
  );
} 