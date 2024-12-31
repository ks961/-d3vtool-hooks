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

export type ResolveAction = (value?: unknown) => void;

/**
 * A type representing the structure returned by the `usePromiseHub` hook.
 * 
 * @template R - The type of the state being managed by the promise hub.
 * @template E - The type of the error object if the promise action fails.
 * 
 * @type {Object} - Returns an object with the following properties:
 * - `data`: The current state managed by the promise hub.
 * - `error`: An object representing any error encountered during the promise execution.
 * - `isPending`: A boolean flag indicating whether the promise action is still running (loading state).
 * - `reAction`: A function that can be called to manually trigger the promise action and update the state.
 */
export type UsePromiseHub<R, E> = {
    data: R,                        // The current state managed by the promise hub.
    error: PromiseHubError<E>,        // The error object if the promise failed.
    isPending: boolean,               // A flag indicating whether the promise is currently in progress (loading state).
    reAction: ReAction<R>,            // Function to manually trigger the promise action.
};

/**
 * Configuration options for the `usePromiseHub` hook.
 * 
 * @type {Object} - Defines the configuration for managing the asynchronous state.
 * - `immediate`: If `true`, the promise action will be triggered immediately upon hook initialization.
 * - `suspense`: If `true`, integrates with React Suspense, suspending the component until the promise resolves.
 */
export type UsePromiseHubConfig = {
    immediate?: boolean,   // Whether the promise action should run immediately on hook initialization.
    suspense?: boolean,    // Whether to enable Suspense behavior for the promise.
};

/**
 * A hook that provides an easy way to manage asynchronous state using a promise-based hub.
 * It returns the current state, any errors, loading state, and a function to manually trigger the promise.
 * 
 * @template R - The type of the state managed by the promise hub.
 * @template E - The type of the error object, defaults to `Error`.
 * 
 * @param {PromiseHub<R, E>} promiseHub - The promise hub managing the async state.
 * @param {UsePromiseHubConfig} [config={immediate: true, suspense: false}] - Configuration options for the hook.
 * 
 * @returns {UsePromiseHub<R, E>} - Returns an object containing:
 *   - `data`: The current state managed by the promise hub.
 *   - `error`: The error object if the promise fails.
 *   - `isPending`: A boolean indicating whether the promise is in progress (loading).
 *   - `reAction`: A function that can be used to manually trigger the promise action and update the state.
 * 
 * @example
 * // Example usage of `usePromiseHub` with immediate execution and retry functionality:
 * const { data, error, isPending, reAction } = usePromiseHub(fetchUserDataHub, { immediate: true });
 * 
 * return (
 *   <div>
 *     {isPending ? <p>Loading...</p> : <p>{data}</p>}
 *     {error && <p>Error: {error.message}</p>}
 *     <button onClick={reAction} disabled={isPending}>Retry</button>
 *   </div>
 * );
 * 
 * @example
 * // Example usage with Suspense behavior enabled:
 * const { data, error, reAction } = usePromiseHub(fetchUserDataHub, { immediate: true, suspense: true });
 * 
 * return (
 *   <Suspense fallback={<p>Loading...</p>}>
 *      {data?.user}
 *     {error && <p>Error: {error.message}</p>}
 *   </Suspense>
 * );
 */
export function usePromiseHub<R, E = Error>(
    promiseHub: PromiseHub<R, E>,
    config?: UsePromiseHubConfig
): UsePromiseHub<R, E> {

    const hasRenderedRef = useRef<boolean>(false);
    const promiseResolveFnRef = useRef<ResolveAction | null>(null);

    const [ state, setState ] = useState<PromiseHubType<R, E>>({
        currentState: promiseHub.getCurrentState(),
        pending: promiseHub.getPendingState(),
        error: promiseHub.getErrorState() as any,
    });

    const userConfig: UsePromiseHubConfig = {
        immediate: config?.immediate ?? true,
        suspense: config?.suspense ?? false
    }

    useEffect(() => {
        promiseHub.attachListener(setState);

        return () => {            
            promiseHub.detachListener(setState);
        }
    }, [promiseHub]);

    useEffect(() => {

        if(!userConfig.immediate || hasRenderedRef.current) return;
        
        hasRenderedRef.current = true;
        promiseHub.reAction();
        
    }, [promiseHub, userConfig.immediate]);

    if(userConfig.suspense && state.pending) {

        throw new Promise((resolve) => {
            if(promiseResolveFnRef.current instanceof Function) {
                promiseResolveFnRef.current();
            }
            promiseResolveFnRef.current = resolve;
        });
    } else if(
        userConfig.suspense && 
        !state.pending &&
        promiseResolveFnRef.current instanceof Function
    ) {
        promiseResolveFnRef.current();
        promiseResolveFnRef.current = null;
    }

    return {
        data: state.currentState, 
        error: state.error,
        isPending: state.pending,
        reAction: promiseHub.reAction.bind(promiseHub)
    } as const;
}


/**
 * A type representing the structure returned by the `usePromiseReadHub` hook.
 * 
 * @template R - The type of the state managed by the promise hub.
 * @template E - The type of the error object if the promise action fails.
 * 
 * @type {Object} - Returns an object with the following properties:
 * - `data`: The current state managed by the promise hub.
 * - `error`: An object representing any error encountered during the promise execution.
 * - `isPending`: A boolean flag indicating whether the promise action is still running (loading state).
 */
export type UsePromiseReadHub<R, E> = {
    data: R,                        // The current state managed by the promise hub.
    error: PromiseHubError<E>,       // The error object if the promise failed.
    isPending: boolean,              // A flag indicating whether the promise is currently in progress (loading state).
};

/**
 * A hook that provides read-only access to the state managed by a promise hub.
 * It returns the current state, any error state, and a loading flag indicating the promise's execution status.
 * 
 * @template R - The type of the state managed by the promise hub.
 * @template E - The type of the error object, defaults to `Error`.
 * 
 * @param {PromiseHub<R, E>} promiseHub - The promise hub managing the async state.
 * @param {boolean} [suspense=false] - If `true`, integrates with React Suspense, suspending the component until the promise resolves.
 * 
 * @returns {UsePromiseReadHub<R, E>} - Returns an object containing:
 *   - `data`: The current state managed by the promise hub.
 *   - `error`: The error object if the promise failed.
 *   - `isPending`: A boolean indicating whether the promise is in progress (loading state).
 * 
 * @example
 * // Example usage of `usePromiseReadHub`:
 * const { data, error, isPending } = usePromiseReadHub(fetchUserDataHub);
 * 
 * // Render the state
 * return (
 *   <div>
 *     {isPending ? <p>Loading...</p> : <p>{data}</p>}
 *     {error && <p>Error: {error.message}</p>}
 *   </div>
 * );
 * 
 * @example
 * // Example usage with Suspense behavior enabled:
 * const { data, error } = usePromiseReadHub(fetchUserDataHub, true);
 * 
 * return (
 *   <Suspense fallback={<p>Loading...</p>}>
 *     <p>{data?.user}</p>
 *     {error && <p>Error: {error.message}</p>}
 *   </Suspense>
 * );
 */
export function usePromiseReadHub<R, E = Error>(
    promiseHub: PromiseHub<R, E>,
    suspense: boolean = false
): UsePromiseReadHub<R, E> {

    const promiseResolveFnRef = useRef<ResolveAction | null>(null);

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

    if(suspense && state.pending) {
        throw new Promise((resolve) => {
            if(promiseResolveFnRef.current instanceof Function) {
                promiseResolveFnRef.current();
            }
            promiseResolveFnRef.current = resolve;
        });
    } else if(
        suspense && 
        !state.pending &&
        promiseResolveFnRef.current instanceof Function
    ) {
        promiseResolveFnRef.current();
        promiseResolveFnRef.current = null;
    }

    return {
        data: state.currentState,
        error: state.error,
        isPending: state.pending,
    } as const;
}


export type UsePromiseHubAction<R, E> = {
    reAction: ReAction<R>,       // Function to manually trigger the asynchronous action
    error: PromiseHubError<E>,   // The current error state if the promise action failed
    isPending: boolean,          // A flag indicating if the promise action is still running
};

/**
 * A custom hook that provides access to the `reAction` function from a given PromiseHub, 
 * along with the current error state and loading status.
 * 
 * The `reAction` function allows you to manually trigger the asynchronous action defined within the hub.
 * This is useful when you want to re-trigger a specific action (e.g., fetching data) based on some user interaction.
 * 
 * @template R - The type of the state managed by the promise hub.
 * @template E - The type of error that might be encountered during the promise execution, defaulting to `Error`.
 * 
 * @param {PromiseHub<R, E>} promiseHub - The promise hub managing the asynchronous state.
 * @param {boolean} [suspense=false] - If `true`, the hook will suspend rendering while the promise is pending.
 * 
 * @returns {UsePromiseHubAction<R, E>} - Returns an object containing:
 * - `reAction`: A function to manually trigger the asynchronous action.
 * - `error`: The current error state (if the promise failed).
 * - `isPending`: A boolean flag indicating whether the asynchronous action is still in progress.
 * 
 * @example
 * // Example usage of `usePromiseHubAction` for manually refetching data:
 * const { reAction: refetchProducts, error, isPending } = usePromiseHubAction(productListHub);
 * 
 * return (
 *   <div>
 *     <button onClick={refetchProducts} disabled={isPending}>
 *       {isPending ? 'Loading...' : 'Refetch Products'}
 *     </button>
 *     {error && <p style={{ color: 'red' }}>Error fetching products: {error.message}</p>}
 *   </div>
 * );
 * 
 * // In this example:
 * // - `refetchProducts` is the function that re-triggers the data fetching logic in the `productListHub`.
 * // - The button is disabled and displays "Loading..." while the action is in progress.
 * // - If the action fails, an error message is displayed below the button.
 * 
 * @example
 * // Example usage of `usePromiseHubAction` with suspense enabled:
 * // The Suspense boundary will wait for the promise to resolve before rendering the component.
 * import React, { Suspense } from "react";
 * 
 * const ProductList: React.FC = () => {
 *   const { reAction: refetchProducts, error, isPending } = usePromiseHubAction(productListHub, true);
 * 
 *   return (
 *     <Suspense fallback={<p>Loading products...</p>}>
 *       <div>
 *         <button onClick={refetchProducts} disabled={isPending}>
 *           {isPending ? 'Loading...' : 'Refetch Products'}
 *         </button>
 *         {error && <p style={{ color: 'red' }}>Error fetching products: {error.message}</p>}
 *       </div>
 *     </Suspense>
 *   );
 * };
 * 
 * // In this example:
 * // - `Suspense` wraps the component to handle the loading state while the promise action is pending.
 * // - If `suspense` is set to `true`, the component will suspend until the asynchronous action is completed.
 * // - The `fallback` prop in `Suspense` will show the loading text until the promise resolves.
 * 
 */
export function usePromiseHubAction<R, E = Error>(
    promiseHub: PromiseHub<R>,
    suspense: boolean = false
): UsePromiseHubAction<R, E> {

    const promiseResolveFnRef = useRef<ResolveAction | null>(null);
    
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
    
    if(suspense && state.pending) {
        throw new Promise((resolve) => {
            if(promiseResolveFnRef.current instanceof Function) {
                promiseResolveFnRef.current();
            }
            promiseResolveFnRef.current = resolve;
        });
    } else if(
        suspense && 
        !state.pending &&
        promiseResolveFnRef.current instanceof Function
    ) {
        promiseResolveFnRef.current();
        promiseResolveFnRef.current = null;
    }

    return {
        reAction: promiseHub.reAction.bind(promiseHub),
        error: state.error,
        isPending: state.pending,
    } as const;
}