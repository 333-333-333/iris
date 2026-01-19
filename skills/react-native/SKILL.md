---
name: react-native
description: >
  React Native patterns, components, and mobile development best practices.
  Trigger: When working with React Native components, navigation, or mobile-specific code.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  scope: [mobile]
  auto_invoke:
    - "Creating React Native components"
    - "Working with mobile navigation"
    - "Handling mobile-specific APIs"
---

## When to Use

- Creating or modifying React Native components
- Implementing navigation flows
- Handling platform-specific code (iOS/Android)
- Working with native modules
- Optimizing mobile performance

---

## Critical Patterns

### Component Structure

```javascript
// Functional components with hooks (preferred)
import { View, Text, StyleSheet } from 'react-native';

export function MyComponent({ title, onPress }) {
  const [state, setState] = useState(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
```

### Platform-Specific Code

```javascript
import { Platform } from 'react-native';

// Inline
const padding = Platform.OS === 'ios' ? 20 : 16;

// Platform.select
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 4 },
    }),
  },
});

// File-based: Component.ios.js / Component.android.js
```

### Safe Area Handling

```javascript
import { SafeAreaView } from 'react-native-safe-area-context';

// Always wrap root screens
export function Screen({ children }) {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
  );
}
```

---

## Performance Rules

| Rule | Why |
|------|-----|
| Use `FlatList` for lists | Virtualized, only renders visible items |
| Memoize callbacks with `useCallback` | Prevents unnecessary re-renders |
| Memoize expensive computations with `useMemo` | Avoids recalculation |
| Use `React.memo` for pure components | Skips re-render if props unchanged |
| Avoid inline styles | Creates new objects every render |

### FlatList Optimization

```javascript
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

---

## Accessibility

```javascript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Take photo"
  accessibilityHint="Captures image and describes it"
  accessibilityRole="button"
  onPress={handlePress}
>
  <Text>Capture</Text>
</TouchableOpacity>
```

| Prop | Purpose |
|------|---------|
| `accessible` | Groups children as single element |
| `accessibilityLabel` | Screen reader text |
| `accessibilityHint` | Describes result of action |
| `accessibilityRole` | Semantic type (button, link, image) |

---

## Common Hooks

```javascript
// Dimensions
import { useWindowDimensions } from 'react-native';
const { width, height } = useWindowDimensions();

// App State (foreground/background)
import { useAppState } from '@react-native-community/hooks';
const appState = useAppState(); // 'active' | 'background' | 'inactive'

// Keyboard
import { useKeyboard } from '@react-native-community/hooks';
const { keyboardShown, keyboardHeight } = useKeyboard();
```

---

## Commands

```bash
# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android

# Clear cache
npx react-native start --reset-cache

# Link native dependencies (pre-0.60)
npx react-native link

# Check for issues
npx react-native doctor
```

---

## Anti-patterns

| Don't | Do |
|-------|-----|
| `<ScrollView>` for long lists | `<FlatList>` or `<SectionList>` |
| Inline functions in render | `useCallback` or class methods |
| Direct state mutation | `setState` with new object/array |
| Ignoring keyboard | `KeyboardAvoidingView` or hooks |
| Hardcoded dimensions | `useWindowDimensions`, flex, % |
