import { useCallback, useEffect } from "react";
import { usePersistentState } from "../../usePersistentState";
import { Hub } from "../Hub/Hub";
import { UpdateStateAction, PrevStateAction } from "../Hub/useHub";


export type UseStoredHub<T> = [ T, UpdateStateAction<T> ];

/**
 * A custom hook that synchronizes a shared state hub with persistent storage (like localStorage or sessionStorage).
 * The state of the hub is stored and retrieved using a key in persistent storage, ensuring the hub state persists across reloads.
 * 
 * @template T - The type of the state managed by the hub.
 * @param {string} key - The key used to store and retrieve the hub's state from persistent storage.
 * @param {Hub<T>} hub - The shared state hub to be synchronized with persistent storage.
 * @returns {UseStoredHub<T>} - Returns the synchronized hub along with any additional functionality for managing the stored state.
 * 
 * @example
 * // Example usage of `useStoredHub` to synchronize a hub with localStorage:
 * const storedHub = useStoredHub('myHubKey', myHub);
 * 
 * // The state of `myHub` will now persist in localStorage under the key 'myHubKey'.
 */
export function useStoredHub<T>(key: string, hub: Hub<T>): UseStoredHub<T> {
    const [ state, setState ] = usePersistentState(key, hub.getCurrentState());

    useEffect(() => {
        
        hub.attachListener(setState);
        
        return () => {
            hub.detachListener(setState);
        }
    }, [hub]);

    useEffect(() => {
        hub.setCurrentState(state);
    }, [state]);

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