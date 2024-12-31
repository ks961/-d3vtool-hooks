import { StorageBroadcast } from "./usePersistentState";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { deserialize } from "./utils";



/**
 * A custom hook that reads the persistent state from localStorage without providing the ability to update it across windows/tabs.
 * 
 * @template T - The type of the state value. Defaults to `unknown` if not provided.
 * @param {string} key - The key under which the state is stored in localStorage.
 * @returns {T | undefined} - Returns the state value if found in storage, or `undefined` if no value is found for the given key.
 * 
 * @example
 * // Reading a value from persistent storage:
 * const state = useReadPersistentState<number>("counter");
 *   return(
 *       <div>
 *           Read: {state}
 *       </div>
 *   );
 */
export function useReadPersistentState<T = unknown>(
    key: string
): T | undefined {

    const isBrowser = typeof window !== "undefined";

    const channelId = useId();
    const channelRef = useRef<BroadcastChannel | null>(null);

    const [ state, setState ] = useState<T>();

    const handleStorageChange = useCallback((event: MessageEvent<StorageBroadcast<T>>) => {
        if(event.data.type !== "storage-broadcast") return;

        if(event.data.storageData.key === key && event.data.storageData.value) {
            setState(event.data.storageData.value);
        }
    }, [key]);

    useEffect(() => {
        if(!isBrowser) return;
        
        try {
            const data = localStorage.getItem(key);
            if(!data) throw new Error();

            const parsedData = deserialize<T>(data);
            
            setState(parsedData);
        } catch{};

        const channel = new BroadcastChannel(channelId);
        channelRef.current = channel;
 
        channelRef.current?.addEventListener("message", handleStorageChange);
        
        return () => {
            channelRef.current?.removeEventListener("message", handleStorageChange);

            channelRef.current?.close();
            channelRef.current = null;
        }
    }, []);


    return state;
}