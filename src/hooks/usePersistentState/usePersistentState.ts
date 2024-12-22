import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Type representing a function that initializes state.
 * @template T - The type of the state value.
 * @returns {T} - The initial state.
 */
export type StateInitializerAction<T> = () => T;

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
 * Type representing the return value of the `usePersistentState` hook.
 * It is a tuple where the first value is the current state and the second value is a function to update the state.
 * @template T - The type of the state value.
 */
export type UsePersistentState<T> = [T, UpdateStateAction<T>];

export type UsePersistentStateConfig = {
    clearStorageOnUnMount: boolean
}

/**
 * A custom hook that provides persistent state management, storing the state in localStorage across tabs.
 * 
 * @template T - The type of the state value. Defaults to `unknown` if not provided.
 * @param {string} key - The key under which the state is stored persistently.
 * @param {T | StateInitializerAction<T>} initialState - The initial state or a function that returns the initial state.
 * @param {UsePersistentStateConfig} [config] - Configuration options for the persistent state.
 * @param {boolean} [config.clearStorageOnUnMount=false] - Determines whether the state should be removed from storage when the component unmounts.
 * @returns {UsePersistentState<T>} - Returns the current state and a function to update the state.
 * 
 * @example
 * // Using `usePersistentState` with a simple value:
 * const [count, setCount] = usePersistentState('count', 0);
 * 
 * // Using `usePersistentState` with a state initializer function:
 * const [user, setUser] = usePersistentState('user', () => ({ name: 'John Doe' }));
 * 
 * // Updating the state with a new value:
 * setCount(5);
 * 
 * // Updating the state based on the previous state:
 * setCount(prev => prev + 1);
 * 
 * // Example with config to clear storage on unmount:
 * // Always define config object outside of your Component and then pass it as argument.
 * const [sessionData, setSessionData] = usePersistentState('session', {}, {
 *     clearStorageOnUnMount: true
 * });
 */
export function usePersistentState<T = unknown>(
    key: string, 
    initialState: T | StateInitializerAction<T>,
    config: UsePersistentStateConfig = {
        clearStorageOnUnMount: false
    }
): UsePersistentState<T> {

    const prevKeyRef = useRef<string>("");
    const isCurrentScopeRef = useRef<boolean>(false);

    function initialize() {
        const iState = (initialState instanceof Function) ?
            initialState() : initialState;

        return iState;
    }

    const [ state, setState ] = useState<T>(initialize);

    function handleStorageChange(event: StorageEvent) {
        if(event.key === key && event.newValue) {
            localStorage.setItem(key, event.newValue);
            
            if(isCurrentScopeRef.current) {
                isCurrentScopeRef.current = false;                
                return;
            }

            const deSerializedData = JSON.parse(event.newValue) as T;
            setState(deSerializedData);
        }
    }

    useEffect(() => {
        if(!window) return;

        try {
            const data = localStorage.getItem(key);
    
            const parsedData = JSON.parse(data ?? "") as T;
            
            setState(parsedData);
        } catch {
            isCurrentScopeRef.current = true;
            dispatchStorageEvent(key, state);
        }

        window.addEventListener("storage", handleStorageChange);
        
        return () => {
            window.addEventListener("storage", handleStorageChange);

            if(config.clearStorageOnUnMount) {
                localStorage.removeItem(key);
            }
        }
    }, []);

    useEffect(() => {
        if(prevKeyRef.current.length > 0 && key !== prevKeyRef.current && window) {
            
            localStorage.removeItem(prevKeyRef.current);
            dispatchStorageEvent(key, initialize());
            
            prevKeyRef.current = key;

        } else if(prevKeyRef.current.length === 0) {
            prevKeyRef.current = key;
        }
    }, [key]);

    function dispatchStorageEvent(key: string, newState: T) {
        window.dispatchEvent(new StorageEvent("storage", {
            key,
            newValue: JSON.stringify(newState)
        }));
    }

    const updateState = useCallback((newState: T | PrevStateAction<T>) => {

        const nState = (newState instanceof Function ? 
            (newState as PrevStateAction<T>)(state!) : newState);
        
        dispatchStorageEvent(key, nState);
    }, [state]);

    return [ state, updateState ] as const; 
}