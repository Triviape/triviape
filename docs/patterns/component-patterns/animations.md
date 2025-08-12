---
title: Animation Implementation Patterns
description: Patterns for implementing performance-optimized animations
created: 2025-03-11
updated: 2025-03-11
author: UI Team
status: approved
tags: [ui, animations, performance, rive, patterns]
related:
  - ../../architecture/performance-strategy.md
  - ../../reference/components/animation-components.md
---

# Animation Implementation Patterns

## Overview

This document outlines the animation patterns used in the Triviape application, focusing on performance-optimized implementations that adapt to device capabilities.

## Animation Types

The application uses several types of animations:

1. **Rive Animations**: Vector animations with interactive capabilities
2. **CSS Animations**: Simple UI transitions and effects
3. **Framer Motion**: Complex UI animations
4. **Canvas Animations**: Custom game animations

## Adaptive Animation Strategy

Animations adapt to device capabilities through the `useResponsiveUI` context:

```tsx
function SomeComponent() {
  const { deviceInfo, animationLevel } = useResponsiveUI();
  
  // Adjust animation complexity based on device capability
  // animationLevel: 'full' | 'reduced' | 'minimal'
  // devicePerformance: 'high' | 'medium' | 'low'
}
```

## Rive Animation Pattern

The recommended pattern for implementing Rive animations:

```tsx
import { RiveAnimation } from '@/app/components/animation/rive-animation';

function LoadingAnimation() {
  return (
    <RiveAnimation
      src="/animations/loading.riv"
      stateMachine="LoadingState"
      fallbackImageSrc="/images/loading-fallback.png"
      width={200}
      height={200}
      inputs={{
        isLoading: true
      }}
    />
  );
}
```

### Performance Features

The `RiveAnimation` component includes several performance optimizations:

1. **Adaptive Quality**: Reduces quality on lower-end devices
2. **Fallback Images**: Uses static images when animations would be too expensive
3. **Performance Monitoring**: Tracks frame drops and adapts in real-time
4. **Memory Management**: Properly disposes of animation resources

## CSS Animation Patterns

CSS animations should be used for simple UI effects:

```tsx
// Simple fade animation
const fadeIn = 'animate-fade-in';

// Animation with conditional application
const animateClass = shouldAnimate ? 'animate-slide-in' : '';

// Usage
<div className={cn("card", animateClass)}>
  Content
</div>
```

### CSS Animation Guidelines

1. **Use Tailwind Animations**: For consistency and performance
2. **Disable on Request**: Honor reduced motion preferences
3. **Avoid Animation Jank**: Use `will-change` sparingly and only for specific properties

```css
/* Example animation definition in globals.css */
@layer utilities {
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}
```

## Framer Motion Patterns

For more complex UI animations, Framer Motion is recommended:

```tsx
import { motion } from 'framer-motion';
import { useResponsiveUI } from '@/app/contexts/responsive-ui-context';

function AnimatedCard({ children }) {
  const { animationLevel } = useResponsiveUI();
  
  // Adjust animation complexity based on animation level
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: animationLevel === 'minimal' ? 0.1 : 0.3,
        ease: 'easeOut'
      }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className="card"
    >
      {children}
    </motion.div>
  );
}
```

## Performance Best Practices

### 1. Animation Optimization

```tsx
// ❌ BAD: Animating expensive properties
<div style={{ animation: 'move 1s infinite' }}>
  {/* Complex content */}
</div>

// ✅ GOOD: Using transform and opacity for animations
<div style={{ animation: 'transform-move 1s infinite' }}>
  {/* Complex content */}
</div>

@keyframes transform-move {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}
```

### 2. Conditional Animation

```tsx
// ❌ BAD: Always animating regardless of device capability
<AnimatedComponent />

// ✅ GOOD: Conditional animation based on device capability
function ResponsiveAnimation() {
  const { deviceInfo } = useResponsiveUI();
  
  if (deviceInfo.devicePerformance === 'low') {
    return <StaticComponent />;
  }
  
  return <AnimatedComponent />;
}
```

### 3. Animation Testing

Animations should be tested on various devices:

```tsx
// Development-only animation monitoring
{process.env.NODE_ENV === 'development' && (
  <div className="perf-monitor">
    FPS: {metrics.fps}
    Drops: {metrics.frameDrops}
  </div>
)}
```

## Accessibility Considerations

1. **Respect Reduced Motion**: Honor the `prefers-reduced-motion` media query
2. **Animation Purpose**: Only use animations that serve a purpose
3. **No Flashing Content**: Avoid content that flashes more than 3 times per second

```tsx
// Example of respecting reduced motion preferences
function ResponsiveAnimation() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  if (prefersReducedMotion) {
    return <StaticComponent />;
  }
  
  return <AnimatedComponent />;
}
```

## Additional Resources

- [Performance Strategy](../../architecture/performance-strategy.md)
- [Animation Components Reference](../../reference/components/animation-components.md)
- [Rive Documentation](https://rive.app/docs)

<!-- 
@schema: {
  "type": "pattern_document",
  "version": "1.0",
  "sections": ["overview", "types", "adaptive", "rive", "css", "framer", "performance", "accessibility", "resources"]
}
--> 