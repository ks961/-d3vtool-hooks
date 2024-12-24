import { SecId } from "@d3vtool/secid";

/**
 * A custom hook that generates a function to produce unique string identifiers based on the specified length and character set.
 *
 * @param {number} [length=8] - The desired length of the generated ID. Defaults to 8 characters.
 * @param {string} [alphabets="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-"] - The set of characters to use for the ID. Defaults to a combination of uppercase, lowercase, numbers, underscore, and hyphen.
 * 
 * @returns {GenerateAction} - A function that, when called, generates a new unique string ID.
 *
 * @example
 * const secid = useSecId(); // Create a generator function for 8-character IDs
 * console.log(secid()); // Generate a unique ID
 *
 * @example
 * const customSecId = useSecId(10, "ABC123"); // Create a generator for 10-character IDs using "ABC123" as the character set
 * console.log(customSecId()); // Generate a custom ID
 */
type GenerateAction = () => string;
export function useSecId(
    length: number = 8,
    alphabets?: string,
): GenerateAction {

    function generateAction() {
        return SecId.generate(length, alphabets);
    }

    return generateAction;
}