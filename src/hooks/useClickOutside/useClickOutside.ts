import { useEffect, useRef } from "react";

/**
 * A custom React hook that triggers a callback function when a click event occurs outside the referenced element.
 *
 * This hook returns a mutable ref object which should be assigned to the `ref` prop of an element.
 * When the user clicks outside of the referenced element, the provided `action` function will be invoked.
 *
 * @param action - The function to be triggered when a click occurs outside the element.
 * @returns A React mutable ref object that should be assigned to the `ref` of the target element.
 *
 * @template T - The type of the element the hook is attached to. It must extend HTMLElement.
 *
 * @example
 * const ref = useClickOutside(() => {
 *   console.log('Clicked outside');
 * });
 * 
 * return <div ref={ref}>Content</div>;
 */
export function useClickOutside<T extends HTMLElement>(action: VoidFunction) {
    const targetRef = useRef<T>(null);

    function handleOutsideClick(event: React.PointerEvent<T>) {
        if (targetRef.current && !targetRef.current.contains(event.target as Node)) {
            action();
        }
    }

    useEffect(() => {

        document.addEventListener("click", handleOutsideClick as any);
        
        return () => {
            document?.addEventListener("click", handleOutsideClick as any);
        }
    }, []);


    return targetRef;
}