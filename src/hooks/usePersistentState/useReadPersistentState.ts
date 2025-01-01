import { deserialize } from "./utils";
import { DeSerializerFn, StorageBroadcast } from "./usePersistentState";
import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * A custom hook that reads the persistent state from `localStorage` without providing the ability to update it across windows/tabs.
 * The hook supports deserializing the state value from `localStorage` using a custom deserialization function.
 *
 * Unsupported types in `localStorage` may require a custom deserialization process.
 * 
 * @template T - The type of the state value. Defaults to `unknown` if not provided.
 * 
 * @param {string} key - The key under which the state is stored in `localStorage`.
 * @param {DeSerializerFn<T>} [deserializerFn=deserialize] - Optional function to deserialize the stored value. Defaults to a generic `deserialize` function.
 * 
 * @returns {T | undefined} - Returns the deserialized state value if found in storage, or `undefined` if no value is found for the given key.
 * 
 * @example
 * // Reading a number value from persistent storage:
 * const state = useReadPersistentState<number>("counter");
 * return (
 *   <div>
 *     Read: {state}
 *   </div>
 * );
 * 
 * @example
 * // Reading an object value from persistent storage with a custom deserializer:
 * 
 * class User {
 *     constructor(name: string) {
 *         this.name = name;
 *     }
 * 
 *     static serializerFn(user: User) {
 *         return user.name;
 *     }
 * 
 *     static deserializerFn(data: string) {
 *         return new User(data);
 *     }
 * }
 * 
 * const state = useReadPersistentState<User>('user', User.deserializerFn);
 * return (
 *   <div>
 *     User: {state?.name}
 *   </div>
 * );
 * 
 * @note The following types are not supported natively by `localStorage` and may need a custom deserialization function:
 * - "WeakMap", "WeakSet", "Promise", "Error", "EvalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError", "Proxy", "Reflect", "WeakRef"
 */ 
export function useReadPersistentState<T = unknown>(
    key: string,
    deserializerFn: DeSerializerFn<T> = deserialize
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

            const parsedData = deserializerFn(data);
            
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