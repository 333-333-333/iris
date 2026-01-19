---
name: xstate
description: >
  XState v5 state machines, actors, and React integration patterns.
  Trigger: When implementing state machines, complex state logic, or actor-based architecture.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  scope: [mobile]
  auto_invoke:
    - "Creating state machines"
    - "Managing complex state flows"
    - "Implementing actor patterns"
---

## When to Use

- Complex state flows with multiple transitions
- States that depend on async operations
- Need to visualize state logic
- Actor-based communication patterns
- Replacing complex boolean flags and conditionals

---

## Installation

```bash
bun add xstate @xstate/react
```

---

## Critical Patterns

### Machine with Setup (Recommended)

```typescript
import { setup, assign, fromPromise } from 'xstate';

// Define types
interface Context {
  count: number;
  error: string | null;
}

type Events = 
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'RESET' };

// Create machine with setup (v5 pattern)
const counterMachine = setup({
  types: {
    context: {} as Context,
    events: {} as Events,
  },
  actions: {
    increment: assign({
      count: ({ context }) => context.count + 1,
    }),
    decrement: assign({
      count: ({ context }) => context.count - 1,
    }),
    reset: assign({
      count: 0,
      error: null,
    }),
  },
  guards: {
    canDecrement: ({ context }) => context.count > 0,
  },
}).createMachine({
  id: 'counter',
  initial: 'active',
  context: {
    count: 0,
    error: null,
  },
  states: {
    active: {
      on: {
        INCREMENT: {
          actions: 'increment',
        },
        DECREMENT: {
          guard: 'canDecrement',
          actions: 'decrement',
        },
        RESET: {
          actions: 'reset',
        },
      },
    },
  },
});
```

### Async Operations with Invoke

```typescript
import { setup, assign, fromPromise } from 'xstate';

interface User {
  id: string;
  name: string;
}

const userMachine = setup({
  types: {
    context: {} as {
      user: User | null;
      error: string | null;
    },
    events: {} as 
      | { type: 'FETCH'; userId: string }
      | { type: 'RETRY' },
  },
  actors: {
    fetchUser: fromPromise<User, { userId: string }>(
      async ({ input }) => {
        const response = await fetch(`/api/users/${input.userId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        return response.json();
      }
    ),
  },
}).createMachine({
  id: 'user',
  initial: 'idle',
  context: {
    user: null,
    error: null,
  },
  states: {
    idle: {
      on: {
        FETCH: { target: 'loading' },
      },
    },
    loading: {
      invoke: {
        src: 'fetchUser',
        input: ({ event }) => ({
          userId: event.type === 'FETCH' ? event.userId : '',
        }),
        onDone: {
          target: 'success',
          actions: assign({
            user: ({ event }) => event.output,
            error: null,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => (event.error as Error).message,
          }),
        },
      },
    },
    success: {
      on: {
        FETCH: { target: 'loading' },
      },
    },
    error: {
      on: {
        RETRY: { target: 'loading' },
        FETCH: { target: 'loading' },
      },
    },
  },
});
```

---

## React Integration

### useMachine Hook

```typescript
import { useMachine } from '@xstate/react';

function Counter() {
  const [snapshot, send] = useMachine(counterMachine);
  
  return (
    <View>
      <Text>Count: {snapshot.context.count}</Text>
      <Text>State: {snapshot.value}</Text>
      
      <Button 
        onPress={() => send({ type: 'INCREMENT' })}
        title="+"
      />
      <Button 
        onPress={() => send({ type: 'DECREMENT' })}
        title="-"
        disabled={!snapshot.can({ type: 'DECREMENT' })}
      />
    </View>
  );
}
```

### useActor with Existing Actor

```typescript
import { useActor, useActorRef } from '@xstate/react';
import { createActor } from 'xstate';

// Create actor outside component (singleton)
const counterActor = createActor(counterMachine).start();

function Counter() {
  const [snapshot, send] = useActor(counterActor);
  // ...
}

// Or get ref for passing to children
function Parent() {
  const actorRef = useActorRef(counterMachine);
  
  return <Child actorRef={actorRef} />;
}
```

### Provide Actions/Guards at Runtime

```typescript
function Component() {
  const someValue = useSomeHook();
  
  const [snapshot, send] = useMachine(
    machine.provide({
      actions: {
        logValue: () => {
          console.log(someValue); // Access component scope
        },
      },
      guards: {
        isValid: () => someValue != null,
      },
    })
  );
}
```

---

## Callback Actors (External Events)

```typescript
import { fromCallback, setup, sendTo } from 'xstate';

// Actor that listens to external events
const audioListenerLogic = fromCallback(({ sendBack, receive }) => {
  const handleVoice = (event: VoiceEvent) => {
    sendBack({ type: 'VOICE_DETECTED', data: event });
  };
  
  // Subscribe to external source
  voiceService.subscribe(handleVoice);
  
  // Handle events from parent
  receive((event) => {
    if (event.type === 'STOP') {
      voiceService.stop();
    }
  });
  
  // Cleanup
  return () => {
    voiceService.unsubscribe(handleVoice);
  };
});

const machine = setup({
  actors: {
    audioListener: audioListenerLogic,
  },
}).createMachine({
  invoke: {
    id: 'listener',
    src: 'audioListener',
  },
  on: {
    VOICE_DETECTED: {
      actions: ({ event }) => console.log(event.data),
    },
    STOP_LISTENING: {
      actions: sendTo('listener', { type: 'STOP' }),
    },
  },
});
```

---

## Parent-Child Communication

```typescript
// Child machine
const childMachine = setup({
  types: {
    input: {} as { parentRef: ActorRef<any, any> },
    context: {} as { parentRef: ActorRef<any, any> },
  },
}).createMachine({
  context: ({ input }) => ({
    parentRef: input.parentRef,
  }),
  on: {
    NOTIFY_PARENT: {
      actions: sendTo(
        ({ context }) => context.parentRef,
        { type: 'CHILD_EVENT', data: 'hello' }
      ),
    },
  },
});

// Parent machine
const parentMachine = setup({
  actors: {
    child: childMachine,
  },
}).createMachine({
  invoke: {
    id: 'child',
    src: 'child',
    input: ({ self }) => ({
      parentRef: self,
    }),
  },
  on: {
    CHILD_EVENT: {
      actions: ({ event }) => console.log('From child:', event.data),
    },
  },
});
```

---

## State Matching

```typescript
const [snapshot] = useMachine(machine);

// Check current state
if (snapshot.matches('loading')) {
  return <Loading />;
}

if (snapshot.matches({ active: 'editing' })) {
  return <Editor />;
}

// Check if event can be sent
const canSubmit = snapshot.can({ type: 'SUBMIT' });

// Get state value
const currentState = snapshot.value; // 'idle' | 'loading' | etc.
```

---

## Entry/Exit Actions

```typescript
const machine = setup({
  actions: {
    onEnterLoading: () => console.log('Started loading'),
    onExitLoading: () => console.log('Finished loading'),
    announceState: ({ context }, params: { message: string }) => {
      speak(params.message);
    },
  },
}).createMachine({
  states: {
    loading: {
      entry: [
        'onEnterLoading',
        { type: 'announceState', params: { message: 'Cargando...' } },
      ],
      exit: 'onExitLoading',
    },
  },
});
```

---

## Best Practices

| Do | Don't |
|-----|-------|
| Use `setup()` for type safety | Use legacy `createMachine` alone |
| Define actions/guards in setup | Inline complex logic in transitions |
| Use `fromPromise` for async | Mix promises with sync logic |
| Use `fromCallback` for subscriptions | Manage subscriptions in components |
| Match states with `snapshot.matches()` | Compare `snapshot.value` directly |
| Use `snapshot.can()` for UI state | Duplicate guard logic in UI |

---

## File Structure

```
feature/
├── machines/
│   ├── voiceMachine.ts      # Machine definition
│   └── voiceMachine.test.ts # Machine tests
├── actors/
│   └── whisperActor.ts      # Callback/Promise actors
└── presentation/
    └── hooks/
        └── useVoice.ts      # Hook using useMachine
```

---

## Commands

```bash
# Install
bun add xstate @xstate/react

# Visualize (paste machine code)
# https://stately.ai/viz
```
