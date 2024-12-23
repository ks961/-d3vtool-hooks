import { SecId } from "@d3vtool/secid";

/**
 * A custom hook that generates a unique string identifier based on the specified length and character set.
 *
 * @param {number} [length=8] - The desired length of the generated ID. Defaults to 8 characters.
 * @param {string} [alphabets="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-"] - The set of characters to use for the ID. Defaults to a combination of uppercase, lowercase, numbers, underscore, and hyphen.
 * 
 * @returns {string} - A randomly generated unique string ID based on the provided parameters.
 *
 * @example
 * const id = useSecId(); // Generates an ID with the default length of 8 characters
 * const customId = useSecId(10, "ABC123"); // Generates a 10-character ID using only the specified character set
 */
export function useSecId(
    length: number = 8,
    alphabets: string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-",
): string {
    return SecId.generate(length, alphabets);
}