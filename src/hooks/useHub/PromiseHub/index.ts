import { Dispatch, SetStateAction } from "react";
import { InitializerAction } from "../Hub/Hub";
import { PromiseAction } from "./usePromiseHub";

export type PromiseHubError<E> = E | null;
export type PromiseHubType<R, E> = {
    currentState: R,
    pending: boolean,
    error: PromiseHubError<E>,
}

export type PromiseListener<R, E> = Dispatch<SetStateAction<PromiseHubType<R, E>>>;
export class PromiseHub<R, E = Error> {
    private promiseState: PromiseHubType<R, E>;
    private promiseAction: PromiseAction<R>;
    private onChangeListeners = new Set<Function>();
    private listeners = new Set<PromiseListener<R, E>>();

    constructor(
        initialState: R,
        promiseAction: PromiseAction<R>
    ) {
        this.promiseState = {
            error: null,
            pending: false,
            currentState: initialState,
        };
        this.promiseAction = promiseAction;
    }

    public async reAction() {
        this.setPendingState(true);
        try {
            const result = await this.promiseAction(this.getCurrentState());
            this.setCurrentState(result);
            return result;
        } catch(err) {
            this.setErrorState(err as any);
        } finally {
            this.setPendingState(false);
        }
    }

    public attachListener(listener: PromiseListener<R, E>): void {
        this.listeners.add(listener);
    }

    public detachListener(listener: PromiseListener<R, E>): void {
        this.listeners.delete(listener);
    }

    public notifyListeners(newPromiseState: PromiseHubType<R, E>) {
        this.listeners.forEach(listener => listener(newPromiseState));
        this.onChangeListeners.forEach(listener => listener());
    }

    public getCurrentState() {
        return this.promiseState.currentState;
    }

    public setCurrentState(newCurrentState: R) {
        this.promiseState.currentState = newCurrentState;

        const newState = {
            ...this.promiseState
        }

        this.listeners.forEach(listener => listener(newState));
        this.onChangeListeners.forEach(listener => listener());
    }

    public setPendingState(pendingState: boolean) {
        this.promiseState.pending = pendingState;
        const newState = {
            ...this.promiseState
        }
        this.listeners.forEach(listener => listener(newState));
        this.onChangeListeners.forEach(listener => listener());
    }

    public getPendingState() {
        return this.promiseState.pending;
    }

    public getErrorState() {
        return this.promiseState.error;
    }

    public setErrorState(error: E) {
        this.promiseState.error = error;

        const newState = {
            ...this.promiseState
        }

        this.listeners.forEach(listener => listener(newState));
        this.onChangeListeners.forEach(listener => listener());
    }

    public onChange(callback: Function) {
        this.onChangeListeners.add(callback);
    }

    public removeOnChange(callback: Function) {
        this.onChangeListeners.delete(callback);
    }
}

/**
 * Creates a promise-based hub that manages a state and handles asynchronous actions.
 * The state is updated based on the result of the provided promise action, allowing
 * for easy state management involving async operations such as API calls.
 *
 * @template R - The type of the state managed by the promise hub.
 * 
 * @param {R | InitializerAction<R>} initialState - The initial state or a function to initialize the state.
 * @param {PromiseAction<R>} promiseAction - The asynchronous function that will resolve to update the state.
 * 
 * @returns {PromiseHub<R>} - Returns a PromiseHub which contains the current state, a loading flag, an error state, and a method to trigger the promise action.
 * 
 * @example
 * // Example usage of `createPromiseHub`:
 * const userHub = createPromiseHub<User | undefined>(undefined, fetchUserData);
 */
export function createPromiseHub<R>(
    initialState: R | InitializerAction<R>,
    promiseAction: PromiseAction<R>,
): PromiseHub<R> {
    return new PromiseHub<R>(initialState instanceof Function ?
        initialState() : initialState, promiseAction);
}