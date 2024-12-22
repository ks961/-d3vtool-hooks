import { SetStateAction } from "react";

export type OnChangeAction = () => void;
export type InitializerAction<T> = () => T;

export class Hub<T> {
    private currentState: T;
    private onChangeListeners = new Set<OnChangeAction>();
    private listeners = new Set<React.Dispatch<SetStateAction<T>>>();

    constructor(initialState: T) {
        this.currentState = initialState;
    }

    public getCurrentState() {
        return this.currentState;
    }

    public setCurrentState(newState: T) {
        this.currentState = newState;
    }

    public attachListener(listener: React.Dispatch<SetStateAction<T>>) {
        this.listeners.add(listener);
    }

    public removeListener(listener: React.Dispatch<SetStateAction<T>>) {
        this.listeners.delete(listener);
    }

    public notifyListener(newState: T) {
        this.listeners.forEach(listener => listener(newState));
        this.onChangeListeners.forEach(listener => listener());
    }
    
    public onChange(callback: VoidFunction) {
        this.onChangeListeners.add(callback);
    }

    public removeOnChange(callback: VoidFunction) {
        this.onChangeListeners.add(callback);
    }
}

/**
 * Creates a shared state hub to manage and synchronize state across multiple components or contexts.
 * 
 * @template T - The type of the state managed by the hub.
 * @param {T | InitializerAction<T>} initialState - The initial state value or a function that returns the initial state.
 * @returns {Hub<T>} - Returns a hub object that manages the shared state, allowing components to subscribe to and update the state.
 * 
 * @example
 * // Example of creating a hub with an initial state:
 * const myHub = createHub({ count: 0 });
 * 
 * // Example of creating a hub with an initializer function:
 * const myHub = createHub(() => ({ count: 0 }));
 * 
 * // The created hub can be used with hooks like `useHub` or `useReadHub`.
 */
export function createHub<T>(initialState: T | InitializerAction<T>): Hub<T> {
    return new Hub<T>(initialState instanceof Function ?
        initialState() : initialState)
}


/**
 * A type representing a function that computes a derived state based on the current state of the hub.
 * 
 * @template T - The type of the state managed by the hub.
 * @param {T} currentState - The current state of the hub.
 * @returns {T} - The computed or derived state.
 */
export type ComputeAction<T> = (currentState: T) => T;

/**
 * Creates a new computed hub that derives its state based on the current state of an existing hub using a compute action.
 * 
 * @template T - The type of the state managed by the hub.
 * @param {Hub<T>} hub - The original hub from which the state will be derived.
 * @param {ComputeAction<T>} computeAction - A function that computes the new state based on the current state of the original hub.
 * @returns {Hub<T>} - Returns a new hub object that manages the computed state.
 * 
 * @example
 * // Example of creating a computed hub:
 * const myHub = createHub({ count: 0 });
 * 
 * // Create a computed hub that doubles the count value:
 * const computedHub = createComputedHub(myHub, (state) => ({
 *     count: state.count * 2
 * }));
 * 
 * // The computed hub can be used with hooks like `useHub` to get the derived state.
 */
export function createComputedHub<T>(hub: Hub<T>, computeAction: ComputeAction<T>): Hub<T> {
    const computeHub = new Hub(computeAction(hub.getCurrentState()));

    hub.onChange(() => {
        const currentHubState = hub.getCurrentState();
        const newComputedState = computeAction(currentHubState);
        computeHub.notifyListener(newComputedState);
    });

    return computeHub;
}