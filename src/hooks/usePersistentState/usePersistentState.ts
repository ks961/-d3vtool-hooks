import { ms, useDebounce } from "../useDebounce";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { deserialize, serialize } from "./utils";

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


/**
 * A function type used for serializing a state value before storing it in persistent storage (e.g., `localStorage`).
 * 
 * @template T - The type of the state value to be serialized.
 * 
 * @param {T} data - The state value to be serialized.
 * @returns {string} - The serialized state value as a string.
 * 
 * @example
 * // A custom serializer function that converts a `User` object to a string.
 * const serializeUser: SerializerFn<User> = (user) => user.name;
 * 
 * // Usage of the custom serializer function
 * const serializedUser = serializeUser(new User('John Doe')); // Returns 'John Doe'
 */
export type SerializerFn<T> = (data: T) => string;

/**
 * A function type used for deserializing a state value retrieved from persistent storage (e.g., `localStorage`).
 * 
 * @template T - The type of the state value to be deserialized.
 * 
 * @param {string} serialized - The serialized state value as a string.
 * @returns {T} - The deserialized state value.
 * 
 * @example
 * // A custom deserializer function that converts a serialized string into a `User` object.
 * const deserializeUser: DeSerializerFn<User> = (data) => new User(data);
 * 
 * // Usage of the custom deserializer function
 * const user = deserializeUser('John Doe'); // Returns a `User` object with the name 'John Doe'
 */
export type DeSerializerFn<T> = (serialized: string) => T;


/**
 * Configuration options for `usePersistentState` to customize how the state
 * is saved, synchronized, and managed in localStorage.
 *
 * @template T - The type of the state being persisted.
 *
 * @property {number} [saveDelay=300] - Optional delay in milliseconds before saving the state to localStorage.
 *                                      Helps debounce frequent state updates.
 *
 * @property {boolean} [clearStorageOnUnMount=false] - Whether the state should be cleared from localStorage when
 *                                                     the component unmounts. Defaults to `false`, meaning the state
 *                                                     will persist even after the component unmounts.
 *
 * @property {boolean} [useLayout=false] - Determines if the state update should be synchronized during the layout
 *                                         phase using `useLayoutEffect`. Defaults to `false`, which means the state
 *                                         updates will be handled asynchronously during the commit phase using `useEffect`.
 *
 * @property {SerializerFn<T>} [serialize] - Optional function for custom serialization of the state before storing it
 *                                           in localStorage. By default, the state is serialized using JSON.stringify.
 *
 * @property {DeSerializerFn<T>} [deserialize] - Optional function for custom deserialization of the state when reading
 *                                               it from localStorage. By default, the state is deserialized using
 *                                               JSON.parse.
 */
export type UsePersistentStateConfig<T> = {
    saveDelay?: ms, 
    clearStorageOnUnMount?: boolean, 
    useLayout?: boolean, 
    serialize?: SerializerFn<T>, 
    deserialize?: DeSerializerFn<T>
}

/**
 * Represents the information of a specific item being stored in localStorage.
 *
 * @template T - The type of the value being stored.
 *
 * @property {string} key - The key used to identify the stored state in localStorage.
 * @property {T} value - The actual state value that is being persisted.
 */
export type StorageInfo<T> = {
    key: string, 
    value: T
}

/**
 * Describes the structure of the broadcast event that is emitted to notify other browser
 * tabs about changes in the persistent state.
 *
 * @template T - The type of the state value being broadcasted.
 *
 * @property {"storage-broadcast"} type - The type of the event, indicating that the state has been broadcasted.
 * @property {StorageInfo<T>} storageData - The updated state information, including the key and the new value.
 */
export type StorageBroadcast<T> = {
    type: "storage-broadcast",
    storageData: StorageInfo<T>
}


/**
 * A custom hook that persists state in `localStorage`, with configuration options to customize how the state is managed.
 * Supports debouncing state saving, clearing the state on unmount, and synchronizing state updates during the layout phase.
 * 
 * @template T - The type of the state value. Defaults to `unknown` if not provided.
 * 
 * @param {string} key - The key under which the state is stored in `localStorage`.
 * @param {T | StateInitializerAction<T>} initialState - The initial state value or a function that returns the initial state.
 * @param {UsePersistentStateConfig<T>} [config] - Optional configuration to customize how the state is managed:
 *   - `saveDelay` (default 300ms): Delay before saving the state to `localStorage`.
 *   - `clearStorageOnUnMount` (default `false`): Whether to clear the state from `localStorage` when the component unmounts.
 *   - `useLayout` (default `false`): If `true`, updates the state during the layout phase for immediate rendering.
 *   - `serialize`: A custom serialization function to transform the state before saving it.
 *   - `deserialize`: A custom deserialization function to transform the state when reading it from storage.
 * 
 * @returns {UsePersistentState<T>} - The current state and a function to update it.
 * 
 * @example
 * // Basic usage with a simple value:
 * const [count, setCount] = usePersistentState('count', 0);
 * 
 * // Using a function for the initial state:
 * const [user, setUser] = usePersistentState('user', () => ({ name: 'John Doe' }));
 * 
 * // Updating the state:
 * setCount(5);
 * 
 * // Updating based on the previous state:
 * setCount(prev => prev + 1);
 * 
 * @example
 * // Example 1: Using `usePersistentState` with the `saveDelay` config:
 * const [user, setUser] = usePersistentState('user', { name: 'Jane' }, { saveDelay: 500 });
 * 
 * // State will be saved with a 500ms delay to debounce frequent updates.
 * setUser({ name: 'John' });
 * 
 * @example
 * // Example 2: Using `usePersistentState` with `clearStorageOnUnMount` config:
 * const config = useMemo(() => ({
 *     clearStorageOnUnMount: true
 * }), []);
 * 
 * const [sessionData, setSessionData] = usePersistentState('session', {}, config);
 * 
 * // When the component unmounts, the session data will be removed from `localStorage`.
 * 
 * @example
 * // Example 3: Using `usePersistentState` with `useLayout` config:
 * const [layoutData, setLayoutData] = usePersistentState('layoutData', { theme: 'light' }, {
 *     useLayout: true
 * });
 * 
 * // State updates will happen synchronously during the layout phase, ensuring immediate updates.
 * setLayoutData({ theme: 'dark' });
 * 
 * @example
 * // Example 4: Using `usePersistentState` with custom serialization and deserialization:
 * class User {
 *     constructor(public name: string) {}
 * 
 *     static serialize(user: User): string {
 *         return user.name;
 *     }
 * 
 *     static deserialize(data: string): User {
 *         return new User(data);
 *     }
 * }
 * 
 * const config = useMemo(() => ({
 *     serialize: User.serialize,
 *     deserialize: User.deserialize
 * }), []);
 * 
 * const [user, setUser] = usePersistentState('user', new User('Alice'), config);
 * 
 * // Using custom serializer and deserializer to store and retrieve a `User` object.
 */
export function usePersistentState<T = unknown>(
    key: string, 
    initialState: T | StateInitializerAction<T>,
    config?: UsePersistentStateConfig<T>
): UsePersistentState<T> {
    const isBrowser = typeof window !== "undefined";

    const prevKeyRef = useRef<string>("");

    const channelId = useId();

    const channelRef = useRef<BroadcastChannel | null>(null);

    const userConfig: Required<UsePersistentStateConfig<T>> = {
        saveDelay: config?.saveDelay ?? 300,
        clearStorageOnUnMount: config?.clearStorageOnUnMount ?? false,
        useLayout: config?.useLayout ?? false,
        serialize: config?.serialize ?? serialize,
        deserialize: config?.deserialize ?? deserialize
    }
    
    const effectHook = userConfig.useLayout ? useLayoutEffect : useEffect;

    function initialize() {
        const iState = (initialState instanceof Function) ?
            initialState() : initialState;

        return iState;
    }

    const [ state, setState ] = useState<T>(initialize);

    const handleSaveToStorage = useCallback((key: string, value: T) => {
        if(!isBrowser) return;

        localStorage.setItem(key, userConfig.serialize(value));
    }, [key]);

    const debounce = useDebounce<[string, T]>(userConfig.saveDelay!, handleSaveToStorage);
    
    const handleStorageChange = useCallback((event: MessageEvent<StorageBroadcast<T>>) => {
        
        if(event.data.type !== "storage-broadcast") return;
        if(event.data.storageData.key === key && event.data.storageData.value) {
            setState(event.data.storageData.value);
        }
    }, [key]);

    effectHook(() => {
        if(!isBrowser) return;
        
        try {
            const data = localStorage.getItem(key);
            if(!data) throw new Error();
    
            const parsedData = userConfig.deserialize(data);
            
            setState(parsedData);
        } catch {
            broadcastEvent(key, state);
        }

        const channel = new BroadcastChannel(channelId);
        channelRef.current = channel;

        channelRef.current?.addEventListener("message", handleStorageChange);
        
        return () => {
            channelRef.current?.removeEventListener("message", handleStorageChange);

            channelRef.current?.close();
            channelRef.current = null;
            
            if(userConfig.clearStorageOnUnMount) {
                localStorage.removeItem(key);
            }
        }
    }, []);

    useEffect(() => {
        if(prevKeyRef.current.length > 0 && key !== prevKeyRef.current && isBrowser) {
            
            localStorage.removeItem(prevKeyRef.current);
            broadcastEvent(key, initialize());
            
            prevKeyRef.current = key;

        } else if(prevKeyRef.current.length === 0) {
            prevKeyRef.current = key;
        }
    }, [key]);

    function broadcastEvent(key: string, newState: T) {
        
        const comm: StorageBroadcast<T> = {
            type: "storage-broadcast",
            storageData: {
                key,
                value: newState,
            }
        }

        channelRef.current?.postMessage(comm);

        debounce(key, newState);
    }

    const updateState = useCallback((newState: T | PrevStateAction<T>) => {
        setState(prev => {
            const nState = (newState instanceof Function ? 
                (newState as PrevStateAction<T>)(prev) : newState);
            
            broadcastEvent(key, nState);

            return nState;
        })
    }, []);

    return [ state, updateState ] as const; 
}