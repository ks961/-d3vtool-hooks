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

export type UsePersistentStateConfig = {
    /**
     * The delay in milliseconds before saving the state to localStorage.
     * Defaults to 300ms.
     */
    saveDelay?: ms, 
    
    /**
     * Determines whether the state should be cleared from localStorage
     * when the component using the hook unmounts. Defaults to `false`.
     */
    clearStorageOnUnMount?: boolean, 

    /**
     * A boolean flag to determine if the state update should be synchronized
     * synchronously during the layout phase. Defaults to `false`.
     */
    useLayout?: boolean // default to false
}

export type StorageInfo<T> = {
    /**
     * The key under which the state is stored in localStorage.
     */
    key: string, 
    
    /**
     * The value of the state being persisted.
     */
    value: T
}

export type StorageBroadcast<T> = {
    /**
     * The type of the broadcast event to indicate state changes across tabs.
     */
    type: "storage-broadcast",
    
    /**
     * The data associated with the storage update.
     */
    storageData: StorageInfo<T>
}

/**
 * A custom hook that manages persistent state by storing it in localStorage.
 * The state can be shared across browser tabs, and optionally cleared when
 * the component unmounts. Supports debouncing the save to reduce performance hits.
 * Additionally, it offers an option to synchronize state changes during the
 * layout phase to ensure immediate updates when needed.
 * 
 * @template T - The type of the state value. Defaults to `unknown` if not provided.
 * 
 * @param {string} key - The key under which the state is stored persistently in localStorage.
 * @param {T | StateInitializerAction<T>} initialState - The initial state or a function that returns the initial state.
 * @param {UsePersistentStateConfig} [config] - Optional configuration for the persistent state:
 *   - `saveDelay` (default 300ms): Delay before saving state to localStorage.
 *   - `clearStorageOnUnMount` (default false): Whether to clear the state from localStorage when the component unmounts.
 *   - `useLayout` (default false): If `true`, the state will be updated synchronously in the layout phase.
 * 
 * @returns {UsePersistentState<T>} - Returns the current state and a function to update the state.
 * 
 * @example
 * // Basic usage with a simple value:
 * const [count, setCount] = usePersistentState('count', 0);
 * 
 * // Using `usePersistentState` with a state initializer function:
 * const [user, setUser] = usePersistentState('user', () => ({ name: 'John Doe' }));
 * 
 * // Updating the state:
 * setCount(5);
 * 
 * // Updating the state based on the previous value:
 * setCount(prev => prev + 1);
 * 
 * @example
 * // Using `usePersistentState` with config to clear localStorage on component unmount:
 * const config = useMemo(() => ({
 *     clearStorageOnUnMount: true
 * }), []);
 * 
 * const [sessionData, setSessionData] = usePersistentState('session', {}, config);
 * 
 * // Define the `config` object outside of your component or using `useMemo` to prevent recreation on each render.
 * 
 * @example
 * // Using `usePersistentState` with config to synchronize state updates during the layout phase:
 * const [layoutData, setLayoutData] = usePersistentState('layoutData', { theme: 'light' }, {
 *     useLayout: true
 * });
 */
export function usePersistentState<T = unknown>(
    key: string, 
    initialState: T | StateInitializerAction<T>,
    config?: UsePersistentStateConfig
): UsePersistentState<T> {
    const isBrowser = typeof window !== "undefined";

    const prevKeyRef = useRef<string>("");

    const channelId = useId();

    const channelRef = useRef<BroadcastChannel | null>(null);

    const userConfig: UsePersistentStateConfig = {
        saveDelay: config?.saveDelay ?? 300,
        clearStorageOnUnMount: config?.clearStorageOnUnMount ?? false,
        useLayout: config?.useLayout ?? false
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

        localStorage.setItem(key, serialize<T>(value));
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
    
            const parsedData = deserialize<T>(data);
            
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