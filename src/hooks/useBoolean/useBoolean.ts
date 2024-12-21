import { useCallback, useMemo, useState } from "react";

export type ActionCallback = (prev: boolean) => void;

export type BooleanActions = {
    toggle: () => void;
    set: (stateOrCallback: ActionCallback | boolean) => void;
}

export type UseBooleanState = [ boolean, BooleanActions];

export function useBoolean(initialValue: boolean = false): UseBooleanState {
    const [ state, setState ] = useState(initialValue);

    const toggle = useCallback(() => setState(prev => !prev), []);

    const set = useCallback((stateOrCallback: ActionCallback | boolean) => {
        (typeof stateOrCallback === "function") ? 
            (stateOrCallback as ActionCallback)(state) : setState(stateOrCallback)
    }, []);

    const actions: BooleanActions = useMemo(() => ({ toggle, set }), [toggle, set]);

    return [ state, actions ] as const;
}