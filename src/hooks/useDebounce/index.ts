import { VoidFunction } from "../types";
import { useCallback, useRef } from "react";

export type ms = number;
export type DebounceAction = () => void;

/**
 * A custom React hook to debounce a given action, ensuring it is only called after a specified delay has passed
 * since the last invocation. Useful for optimizing performance during events like typing or resizing.
 * 
 * @param delay - The amount of time in milliseconds to wait before invoking the action after the last event.
 * @param debounceAction - The action (callback function) to be executed after the debounce delay.
 * 
 * @returns A function that, when invoked, triggers the debounce timer and eventually calls the `debounceAction` 
 *          after the specified delay.
 *
 * @example
 * const handleDebouncedSearch = useDebounce(300, () => {
 *   // Perform a search or any action that should be debounced
 * });
 *
 * <input onChange={handleDebouncedSearch} />
 */
export function useDebounce(
    delay: ms, 
    debounceAction: DebounceAction
): VoidFunction {
    
    const timeoutRef = useRef<NodeJS.Timeout>();
    
    const debounce = useCallback(() => {
        clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(debounceAction, delay);
    }, [delay, debounceAction]);

    return debounce;
}