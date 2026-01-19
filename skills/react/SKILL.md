---
name: react
description: >
  Core React patterns, hooks, state management, and best practices.
  Trigger: When working with React components, hooks, or state management.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  scope: [mobile]
  auto_invoke:
    - "Creating React components"
    - "Working with React hooks"
    - "Managing component state"
---

## When to Use

- Creating or refactoring React components
- Implementing custom hooks
- Managing state (local, context, or global)
- Optimizing component performance
- Handling side effects

---

## Critical Patterns

### Functional Components (Always)

```javascript
// Good: Functional component with hooks
export function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  if (!user) return <Loading />;
  return <ProfileCard user={user} />;
}

// Bad: Class components (legacy)
class UserProfile extends React.Component { /* ... */ }
```

### Component Organization

```javascript
// Single component file structure
import { useState, useEffect, useCallback } from 'react';

// 1. Types/interfaces (if TypeScript)
// 2. Component
export function MyComponent({ prop1, prop2, onAction }) {
  // 3. Hooks (state, refs, context, custom)
  const [state, setState] = useState(null);
  const ref = useRef(null);
  
  // 4. Derived state / memos
  const computed = useMemo(() => /* ... */, [dep]);
  
  // 5. Callbacks
  const handleClick = useCallback(() => {
    onAction(state);
  }, [state, onAction]);
  
  // 6. Effects
  useEffect(() => {
    // setup
    return () => { /* cleanup */ };
  }, []);

  // 7. Early returns (loading, error)
  if (!state) return null;

  // 8. Render
  return <View />;
}

// 9. Styles (if colocated)
```

---

## Hooks

### useState

```javascript
// Simple state
const [count, setCount] = useState(0);

// Object state (always spread)
const [form, setForm] = useState({ name: '', email: '' });
setForm(prev => ({ ...prev, name: 'John' }));

// Lazy initialization (expensive computation)
const [data, setData] = useState(() => computeExpensiveValue());
```

### useEffect

```javascript
// Mount only
useEffect(() => {
  init();
}, []);

// With cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);

// With dependencies
useEffect(() => {
  fetchData(id);
}, [id]);

// NEVER: missing dependencies or lying about them
useEffect(() => {
  doSomething(value); // ESLint will warn
}, []); // Bad: value is used but not listed
```

### useCallback

```javascript
// Memoize functions passed to children
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);

// Without useCallback: new function every render = child re-renders
<ChildComponent onPress={() => doSomething(id)} /> // Bad
<ChildComponent onPress={handlePress} /> // Good
```

### useMemo

```javascript
// Expensive computations
const sortedList = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// Object references for dependencies
const config = useMemo(() => ({
  threshold: 0.5,
  maxItems: 10,
}), []);
```

### useRef

```javascript
// DOM/component references
const inputRef = useRef(null);
inputRef.current?.focus();

// Mutable values that don't trigger re-render
const renderCount = useRef(0);
renderCount.current += 1;

// Previous value pattern
const prevValue = useRef(value);
useEffect(() => {
  prevValue.current = value;
}, [value]);
```

### useContext

```javascript
// Create context
const ThemeContext = createContext(null);

// Provider
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook (preferred over direct useContext)
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

---

## Custom Hooks

### Pattern

```javascript
// hooks/useAsync.js
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState(s => ({ ...s, loading: true }));
    
    asyncFn()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, deps);

  return state;
}

// Usage
const { data, loading, error } = useAsync(() => fetchUser(id), [id]);
```

### Naming Convention

| Hook | Purpose |
|------|---------|
| `useUser` | Fetch/manage user data |
| `useToggle` | Boolean toggle state |
| `useDebounce` | Debounced value |
| `useLocalStorage` | Persist to storage |
| `useVoiceCommands` | Domain-specific hook |

---

## State Management Decision Tree

```
Is state used by one component only?
  → useState

Is state shared by parent-child?
  → Props + callbacks (lift state up)

Is state shared by siblings?
  → Lift to common parent, or Context

Is state global / deeply nested consumers?
  → Context + useReducer, or Zustand/Jotai

Is state server data?
  → React Query / TanStack Query
```

---

## Performance

### React.memo

```javascript
// Wrap pure components that receive same props often
export const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
});

// Custom comparison
export const Component = React.memo(MyComponent, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
});
```

### Avoid Re-renders

```javascript
// Bad: inline objects create new reference every render
<Component style={{ flex: 1 }} />
<Component config={{ theme: 'dark' }} />

// Good: stable references
const style = useMemo(() => ({ flex: 1 }), []);
const config = useMemo(() => ({ theme }), [theme]);
```

### Code Splitting

```javascript
// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyChart />
    </Suspense>
  );
}
```

---

## Anti-patterns

| Don't | Do | Why |
|-------|-----|-----|
| Mutate state directly | Use setState with new object | React won't detect changes |
| useEffect for derived state | useMemo | Unnecessary render cycle |
| Fetch in useEffect without cleanup | Use abort controller or React Query | Race conditions |
| Index as key in dynamic lists | Unique stable ID | Causes bugs on reorder |
| Prop drilling 5+ levels | Context or composition | Hard to maintain |
| God components (500+ lines) | Split into smaller components | Unreadable |

---

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.jsx` |
| Hooks | camelCase with `use` prefix | `useAuth.js` |
| Utils | camelCase | `formatDate.js` |
| Constants | UPPER_SNAKE or camelCase | `API_URL` or `routes.js` |
| Types | PascalCase | `User.ts` |
