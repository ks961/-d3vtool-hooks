import { useCallback, useState } from "react";

export type InitializerAction<T> = () => T;

export type NewMStateAction<T> = (mostRecentSnapshot: T) => void;
export type SetMStateAction<T> = (newStateAction: NewMStateAction<T>, deepClone?: boolean) => void;

export type UseMState<T> = [ T, SetMStateAction<T> ];

/**
 * A custom hook that provides a stateful mutable value and a function to update it.
 * 
 * This hook is designed to mimic the functionality of React's `useState`, providing a way to manage state within a component in a mutable way. 
 * It can either be initialized with a direct value or with an initializer function (action) that computes the initial state value.
 * It returns the current state value and a function to update it.
 * 
 * @param initialState - The initial value for the state, or a function (initializer) that returns the initial state.
 *                        - If a value is passed, it will be used as the initial state.
 *                        - If a function is passed, the function will be invoked to generate the initial state.
 * 
 * @returns An array with two elements:
 *   1. The current state value (`T`), which will be updated whenever the state changes.
 *   2. A function to update the state (`setStateAction`), which can accept either a direct value or a function that takes the current state and returns the new state.
 * 
 * @template T - The type of the state value. It can be any type (e.g., `string`, `number`, `boolean`, `object`, etc.).
 * 
 * @example
 * // Using with a direct initial state value
 * const [count, setCount] = useMState(0);
 * 
 * // Using with an initializer function
 * const [user, setUser] = useMState(() => ({ name: 'John', age: 30 }));
 * 
 * // Updating state based on previous state
 * setUser(mostRecentSnapshot => mostRecentSnapshot.age += 1);
 */
export function useMState<T = unknown>(initialState: T | InitializerAction<T>): UseMState<T> {
    const [ state, setState ] = useState<T>(initialState);

    /**
     * A mutable state setter function that updates the state with an optional deep clone.
     * 
     * This function is intended to be used in a React component (or similar state management system)
     * where the state can be updated in a mutable way with a function that receives the previous
     * state and returns the new state. The `deepClone` flag determines whether the state should be deeply
     * cloned before updating to ensure immutability.
     *
     * @param newStateAction - The `newStateAction` is a function that takes the previous state and returns the new state.
     * 
     * @param deepClone - A boolean flag indicating whether to deeply clone the current state before applying the new state.
     *                    - Defaults to `false`. If `true`, it attempts to perform a deep clone of the previous state.
     *                    - If `true`, it uses `structuredClone` to deeply clone the state, if available in the environment.
     *                    - If `structuredClone` is not available (e.g., in older browsers or environments), the function
     *                      will fall back to `JSON.parse(JSON.stringify(...))` as a fallback.
     *                    - If `false`, shallow cloning (using spread operators) or direct assignment is used.
     * 
     * @returns void
     * 
     * @example
     * // Usage with a function that receives the previous state
     * setStateAction(mostRecentSnapshot => mostRecentSnapshot.age += 1);
     * 
     * // Usage with deep cloning enabled (using structuredClone or fallback)
     * setStateAction(mostRecentSnapshot => mostRecentSnapshot.name = 'New Name', true);
     * 
     */
    const setStateAction = useCallback((newStateAction: NewMStateAction<T>, deepClone: boolean = false) => {
        setState(mostRecentSnapshot => {

            const mutableOldState = 
                (deepClone && mostRecentSnapshot instanceof Object ? 
                structuredClone ? structuredClone(mostRecentSnapshot) : JSON.parse(JSON.stringify(mostRecentSnapshot)) :
                Array.isArray(mostRecentSnapshot) ? [...mostRecentSnapshot] : 
                mostRecentSnapshot instanceof Object ? {...mostRecentSnapshot} : mostRecentSnapshot) as T;

                newStateAction(mutableOldState);

            return mutableOldState;
        });
    }, []);

    return [ state, setStateAction ] as const;
}