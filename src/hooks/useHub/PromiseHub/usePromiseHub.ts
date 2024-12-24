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


export type UsePromiseHubAction<R, E> = [
    ReAction<R>,
    PromiseHubError<E>,
    boolean,
]

/**
 * A custom hook that returns the reAction function from the provided PromiseHub, along with the current error state and loading status.
 * 
 * The `reAction` function allows you to manually trigger the asynchronous action defined within the hub.
 * 
 * @template R - The type of the state managed by the promise hub.
 * @template E - The type of error that might be encountered during the promise execution. Defaults to `Error`.
 * 
 * @param {PromiseHub<R, E>} promiseHub - The promise hub managing the asynchronous state.
 * 
 * @returns {UsePromiseHubAction<R, E>} - A tuple containing:
 * - The `reAction` function to manually trigger the asynchronous action.
 * - The current error state (`PromiseHubError<E>`).
 * - A boolean indicating whether the action is currently loading.
 * 
 * @example
 * // Assuming you have a PromiseHub managing the product list
 * const [refetchProducts, error, isLoading] = usePromiseHubAction(productListHub);
 * 
 * return (
 *   <div>
 *     <button onClick={refetchProducts} disabled={isLoading}>
 *       {isLoading ? 'Loading...' : 'Refetch Products'}
 *     </button>
 *     {error && <p style={{ color: 'red' }}>Error fetching products: {error.message}</p>}
 *   </div>
 * );
 * 
 * // The `refetchProducts` action will re-trigger the fetch logic in the `productListHub`.
 * // While the fetch is ongoing, the button will be disabled and show "Loading...".
 * // If an error occurs during the fetch, it will be displayed below the button.
 */
export function usePromiseHubAction<R, E = Error>(promiseHub: PromiseHub<R>): UsePromiseHubAction<R, E> {
    const [ state, setState ] = useState<PromiseHubType<R, E>>({
        currentState: promiseHub.getCurrentState(),
        pending: promiseHub.getPendingState(),
        error: promiseHub.getErrorState() as any,
    });

    useEffect(() => {
        promiseHub.attachListener(setState as any);
        
        return () => {
            promiseHub.detachListener(setState as any);
        }
    }, []);

    return [
        promiseHub.reAction.bind(promiseHub),
        state.error,
        state.pending,
    ];
}