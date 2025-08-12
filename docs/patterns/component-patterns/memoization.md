---
title: Component Memoization Patterns
description: Guidelines for efficient component rendering with memoization
created: 2025-03-11
updated: 2025-03-11
author: Performance Team
status: approved
tags: [performance, components, optimization, memoization]
related:
  - ../../architecture/performance-strategy.md
  - ../../reference/utilities/performance-utils.md
---

# Component Memoization Patterns

## Overview

This document covers the memoization patterns used in the Triviape application to optimize component rendering performance.

## When to Use Memoization

Memoization should be applied to components that meet one or more of these criteria:

✅ **Components with expensive render logic**
✅ **Components that render frequently but rarely need to update**
✅ **Components deep in the component tree**
✅ **Components that receive complex props but don't need to re-render when those props don't change semantically**

Memoization should NOT be applied to:

❌ **Simple components with minimal rendering logic**
❌ **Components that update frequently with different props**
❌ **Components where the overhead of comparison exceeds the render cost**

## Memoization Utilities

### memoWithPerf

The primary utility for memoizing components with performance tracking:

```tsx
import { memoWithPerf } from '@/app/lib/componentUtils';

// Before memoization
function ExpensiveComponent(props) {
  // Expensive rendering logic
  return <div>{/* Component JSX */}</div>;
}

// After memoization
const MemoizedComponent = memoWithPerf(ExpensiveComponent, {
  name: 'ExpensiveComponent', // Name for performance tracking
  warnAfterRenders: 3,        // Warn if component re-renders more than 3 times
  trackRenders: true,         // Track render performance
  areEqual: customCompare     // Optional custom comparison function
});

// Usage
function ParentComponent() {
  return <MemoizedComponent prop1="value" prop2={object} />;
}
```

### Custom Comparison Functions

For components with complex props, you can provide a custom comparison function:

```tsx
// Custom comparison function for MemoWithPerf
function arePropsEqual(prevProps, nextProps) {
  // Simple comparison for primitive props
  if (prevProps.id !== nextProps.id) return false;
  
  // Deep comparison for objects
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
}

const MemoizedComponent = memoWithPerf(MyComponent, {
  name: 'MyComponent',
  areEqual: arePropsEqual
});
```

## Common Patterns

### 1. Memoized UI Components

UI components that don't change frequently:

```tsx
// Card component with memoization
function CardBase({ title, content, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      <h2>{title}</h2>
      <p>{content}</p>
    </div>
  );
}

export const Card = memoWithPerf(CardBase, { name: 'Card' });
```

### 2. List Item Components

Components rendered in lists should almost always be memoized:

```tsx
// List item with memoization
function QuizItemBase({ quiz, onSelect }) {
  return (
    <li className="quiz-item" onClick={() => onSelect(quiz.id)}>
      <h3>{quiz.title}</h3>
      <span>{quiz.questionCount} questions</span>
    </li>
  );
}

export const QuizItem = memoWithPerf(QuizItemBase, { name: 'QuizItem' });

// Usage in list
function QuizList({ quizzes, onSelectQuiz }) {
  return (
    <ul>
      {quizzes.map(quiz => (
        <QuizItem 
          key={quiz.id} 
          quiz={quiz} 
          onSelect={onSelectQuiz} // Use useCallback in parent!
        />
      ))}
    </ul>
  );
}
```

### 3. Animation Components

Components with complex animations:

```tsx
// Animation component with memoization
function RiveAnimationBase(props) {
  // ... Rive animation implementation
  return <div>{/* Animation content */}</div>;
}

export const RiveAnimation = memoWithPerf(RiveAnimationBase, {
  name: 'RiveAnimation',
  warnAfterRenders: 3
});
```

## Anti-Patterns to Avoid

### 1. Inline Object Creation

```tsx
// ❌ BAD: New object created on every render
function Parent() {
  return <MemoizedChild data={{ name: 'John' }} />;
}

// ✅ GOOD: Object created once
function Parent() {
  const data = useMemo(() => ({ name: 'John' }), []);
  return <MemoizedChild data={data} />;
}
```

### 2. Inline Function Creation

```tsx
// ❌ BAD: New function created on every render
function Parent() {
  return <MemoizedButton onClick={() => console.log('clicked')} />;
}

// ✅ GOOD: Function memoized with useCallback
function Parent() {
  const handleClick = useCallback(() => console.log('clicked'), []);
  return <MemoizedButton onClick={handleClick} />;
}
```

### 3. Over-Memoization

```tsx
// ❌ BAD: Simple component doesn't need memoization
const MemoizedSpan = memoWithPerf(({ text }) => <span>{text}</span>, { name: 'Span' });

// ✅ GOOD: Only memoize complex components
function ExpensiveChart({ data }) {
  // Complex rendering logic
}
const MemoizedChart = memoWithPerf(ExpensiveChart, { name: 'Chart' });
```

## Performance Monitoring

The `memoWithPerf` utility includes built-in performance monitoring:

1. **Render Count Tracking**: In development, tracks number of renders
2. **Warning Thresholds**: Warns when components re-render excessively
3. **Performance Metrics**: Measures render duration and frequency

## Additional Resources

- [Performance Strategy](../../architecture/performance-strategy.md)
- [Performance Utilities Reference](../../reference/utilities/performance-utils.md)
- [Performance Tuning Guide](../../guides/developer/performance-tuning.md)

<!-- 
@schema: {
  "type": "pattern_document",
  "version": "1.0",
  "sections": ["overview", "when_to_use", "utilities", "patterns", "anti_patterns", "monitoring", "resources"]
}
--> 