---
title: Component Composition Patterns
description: Patterns for composing React components in a scalable and maintainable way
created: 2025-03-11
updated: 2025-03-11
author: Frontend Architecture Team
status: approved
tags: [components, patterns, composition, react]
related:
  - ../../architecture/component-architecture.md
  - ./memoization.md
---

# Component Composition Patterns

## Overview

This document outlines the component composition patterns used in the Triviape application. These patterns encourage reusability, maintainability, and performance.

## Composition Principles

1. **Favor Composition Over Inheritance**: Build complex components by combining simpler ones
2. **Single Responsibility**: Each component should do one thing well
3. **Explicit Dependencies**: Props should clearly communicate dependencies
4. **Flexible Composition**: Allow different composition styles based on needs

## Common Composition Patterns

### 1. Children Props Pattern

The most basic composition pattern is using the `children` prop:

```tsx
// Base component
function Card({ children, className }: CardProps) {
  return (
    <div className={cn("card", className)}>
      {children}
    </div>
  );
}

// Usage
function ProfileCard() {
  return (
    <Card>
      <h2>User Profile</h2>
      <p>Profile details go here</p>
    </Card>
  );
}
```

### 2. Compound Components Pattern

For components with related subcomponents:

```tsx
// Compound component with subcomponents
function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Create context for tab state
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs-container">
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Subcomponents
Tabs.List = function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="tabs-list">{children}</div>;
};

Tabs.Tab = function Tab({ id, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  return (
    <button 
      className={activeTab === id ? 'active-tab' : 'tab'} 
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function TabPanel({ id, children }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== id) return null;
  return <div className="tab-panel">{children}</div>;
};

// Usage
function ProfileTabs() {
  return (
    <Tabs defaultTab="info">
      <Tabs.List>
        <Tabs.Tab id="info">Information</Tabs.Tab>
        <Tabs.Tab id="stats">Statistics</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel id="info">User information content</Tabs.Panel>
      <Tabs.Panel id="stats">User statistics content</Tabs.Panel>
    </Tabs>
  );
}
```

### 3. Render Props Pattern

For components that need to share logic:

```tsx
// Component that provides data via render prop
function UserData({ render }: { render: (data: UserData) => React.ReactNode }) {
  const { data, isLoading, error } = useUserData();
  
  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return <>{render(data)}</>;
}

// Usage
function UserProfile() {
  return (
    <UserData 
      render={(userData) => (
        <div className="profile">
          <h2>{userData.name}</h2>
          <p>{userData.bio}</p>
        </div>
      )}
    />
  );
}

// Alternative usage with children as a function
function UserData({ children }: { children: (data: UserData) => React.ReactNode }) {
  const { data, isLoading, error } = useUserData();
  
  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return <>{children(data)}</>;
}

function UserProfile() {
  return (
    <UserData>
      {(userData) => (
        <div className="profile">
          <h2>{userData.name}</h2>
          <p>{userData.bio}</p>
        </div>
      )}
    </UserData>
  );
}
```

### 4. Higher-Order Components (HOC) Pattern

For adding cross-cutting concerns:

```tsx
// HOC that adds authentication protection
function withAuth<P extends object>(Component: React.ComponentType<P>) {
  const WithAuth = (props: P) => {
    const { user, isLoading } = useAuth();
    
    if (isLoading) return <Loading />;
    if (!user) return <LoginRedirect />;
    
    return <Component {...props} />;
  };
  
  WithAuth.displayName = `WithAuth(${getDisplayName(Component)})`;
  return WithAuth;
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);

function getDisplayName<P>(Component: React.ComponentType<P>) {
  return Component.displayName || Component.name || 'Component';
}
```

### 5. Custom Hooks Pattern

For sharing stateful logic:

```tsx
// Custom hook for form field validation
function useFormField(initialValue: string, validate: (value: string) => string | null) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setError(validate(newValue));
  };
  
  return { value, error, handleChange };
}

// Usage in different components
function EmailField() {
  const email = useFormField('', (value) => {
    return !value.includes('@') ? 'Invalid email' : null;
  });
  
  return (
    <div>
      <input 
        type="email" 
        value={email.value} 
        onChange={email.handleChange} 
      />
      {email.error && <p className="error">{email.error}</p>}
    </div>
  );
}
```

## Component Composition Best Practices

### 1. Props Spreading

```tsx
// ❌ BAD: Blindly spreading unknown props
function Button(props) {
  return <button {...props} />;
}

// ✅ GOOD: Controlled props spreading
function Button({ className, ...rest }: ButtonProps) {
  return <button className={cn("btn", className)} {...rest} />;
}
```

### 2. Component API Design

```tsx
// ❌ BAD: Too many similar props
function Card({ padding, paddingTop, paddingBottom, paddingLeft, paddingRight }) {
  // ...
}

// ✅ GOOD: Simplified API with variants
function Card({ size = 'medium', variant = 'primary' }: CardProps) {
  return <div className={cn(`card-${variant}`, `card-${size}`)} />;
}
```

### 3. Composition vs. Configuration

```tsx
// ❌ BAD: Too much configuration
<Table 
  headers={['Name', 'Email']} 
  renderHeaderCell={(header) => <th>{header}</th>}
  renderRow={(row) => <tr>{row.map(cell => <td>{cell}</td>)}</tr>}
  data={users.map(u => [u.name, u.email])}
/>

// ✅ GOOD: Composition-based approach
<Table>
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Name</Table.HeaderCell>
      <Table.HeaderCell>Email</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {users.map(user => (
      <Table.Row key={user.id}>
        <Table.Cell>{user.name}</Table.Cell>
        <Table.Cell>{user.email}</Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table>
```

## Performance Considerations

### Memoization in Composition

Complex composed components should be memoized:

```tsx
// Memoizing a composed component
const MemoizedTabPanel = memoWithPerf(Tabs.Panel, { name: 'TabPanel' });

// Updating the component definition
Tabs.Panel = MemoizedTabPanel;
```

### Context Optimization

Use multiple contexts to avoid unnecessary re-renders:

```tsx
// ❌ BAD: Single context with everything
const AppContext = createContext({ user, theme, notifications });

// ✅ GOOD: Split contexts by update frequency
const UserContext = createContext(user);
const ThemeContext = createContext(theme);
const NotificationContext = createContext(notifications);
```

## Additional Resources

- [Component Architecture](../../architecture/component-architecture.md)
- [Memoization Patterns](./memoization.md)
- [React Composition Documentation](https://react.dev/learn/passing-props-to-a-component)

<!-- 
@schema: {
  "type": "pattern_document",
  "version": "1.0",
  "sections": ["overview", "principles", "patterns", "best_practices", "performance", "resources"]
}
--> 