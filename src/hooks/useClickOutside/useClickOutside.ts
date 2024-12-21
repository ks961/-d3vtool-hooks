import { useEffect, useRef } from "react";

export function useClickOutside<T extends HTMLElement>(action: VoidFunction) {
    const targetRef = useRef<T>(null);

    function handleOutsideClick(event: React.PointerEvent<T>) {
        if(!targetRef.current?.contains(event.target as any)) {
            action();
        }
    }

    useEffect(() => {
        if(!targetRef.current) return;

        targetRef?.current.addEventListener("click", handleOutsideClick as any);
        
        return () => {
            targetRef?.current?.addEventListener("click", handleOutsideClick as any);
        }
    }, [targetRef.current]);


    return targetRef;
}