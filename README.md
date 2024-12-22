# React Hooks Collection

A collection of custom React hooks designed to simplify common tasks in your React applications. Here’s the list of all the hooks:

- **useMState**
  - It is a custom mutable version of useState that supports direct or
  initializer-action-based initial state and enables state updates using the most recent mutable snapshot.

- **useBoolean**
  - Manages boolean states with easy toggling actions.

- **useClickOutside**
  - It's a custom hook that triggers a callback when a click occurs outside the referenced element, useful for scenarios like closing modals or dropdowns.

- **usePersistentState**
  - Manages state that persists in localStorage or session-like storage.

- **useReadPersistentState**
  - Reads a persistent state from localStorage without providing update capabilities.

- **createHub**
  - Creates a shared state hub to manage and synchronize state across multiple components.

- **createComputedHub**
  - Creates a computed hub that derives its state from an existing hub using a compute action.

- **useHub**
  - Subscribes to a shared state hub and provides access to both the state and an update function.

- **useReadHub**
  - Reads the current state from a shared state hub without the ability to update it.

- **useComputeHub**
  - Computes a derived state from a shared state hub using a custom compute function.

## Installation

You can install the package using npm or yarn:

### npm

```bash
npm install @d3vtool/hooks
```

### yarn

```bash
yarn add @d3vtool/hooks
```

## Available Hooks

### `useMState`

`useMState` is a custom mutable version of `useState` hook for managing state in your React components. It can be used with a direct initial state value or with an initializer function for more complex state setups. It also supports updating state based on the most recent snapshot of the state in a mutable way.

#### API

```ts
const [state, setState] = useMState(initialState);
```

- `initialState`: Can be a direct initial value or a function that returns the initial value.

#### Examples

##### Using with a direct initial state value:

```ts
const [count, setCount] = useMState(0);
```

##### Using with an initializer function:

```ts
import { useMState } from "@d3vtool/hooks";
const [user, setUser] = useMState(() => ({ name: 'John', age: 30 }));

// Updating state based on previous state:
setUser(mostRecentSnapshot => {
  mostRecentSnapshot.age += 1;
});

// It also accepts a second argument for deep cloning the `mostRecentSnapshot` of the state.
// By default, this is set to false, so it creates a shallow copy of `Object` types.
setUser(mostRecentSnapshot => {
  mostRecentSnapshot.age += 5;
}, true);
```

### `useBoolean`

`useBoolean` is a custom hook that helps manage boolean states such as toggling between true and false. It provides easy-to-use actions for toggling and setting the value to `true` or `false`.

#### API

```ts
const [state, actions] = useBoolean(initialState: boolean);
```

- `initialState`: The initial boolean state (`true` or `false`).

#### Example

```tsx
import { useBoolean } from "@d3vtool/hooks";

const ToggleComponent: React.FC = () => {
    const [state, actions] = useBoolean(false);

    return (
        <div>
            <p>The current state is: {state ? "True" : "False"}</p>
            <button onClick={actions.toggle}>Toggle State</button>
            <button onClick={() => actions.set(true)}>Set to True</button>
            <button onClick={() => actions.set(false)}>Set to False</button>
        </div>
    );
};

export default ToggleComponent;
```

### `useClickOutside`

`useClickOutside` is a custom hook that triggers a callback when a click event occurs outside the referenced element. It allows you to detect clicks outside a specific component and can be useful for scenarios like closing modals or dropdowns.

#### API

```ts
const ref = useClickOutside(action: VoidFunction);
```

- `action`: The function to be triggered when a click occurs outside the referenced element.

#### Example

```tsx
import { useClickOutside } from "@d3vtool/hooks";

const DropdownComponent: React.FC = () => {

    const dropdownRef = useClickOutside(() => {
        console.log("Clicked outside the dropdown");
    });

    return (
        <div>
            <div ref={dropdownRef} style={{ padding: "20px", backgroundColor: "lightblue" }}>
                <p>Dropdown content</p>
                <button>Click me</button>
            </div>
            <p>Click outside the box to trigger the action.</p>
        </div>
    );
};

export default DropdownComponent;
```

### usePersistentState

`usePersistentState` is a custom hook that helps manage state and persists it in `localStorage`. It allows you to store and retrieve state values across sessions and tabs, with an option to clear the state from storage when the component unmounts.

#### API

```ts
const [state, setState] = usePersistentState<T>(
  key: string, 
  initialState: T | () => T, 
  config?: { clearStorageOnUnMount: boolean }
);
```

- `key`: A unique string to identify the stored state in `localStorage`.
- `initialState`: The initial state value or a function that returns the initial state.
- `config`: Optional configuration object.
  - `clearStorageOnUnMount`: Boolean flag indicating whether to clear the state from storage when the component unmounts (default is `false`).

#### Example

```tsx
import { usePersistentState } from "@d3vtool/hooks";

const CounterComponent: React.FC = () => {
    const [ count, setCount ] = usePersistentState("count", 0);

    function handleInc() {
        setCount(prev => prev + 1);
    }
    
    function handleDec() {
        setCount(prev => prev - 1);
    }

    return(
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginTop: "12rem"
        }}>
            <button onClick={handleDec}>DEC</button>
            <p>{count}</p>
            <button onClick={handleInc}>INC</button>
        </div>
    );
};

export default CounterComponent;
```

#### Example with `clearStorageOnUnMount`

```tsx
import { usePersistentState } from "@d3vtool/hooks";

const pStateConfig = {
    clearStorageOnUnMount: true
};
const SessionComponent: React.FC = () => {
    const [sessionData, setSessionData] = usePersistentState('session', {}, pStateConfig);

    return (
        <div>
            <p>Session Data: {JSON.stringify(sessionData)}</p>
            <button onClick={() => setSessionData({ user: 'John Doe' })}>Set User</button>
            <button onClick={() => setSessionData({})}>Clear Session</button>
        </div>
    );
};

export default SessionComponent;
```

### useReadPersistentState

`useReadPersistentState` is a custom hook that reads the persistent state from `localStorage` without providing the ability to update it across tabs.

#### API

```ts
const state = useReadPersistentState<T>(key: string): T | undefined;
```

- `key`: A unique string to identify the stored state in `localStorage`.
- Returns the state value if found in storage, or `undefined` if no value is found for the given key.

#### Example

```tsx
import { useReadPersistentState } from "@d3vtool/hooks";

const ReadCounterComponent: React.FC = () => {
    const state = useReadPersistentState<number>("counter");

    return (
        <div>
            Read: {state}
        </div>
    );
};

export default ReadCounterComponent;
```

### createHub

`createHub` creates a shared state hub that can manage and synchronize state across multiple components.

#### API

```ts
const myHub = createHub<T>(initialState: T | InitializerAction<T>);
```

- `initialState`: The initial state value or a function that returns the initial state.
- Returns a hub object that manages the shared state.

#### Example

```ts
import { createHub } from "@d3vtool/hooks";

const myHub = createHub({ count: 0 });
```

### createComputedHub

`createComputedHub` creates a new computed hub that derives its state from an existing hub using a compute action.

#### API

```ts
const computedHub = createComputedHub<T>(hub: Hub<T>, computeAction: ComputeAction<T>);
```

- `hub`: The original hub from which the state will be derived.
- `computeAction`: A function that computes the new state based on the current state of the original hub.
- Returns a new hub object that manages the computed state.

#### Example

```ts
import { createHub, createComputedHub } from "@d3vtool/hooks";

const myHub = createHub({ count: 0 });

// Create a computed hub that doubles the count value:
const computedHub = createComputedHub(myHub, (state) => ({
    count: state.count * 2
}));
```

### useHub

`useHub` is a custom hook that subscribes to a shared state hub and provides access to the current state along with a function to update it.

#### API

```ts
const [state, setState] = useHub<T>(hub: Hub<T>);
```

- `hub`: The shared state hub that holds the state.
- Returns the current state and a function to update it.

#### Example

```tsx
import { useHub } from "@d3vtool/hooks";

// Always create `hub` outside of your component.
const myHub = createHub({ count: 0 });

const CounterComponent: React.FC = () => {
    const [count, setCount] = useHub(myHub);

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(prev => prev + 1)}>Increment</button>
            <button onClick={() => setCount(0)}>Reset</button>
        </div>
    );
};

export default CounterComponent;
```

### useReadHub

`useReadHub` is a custom hook that reads the current state from a shared state hub without providing a way to update it.

#### API

```ts
const state = useReadHub<T>(hub: Hub<T>);
```

- `hub`: The shared state hub that holds the state.
- Returns the current state.

#### Example

```tsx
import { useReadHub } from "@d3vtool/hooks";

const DisplayCounterComponent: React.FC = () => {
    const count = useReadHub<number>(myHub);

    return (
        <div>
            <p>Count: {count}</p>
        </div>
    );
};

export default DisplayCounterComponent;
```

### useComputeHub

`useComputeHub` is a custom hook that computes a derived state from a shared state hub using a provided compute action.

#### API

```ts
const computedState = useComputeHub<T>(hub: Hub<T>, computeAction: ComputeAction<T>);
```

- `hub`: The shared state hub that holds the state.
- `computeAction`: A function that computes a derived state based on the current state of the hub.
- Returns the computed state.

#### Example

```tsx
import { useComputeHub } from "@d3vtool/hooks";

// Always create `hub` outside of your component.
const myHub = createHub({ count: 0 });

const ComputedCounterComponent: React.FC = () => {
    const doubleCount = useComputeHub(myHub, (state) => state.count * 2);

    return (
        <div>
            <p>Double Count: {doubleCount}</p>
        </div>
    );
};

export default ComputedCounterComponent;
```

### License

This package is open-source and licensed under the [MIT License](LICENSE).