import { useCallback, useMemo, useState } from "react";

export type UseBooleanAction = {
    toggle: VoidFunction,
    setFalse: VoidFunction,
    setTrue: VoidFunction,
}

export type UseBoolean = [ boolean, UseBooleanAction ];

/**
 * `useBoolean` is a custom hook that manages a boolean state with actions to toggle,
 * set it to `true`, or set it to `false`.
 * 
 * It returns the current boolean value along with actions to update it.
 * 
 * @param initialValue The initial value of the boolean state. Defaults to `false` if not provided.
 * 
 * @returns A tuple containing:
 * - The current boolean state (`true` or `false`).
 * - An object with three functions:
 *    - `toggle`: A function to toggle the state between `true` and `false`.
 *    - `setTrue`: A function to set the state to `true`.
 *    - `setFalse`: A function to set the state to `false`.
 * 
 * @example
 * ```tsx
 * const [state, actions] = useBoolean(false);
 * 
 * return (
 *   <div>
 *     <p>The current state is: {state ? "True" : "False"}</p>
 *     <button onClick={actions.toggle}>Toggle State</button>
 *     <button onClick={actions.setTrue}>Set to True</button>
 *     <button onClick={actions.setFalse}>Set to False</button>
 *   </div>
 * );
 * ```
 */
export function useBoolean(initialValue: boolean): UseBoolean {
    const [ state, setState ] = useState<boolean>(initialValue);

    const toggle = useCallback(() => setState(prev => !prev), []);
    const setFalse = useCallback(() => setState(false), []);
    const setTrue = useCallback(() => setState(true), []);

    const actions = useMemo(() => ({ toggle, setFalse, setTrue }), [toggle, setFalse, setTrue]);
    
    return [ state, actions ] as const;
}