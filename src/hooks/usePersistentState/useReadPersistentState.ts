import { useEffect, useState } from "react";

/**
 * A custom hook that reads the persistent state from localStorage without providing the ability to update it across tabs.
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
export function useReadPersistentState<T = unknown>(key: string): T | undefined {
    const [ state, setState ] = useState<T>();

    function handleStorageChange(event: StorageEvent) {
        if(event.key === key && event.newValue) {
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
        } catch{};

        window.addEventListener("storage", handleStorageChange);
        
        return () => {
            window.addEventListener("storage", handleStorageChange);
        }
    }, []);


    return state;
}