---
name: atomic-design
description: >
  Atomic Design methodology for building component hierarchies in React.
  Trigger: When creating UI components, organizing component libraries, or structuring presentation layer.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  scope: [mobile]
  auto_invoke:
    - "Creating UI components"
    - "Organizing component hierarchy"
    - "Building design system"
---

## When to Use

- Creating new UI components
- Deciding where a component belongs
- Building reusable component libraries
- Structuring the presentation layer
- Reviewing component architecture

---

## Atomic Design Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                       PAGES                              │
│              Complete screens/views                      │
├─────────────────────────────────────────────────────────┤
│                     TEMPLATES                            │
│           Page layouts without real data                 │
├─────────────────────────────────────────────────────────┤
│                     ORGANISMS                            │
│         Complex components (forms, headers)              │
├─────────────────────────────────────────────────────────┤
│                     MOLECULES                            │
│      Simple groups of atoms (input + label)              │
├─────────────────────────────────────────────────────────┤
│                       ATOMS                              │
│     Basic building blocks (button, text, icon)           │
└─────────────────────────────────────────────────────────┘
```

---

## Component Levels

### Atoms

**Smallest building blocks. Cannot be broken down further.**

```javascript
// atoms/Button.jsx
export function Button({ label, onPress, variant = 'primary', disabled }) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

// atoms/Icon.jsx
export function Icon({ name, size = 24, color = '#000' }) {
  return <IconComponent name={name} size={size} color={color} />;
}

// atoms/Text.jsx
export function Typography({ variant = 'body', children, ...props }) {
  return <Text style={[styles.base, styles[variant]]} {...props}>{children}</Text>;
}

// atoms/Spacer.jsx
export function Spacer({ size = 'md' }) {
  const sizes = { sm: 8, md: 16, lg: 24, xl: 32 };
  return <View style={{ height: sizes[size] }} />;
}
```

**Examples**: Button, Text, Icon, Input, Image, Spacer, Divider, Badge

---

### Molecules

**Simple groups of atoms functioning together.**

```javascript
// molecules/IconButton.jsx
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export function IconButton({ icon, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Icon name={icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

// molecules/InputField.jsx
import { Typography } from '../atoms/Typography';
import { TextInput } from '../atoms/TextInput';

export function InputField({ label, error, ...inputProps }) {
  return (
    <View>
      <Typography variant="label">{label}</Typography>
      <TextInput {...inputProps} hasError={!!error} />
      {error && <Typography variant="error">{error}</Typography>}
    </View>
  );
}

// molecules/StatusIndicator.jsx
export function StatusIndicator({ status, message }) {
  return (
    <View style={styles.container}>
      <Icon name={statusIcons[status]} color={statusColors[status]} />
      <Typography>{message}</Typography>
    </View>
  );
}
```

**Examples**: Search input, Navigation link, Card header, List item, Form field

---

### Organisms

**Complex components composed of molecules and atoms.**

```javascript
// organisms/VoiceCommandPanel.jsx
import { StatusIndicator } from '../molecules/StatusIndicator';
import { IconButton } from '../molecules/IconButton';
import { Typography } from '../atoms/Typography';

export function VoiceCommandPanel({ 
  isListening, 
  lastCommand, 
  onActivate,
  onDeactivate 
}) {
  return (
    <View style={styles.panel}>
      <Typography variant="heading">Comandos de Voz</Typography>
      
      <StatusIndicator 
        status={isListening ? 'active' : 'idle'}
        message={isListening ? 'Escuchando...' : 'Di "Iris" para activar'}
      />
      
      {lastCommand && (
        <View style={styles.lastCommand}>
          <Typography variant="label">Último comando:</Typography>
          <Typography>{lastCommand}</Typography>
        </View>
      )}
      
      <IconButton
        icon={isListening ? 'mic-off' : 'mic'}
        label={isListening ? 'Detener' : 'Activar'}
        onPress={isListening ? onDeactivate : onActivate}
      />
    </View>
  );
}

// organisms/CameraPreview.jsx
export function CameraPreview({ onCapture, isAnalyzing }) {
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} />
      <View style={styles.overlay}>
        {isAnalyzing && <LoadingIndicator message="Analizando..." />}
        <CaptureButton onPress={onCapture} disabled={isAnalyzing} />
      </View>
    </View>
  );
}

// organisms/DescriptionCard.jsx
export function DescriptionCard({ description, timestamp, onRepeat }) {
  return (
    <Card>
      <CardHeader>
        <Typography variant="label">Descripción</Typography>
        <Typography variant="caption">{formatTime(timestamp)}</Typography>
      </CardHeader>
      <CardBody>
        <Typography>{description}</Typography>
      </CardBody>
      <CardFooter>
        <IconButton icon="repeat" label="Repetir" onPress={onRepeat} />
      </CardFooter>
    </Card>
  );
}
```

**Examples**: Header, Navigation bar, Form, Card, Modal, List with items

---

### Templates

**Page-level layouts. Define structure, receive content via props/children.**

```javascript
// templates/MainLayout.jsx
import { SafeAreaView } from 'react-native-safe-area-context';

export function MainLayout({ header, content, footer }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>{header}</View>
      <View style={styles.content}>{content}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  );
}

// templates/CameraLayout.jsx
export function CameraLayout({ camera, overlay, controls }) {
  return (
    <View style={styles.fullScreen}>
      <View style={styles.cameraContainer}>{camera}</View>
      <View style={styles.overlay}>{overlay}</View>
      <View style={styles.controls}>{controls}</View>
    </View>
  );
}
```

**Examples**: Dashboard layout, Auth layout, Camera layout, Settings layout

---

### Pages (Screens)

**Complete screens with real data and business logic.**

```javascript
// pages/HomeScreen.jsx
import { MainLayout } from '../templates/MainLayout';
import { VoiceCommandPanel } from '../organisms/VoiceCommandPanel';
import { CameraPreview } from '../organisms/CameraPreview';
import { DescriptionCard } from '../organisms/DescriptionCard';
import { useVoiceCommands } from '../../voice/presentation/hooks/useVoiceCommands';
import { useVisionAnalysis } from '../../vision/presentation/hooks/useVisionAnalysis';

export function HomeScreen() {
  const { isListening, lastCommand, startListening, stopListening } = useVoiceCommands();
  const { description, isAnalyzing, analyzeScene, repeatLast } = useVisionAnalysis();

  return (
    <MainLayout
      header={
        <VoiceCommandPanel
          isListening={isListening}
          lastCommand={lastCommand}
          onActivate={startListening}
          onDeactivate={stopListening}
        />
      }
      content={
        <CameraPreview
          onCapture={analyzeScene}
          isAnalyzing={isAnalyzing}
        />
      }
      footer={
        description && (
          <DescriptionCard
            description={description}
            onRepeat={repeatLast}
          />
        )
      }
    />
  );
}
```

---

## Folder Structure

```
src/
├── shared/
│   └── presentation/
│       └── components/
│           ├── atoms/
│           │   ├── Button.jsx
│           │   ├── Icon.jsx
│           │   ├── Typography.jsx
│           │   └── index.js
│           ├── molecules/
│           │   ├── IconButton.jsx
│           │   ├── InputField.jsx
│           │   └── index.js
│           ├── organisms/
│           │   ├── Header.jsx
│           │   └── index.js
│           └── templates/
│               ├── MainLayout.jsx
│               └── index.js
│
├── voice/
│   └── presentation/
│       └── components/
│           ├── molecules/
│           │   └── VoiceStatus.jsx
│           └── organisms/
│               └── VoiceCommandPanel.jsx
│
└── vision/
    └── presentation/
        └── components/
            └── organisms/
                ├── CameraPreview.jsx
                └── DescriptionCard.jsx
```

---

## Decision Tree

```
Is it a basic HTML/RN element wrapper?
  → ATOM (Button, Text, Input, Icon)

Is it a simple combination of 2-3 atoms?
  → MOLECULE (IconButton, InputField, Avatar + Name)

Is it a complex, self-contained UI section?
  → ORGANISM (Header, Form, Card, Modal)

Is it a page structure without specific content?
  → TEMPLATE (MainLayout, AuthLayout)

Is it a complete screen with data and logic?
  → PAGE/SCREEN (HomeScreen, SettingsScreen)
```

---

## Rules

| Rule | Reason |
|------|--------|
| Atoms have no business logic | Pure presentation only |
| Molecules combine atoms only | Keep them simple |
| Organisms can have local state | Complex enough to need it |
| Templates receive children/slots | Flexible layouts |
| Pages connect to hooks/state | Only place with data fetching |
| Each level imports only from below | Clear dependency direction |

---

## Index Files

```javascript
// atoms/index.js - Export all atoms
export { Button } from './Button';
export { Icon } from './Icon';
export { Typography } from './Typography';
export { Spacer } from './Spacer';

// Usage
import { Button, Icon, Typography } from '@/shared/presentation/components/atoms';
```

---

## Accessibility at Each Level

| Level | Accessibility Requirement |
|-------|--------------------------|
| Atoms | `accessibilityRole`, base labels |
| Molecules | `accessibilityLabel` combining context |
| Organisms | `accessibilityHint` for complex actions |
| Pages | Focus management, screen reader announcements |

```javascript
// Atom: basic role
<TouchableOpacity accessibilityRole="button">

// Molecule: contextual label
<InputField accessibilityLabel={`Campo de ${label}`}>

// Organism: action hint
<VoiceCommandPanel accessibilityHint="Activa comandos de voz diciendo Iris">
```
