import { ComputeAction, Hub } from "./Hub";
import { useCallback, useEffect, useState } from "react";

/**
 * Type representing a function that updates the state based on the previous state.
 * @template T - The type of the state value.
 * @param {T} prev - The previous state value.
 * @returns {T} - The new state value.
 */
export type PrevStateAction<T> = (prev: T) => T;

/**
 * Type representing a function that updates the state.
 * @template T - The type of the state value.
 * @param {T | PrevStateAction<T>} newState - The new state value or a function that computes the new state based on the previous state.
 */
export type UpdateStateAction<T> = (newState: T | PrevStateAction<T>) => void;

/**
 * Type representing the return value of the `useHub` hook.
 * It is a tuple where the first value is the current state and the second value is a function to update the state.
 * @template T - The type of the state value.
 */
export type UseHub<T> = [T, UpdateStateAction<T>];

/**
 * A custom hook that subscribes to a shared state (Hub) and provides the current state and a function to update it.
 * 
 * @template T - The type of the state managed by the hub.
 * @param {Hub<T>} hub - An object that manages shared state across multiple components or contexts.
 * @returns {UseHub<T>} - Returns the current state from the hub and a function to update it.
 * 
 * @example
 * // Example of using `useHub` with a shared hub:
 * const [state, setState] = useHub(myHub);
 * 
 * // Updating the state:
 * setState(prev => ({ ...prev, key: 'newValue' }));
 * 
 * // Reading the current state:
 * console.log(state);
 */
export function useHub<T>(hub: Hub<T>): UseHub<T> {
    const [ state, setState ] = useState(hub.getCurrentState());

    useEffect(() => {
        hub.attachListener(setState);

        return () => {   
            hub.detachListener(setState);
        }
    }, [hub]);

    const updateState = useCallback((newState: T | PrevStateAction<T>) => {
        const nState = newState instanceof Function ?
            newState(hub.getCurrentState()) : newState;
            
        hub.notifyListener(nState);
    }, [hub]);

    return [
        state,
        updateState
    ] as const;
}

/**
 * A custom hook that reads the current state from a shared state hub without providing the ability to update it.
 * 
 * @template T - The type of the state managed by the hub.
 * @param {Hub<T>} hub - An object that manages shared state across multiple components or contexts.
 * @returns {T} - Returns the current state from the hub.
 * 
 * @example
 * // Example of using `useReadHub` to read the state from a hub:
 * const state = useReadHub(myHub);
 * 
 * // Reading the current state:
 * console.log(state);
 */
export function useReadHub<T>(hub: Hub<T>): T {
    const [ state, setState ] = useState(hub.getCurrentState());

    useEffect(() => {
        hub.attachListener(setState);

        return () => {   
            hub.detachListener(setState);
        }
    }, [hub]);
    
    return state;
}

/**
 * A custom hook that computes a derived state based on the current state from a shared state hub using a provided compute action in the same component.
 * 
 * @template T - The type of the state managed by the hub.
 * @param {Hub<T>} hub - An object that manages shared state across multiple components or contexts.
 * @param {ComputeAction<T>} computeAction - A function that computes a derived state based on the current state from the hub.
 * @returns {T} - Returns the computed state derived from the current state of the hub.
 * 
 * @example
 * // Example of using `useComputeHub` to derive a computed value from the hub's state:
 * const computedValue = useComputeHub(myHub, (state) => state.value * 2);
 * 
 * // Reading the computed value:
 * console.log(computedValue);
 */
export function useComputeHub<T>(hub: Hub<T>, computeAction: ComputeAction<T>): T {
    const computeHub = new Hub(computeAction(hub.getCurrentState()));

    function handleOnChange() {
        const currentHubState = hub.getCurrentState();
        const newComputedState = computeAction(currentHubState);
        computeHub.notifyListener(newComputedState);
    }
    
    useEffect(() => {
        hub.onChange(handleOnChange);

        return () => {
            hub.removeOnChange(handleOnChange);
        }
    }, [hub]);

    return computeHub.getCurrentState();
}