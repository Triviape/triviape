'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { cn } from '@/app/lib/utils';

interface CharacterAnimationProps {
  className?: string;
  isQuizMode?: boolean;
  position?: 'center' | 'bottom-right';
}

export function CharacterAnimation({ 
  className, 
  isQuizMode = false,
  position = 'center'
}: CharacterAnimationProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Try different state machine names since we don't know the exact one
  const stateMachineNames = ['State Machine', 'Main', 'Animation', 'Default'];
  
  const { rive, RiveComponent } = useRive({
    src: '/stage_base.riv',
    stateMachines: stateMachineNames,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoad: () => {
      setIsLoaded(true);
      console.log('Rive file loaded successfully');
    },
    onLoadError: (err) => {
      console.error('Error loading Rive file:', err);
    },
  });
  
  // Call all hooks explicitly at the top level
  // For "talking" input across all state machines
  const talkingSM1 = useStateMachineInput(rive, 'State Machine', 'talking', false);
  const talkingSM2 = useStateMachineInput(rive, 'Main', 'talking', false);
  const talkingSM3 = useStateMachineInput(rive, 'Animation', 'talking', false);
  const talkingSM4 = useStateMachineInput(rive, 'Default', 'talking', false);
  
  // For "quizMode" input across all state machines
  const quizModeSM1 = useStateMachineInput(rive, 'State Machine', 'quizMode', false);
  const quizModeSM2 = useStateMachineInput(rive, 'Main', 'quizMode', false);
  const quizModeSM3 = useStateMachineInput(rive, 'Animation', 'quizMode', false);
  const quizModeSM4 = useStateMachineInput(rive, 'Default', 'quizMode', false);
  
  // Find the first valid input for each type
  const talkingInput = talkingSM1 || talkingSM2 || talkingSM3 || talkingSM4 || null;
  const quizModeInput = quizModeSM1 || quizModeSM2 || quizModeSM3 || quizModeSM4 || null;
  
  // Update animation state based on props
  useEffect(() => {
    if (quizModeInput && isQuizMode !== undefined) {
      quizModeInput.value = isQuizMode;
    }
  }, [isQuizMode, quizModeInput]);
  
  // Function to trigger talking animation
  const startTalking = () => {
    if (talkingInput) {
      talkingInput.value = true;
      
      // Reset after animation completes
      setTimeout(() => {
        if (talkingInput) {
          talkingInput.value = false;
        }
      }, 3000); // Adjust timing as needed
    }
  };
  
  // Determine position classes based on the position prop
  const positionClasses = position === 'bottom-right' 
    ? "absolute bottom-4 right-4 w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48" 
    : "w-full h-full";
  
  return (
    <div 
      className={cn(
        "relative",
        !isLoaded && "flex items-center justify-center bg-gray-800/50 rounded-full",
        positionClasses,
        className
      )}
      onClick={startTalking}
    >
      {!isLoaded && (
        <div className="animate-pulse text-white">Loading character...</div>
      )}
      <RiveComponent className="w-full h-full" />
    </div>
  );
} 