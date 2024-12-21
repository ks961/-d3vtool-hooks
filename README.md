# React Hooks Collection

A collection of custom React hooks designed to simplify common tasks in your React applications.

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

### License

This package is open-source and licensed under the [MIT License](LICENSE).