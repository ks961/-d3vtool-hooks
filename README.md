# React Hooks Collection

A collection of custom React hooks designed to simplify common tasks in your React applications. Here’s the list of all the hooks:

- [**useMState**](#usemstate)
  - It is a custom mutable version of useState that supports direct or
  initializer-action-based initial state and enables state updates using the most recent mutable snapshot.

- [**useBoolean**](#useboolean)
  - Manages boolean states with easy toggling actions.

- [**useClickOutside**](#useclickoutside)
  - It's a custom hook that triggers a callback when a click occurs outside the referenced element, useful for scenarios like closing modals or dropdowns.

- [**usePersistentState**](#usepersistentstate)
  - Manages state that persists in localStorage across tabs/window and components.

- [**useReadPersistentState**](#usereadpersistentstate)
  - Reads a persistent state from localStorage without providing update capabilities across tabs/window and components.

- [**createHub**](#createhub)
  - Creates a shared state hub to manage and synchronize state across multiple components.

- [**createComputedHub**](#createcomputedhub)
  - Creates a computed hub that derives its state from an existing hub using a compute action.

- [**createPromiseHub**](#createpromisehub)
  - Creates a hub to manage asynchronous state with a promise action, handling state, errors, and loading.

- [**useHub**](#usehub)
  - Subscribes to a shared state hub and provides access to both the state and an update function.

- [**useReadHub**](#usereadhub)
  - Reads the current state from a shared state hub without the ability to update it.

- [**useComputeHub**](#usecomputehub)
  - Computes a derived state from a shared state hub using a custom compute function.

- [**useStoredHub**](#usestoredhub)
  - `useStoredHub` is a custom hook that synchronizes a shared state hub with persistent storage across tabs and pages.

- [**usePromiseHub**](#usepromisehub)
  - Manages state from a promise hub, providing access to current state, errors, loading status, and a retry action.

- [**usePromiseReadHub**](#usepromisereadhub)
  - Reads the current state, error, and loading status from a promise hub without triggering updates.

- [**usePromiseHubAction**](#usepromisehubaction)
  - Returns a function to manually trigger the asynchronous action managed by a promise hub.

- [**useSecId**](#usesecid)
  - `useSecId` is a custom hook that generates a unique string identifier (ID) that can be used for elements, components, or any case where a unique ID is required.

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

Here’s the usage documentation for the `useStoredHub` hook with the provided example:

### useStoredHub

`useStoredHub` is a custom hook that synchronizes a shared state hub with persistent storage (like localStorage). This allows the state of the hub to persist across pages and tabs reloads or navigation. 

#### API

```ts
const [state, setState] = useStoredHub<T>(key: string, hub: Hub<T>);
```

- `key`: The key used to store and retrieve the hub's state from persistent storage (e.g., localStorage).
- `hub`: The shared state hub that holds the state.
- Returns the current state and a function to update it.

#### Example

This example demonstrates how to use `useStoredHub` to manage and synchronize a counter across different pages across tabs. The counter state persists using localStorage and is shared between the `Home` and `ContactUs` components.

1. **countHub.ts:**

```ts
import { createHub } from "@d3vtool/hooks";

export const countHub = createHub(1);
```

2. **Page1 Component:**

```tsx
import { countHub } from "./countHub";
import { Link } from "react-router-dom";
import { useStoredHub } from "@d3vtool/hooks";

export default function Page1() {

    const [count, setCount] = useStoredHub<number>("count", countHub);

    function handleInc() {
        setCount(prev => prev + 1);
    }

    function handleDec() {
        setCount(prev => prev - 1);
    }

    return (
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
            <Link to="/page2">Page 2</Link>
        </div>
    );
}
```

3. **Page2 Component:**

```tsx
import { countHub } from "./countHub";
import { Link } from "react-router-dom";
import { useStoredHub } from "@d3vtool/hooks";

export default function Page2() {

    const [count, setCount] = useStoredHub<number>("count", countHub);

    function handleInc() {
        setCount(prev => prev + 1);
    }

    function handleDec() {
        setCount(prev => prev - 1);
    }

    return (
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
            <Link to="/">Page 1</Link>
        </div>
    );
}
```

#### How it works:
- `useStoredHub` is used in both `Page1` and `Page2` components with the same key `"count"`, ensuring that the counter value is shared and synchronized between the two pages or across tabs.
- The `count` state is persisted using localStorage and can be incremented or decremented on either page. The updated state is reflected on both pages or in pages opend on different tabs.


### `createPromiseHub`

`createPromiseHub` is a function that creates a hub to manage state with a promise action. This hub can then be used with the `usePromiseHub` or `usePromiseReadHub` hooks.

#### API

```ts
const promiseHub = createPromiseHub(initialState, promiseAction);
```

- `initialState`: The initial state value or initializer function.
- `promiseAction`: The async function that will resolve to update the state.

#### Example

```ts
import { createPromiseHub } from "@d3vtool/hooks";

export const fetchUserDataHub = createPromiseHub(undefined, async (prevState) => {
    const response = await fetch('/api/user');
    const data = await response.json();
    return data;
});
```

### `usePromiseHub`

`usePromiseHub` is a custom hook that helps manage asynchronous state using a promise hub. It provides the current state, loading status, error information, and a way to re-trigger the async action.

#### API

```ts
const [state, error, isLoading, retry] = usePromiseHub(promiseHub, immediate?);
```

- `promiseHub`: The promise hub created using `createPromiseHub`.
- `immediate`: (Optional) If `true`, the hook will immediately trigger the promise action. Defaults to `true`.

#### Example

```tsx
import { usePromiseHub } from "@d3vtool/hooks";
import { fetchUserDataHub } from "./userHub";

const UserProfile: React.FC = () => {
    const [userData, error, isLoading, retry] = usePromiseHub(fetchUserDataHub);

    return (
        <div>
            {isLoading ? <p>Loading user data...</p> : <p>User: {userData?.name}</p>}
            {error && <p>Error: {error.message}</p>}
            <button onClick={retry}>Retry</button>
        </div>
    );
};

export default UserProfile;
```

### `usePromiseReadHub`

`usePromiseReadHub` is a custom hook that provides read-only access to the state managed by a promise hub. It returns the current state, any error, and loading status.

#### API

```ts
const [state, error, isLoading] = usePromiseReadHub(promiseHub);
```

- `promiseHub`: The promise hub managing the async state.

#### Example

```tsx
import { usePromiseReadHub } from "@d3vtool/hooks";
import { fetchUserDataHub } from "./userHub";

const UserProfileReadOnly: React.FC = () => {
    const [userData, error, isLoading] = usePromiseReadHub(fetchUserDataHub);

    return (
        <div>
            {isLoading ? <p>Loading user data...</p> : <p>User: {userData?.name}</p>}
            {error && <p>Error: {error.message}</p>}
        </div>
    );
};

export default UserProfileReadOnly;
```

### `usePromiseHubAction`

`usePromiseHubAction` is a custom hook that provides access to the reAction function. This allows you to manually trigger the promise action from any other pages | components.

#### API

```ts
const reAction = usePromiseHubAction(promiseHub);
```

- `promiseHub`: The promise hub managing the asynchronous state.

#### Example

```tsx
import { usePromiseHubAction } from "@d3vtool/hooks";
import { fetchUserDataHub } from "./userHub";

const ManualUserUpdate: React.FC = () => {
    const retryAction = usePromiseHubAction(fetchUserDataHub);

    const handleRetry = async () => {
        const updatedUser = await retryAction();
        console.log('Updated user data:', updatedUser);
    };

    return (
        <button onClick={handleRetry}>Retry Fetch User Data</button>
    );
};

export default ManualUserUpdate;
```

### `useSecId`

`useSecId` is a custom hook that generates a unique string identifier with customizable length and character set.

#### API

```ts
const id = useSecId(length?: number, alphabets?: string);
```

- **`length`** *(optional)*: The desired length of the generated ID. Defaults to `8`.
- **`alphabets`** *(optional)*: A string representing the set of characters to use when generating the ID.

#### Example

```tsx
import React from 'react';
import { useSecId } from "@d3vtool/hooks";

const UniqueIdComponent: React.FC = () => {
    const shortId = useSecId(); // Default length of 8
    const customId = useSecId(12, "ABC123"); // Custom length and character set

    return (
        <div>
            <p>Generated Short ID: {shortId}</p>
            <p>Generated Custom ID: {customId}</p>
        </div>
    );
};

export default UniqueIdComponent;
```

In this example, `useSecId` is used to generate both a default 8-character ID and a custom 12-character ID using a restricted set of characters (`"ABC123"`).


### License

This package is open-source and licensed under the [MIT License](LICENSE).