import { SecId } from "@d3vtool/secid";

/**
 * A custom React hook that provides a unique security identifier (SecId).
 * This hook may generate or retrieve the SecId depending on its implementation.
 * 
 * @returns {string} The security identifier (SecId) associated with the component or context.
 * 
 * @example
 * const secId = useSecId();
 * console.log(secId); // Logs the unique security identifier.
 */
export function useSecId(): string {
    return SecId.generate();
}