import { useEffect, useRef, useState } from "react";
import { PromiseHubError, PromiseHub, PromiseHubType } from ".";

/**
 * A type representing the function to re-run the promise action.
 * 
 * @template R - The type of the resolved value from the promise.
 * @returns {Promise<R | undefined>} - A promise that resolves with the updated state or `undefined` if the promise fails.
 */
export type ReAction<R> = () => Promise<R | undefined>;

/**
 * A type representing the action that performs an asynchronous operation to update the state.
 * 
 * @template R - The type of the state being managed by the promise action.
 * @param {R} prevState - The previous state before the promise action runs.
 * @returns {Promise<R>} - A promise that resolves with the new state after the async operation.
 */
export type PromiseAction<R> = (prevState: R) => Promise<R>;

/**
 * A type representing the structure returned by the `usePromiseHub` hook.
 * 
 * @template R - The type of the state being managed by the promise hub.
 * @template E - The type of the error object if the promise action fails.
 * 
 * @type {Array} - Returns a tuple:
 * - `R`: The current state managed by the hub.
 * - `PromiseHubError<E>`: An object representing any error encountered during the promise execution.
 * - `boolean`: A loading flag that indicates if the promise action is still running.
 * - `ReAction<R>`: A function to manually trigger the promise action and update the state.
 */
export type UsePromiseHub<R, E> = [
    R,                        // The current state
    PromiseHubError<E>,        // Error if the promise failed
    boolean,                   // Loading state
    ReAction<R>,               // Function to re-run the promise action
];

/**
 * A hook that provides an easy way to manage asynchronous state using a promise-based hub.
 * It returns the current state, error state, loading state, and a function to manually trigger the promise.
 * 
 * @template R - The type of the state managed by the promise hub.
 * @template E - The type of the error object, defaults to `Error`.
 * 
 * @param {PromiseHub<R, E>} promiseHub - The promise hub managing the async state.
 * @param {boolean} [immediate=true] - If `true`, the promise action will be triggered immediately on hook initialization.
 * 
 * @returns {UsePromiseHub<R, E>} - Returns the current state, any error, loading flag, and a function to re-run the promise action.
 * 
 * @example
 * // Example usage of `usePromiseHub`:
 * const [data, error, isLoading, retry] = usePromiseHub(fetchUserDataHub);
 * 
 * // Render the state and provide retry functionality
 * return (
 *   <div>
 *     {isLoading ? <p>Loading...</p> : <p>{data}</p>}
 *     {error && <p>Error: {error.message}</p>}
 *     <button onClick={retry} disabled={isLoading}>Retry</button>
 *   </div>
 * );
 */
export function usePromiseHub<R, E = Error>(
    promiseHub: PromiseHub<R, E>,
    immediate: boolean = true,
): UsePromiseHub<R, E> {

    const hasRenderedRef = useRef<boolean>(false);

    const [ state, setState ] = useState<PromiseHubType<R, E>>({
        currentState: promiseHub.getCurrentState(),
        pending: promiseHub.getPendingState(),
        error: promiseHub.getErrorState() as any,
    });

    useEffect(() => {
        promiseHub.attachListener(setState);

        return () => {            
            promiseHub.detachListener(setState);
        }
    }, [promiseHub]);

    useEffect(() => {

        if(!immediate || hasRenderedRef.current) return;
        
        hasRenderedRef.current = true;
        promiseHub.reAction();
        
    }, [promiseHub, immediate]);

    return [ 
        state.currentState, 
        state.error,
        state.pending,
        promiseHub.reAction.bind(promiseHub)
    ] as const;
}


/**
 * A type representing the structure returned by the `usePromiseReadHub` hook.
 * 
 * @template R - The type of the state managed by the promise hub.
 * @template E - The type of the error object if the promise action fails.
 * 
 * @type {Array} - Returns a tuple:
 * - `R`: The current state managed by the hub.
 * - `PromiseHubError<E>`: An object representing any error encountered during the promise execution.
 * - `boolean`: A loading flag that indicates if the promise action is still running.
 */
export type UsePromiseReadHub<R, E> = [
    R,                        // The current state
    PromiseHubError<E>,        // Error if the promise failed
    boolean                    // Loading state
];

/**
 * A hook that provides a read-only access to the state managed by a promise hub.
 * It returns the current state, any error state, and a loading flag to indicate the promise's execution status.
 * 
 * @template R - The type of the state managed by the promise hub.
 * @template E - The type of the error object, defaults to `Error`.
 * 
 * @param {PromiseHub<R, E>} promiseHub - The promise hub managing the async state.
 * 
 * @returns {UsePromiseReadHub<R, E>} - Returns the current state, any error encountered, and a loading flag.
 * 
 * @example
 * // Example usage of `usePromiseReadHub`:
 * const [data, error, isLoading] = usePromiseReadHub(fetchUserDataHub);
 * 
 * // Render the state
 * return (
 *   <div>
 *     {isLoading ? <p>Loading...</p> : <p>{data}</p>}
 *     {error && <p>Error: {error.message}</p>}
 *   </div>
 * );
 */
export function usePromiseReadHub<R, E = Error>(promiseHub: PromiseHub<R, E>): UsePromiseReadHub<R, E> {
    const [ state, setState ] = useState<PromiseHubType<R, E>>({
        currentState: promiseHub.getCurrentState(),
        pending: promiseHub.getPendingState(),
        error: promiseHub.getErrorState() as any,
    });

    useEffect(() => {
        promiseHub.attachListener(setState);

        return () => {
            promiseHub.detachListener(setState);    
        }
    }, [promiseHub]);

    return [
        state.currentState,
        state.error,
        state.pending,
    ] as const;
}

/**
 * A hook that provides access to the reAction method of a given promise hub.
 * The `reAction` method allows you to manually trigger the asynchronous promise action defined in the hub.
 * 
 * @template R - The type of the state managed by the promise hub.
 * 
 * @param {PromiseHub<R>} promiseHub - The promise hub managing the asynchronous state.
 * 
 * @returns {ReAction<R>} - Returns a function that can be used to trigger the asynchronous action of the promise hub.
 * 
 * @example
 * // Example usage of `usePromiseHubAction`:
 * const retryAction = usePromiseHubAction(fetchUserDataHub);
 * 
 * // Trigger the action manually
 * retryAction().then((newData) => {
 *   console.log('Data updated:', newData);
 * });
 */
export function usePromiseHubAction<R>(promiseHub: PromiseHub<R>): ReAction<R> {
    return promiseHub.reAction.bind(promiseHub);
}