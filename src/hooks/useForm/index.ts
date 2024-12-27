import { useDebounce } from "../useDebounce";
import { ObjectValidationError, VInfer } from "@d3vtool/utils"
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ObjectValidator } from "@d3vtool/utils/dist/validator/ObjectValidator";

/**
 * Type definition for form errors, where each key in the `FormType`
 * corresponds to a string representing the error message for that field.
 */
export type FormError<FormType> = {
    [P in keyof FormType]: string;
};

/**
 * Type definition for the function that sets up input element references.
 * This function is called with a reference to an input element and its index.
 */
export type SetupInputRefsAction = (ref: HTMLInputElement, index: number) => void;

/**
 * Type definition for a function that toggles or sets the formData validation state.
 * This function allows the consumer to explicitly enable or disable formData validation.
 * 
 * - If a boolean value is provided (`true` or `false`), it will set the formData validation 
 *   state to that value.
 * - If no argument is provided (`undefined`), the formData validation state will be toggled 
 *   (i.e., if it's currently `true`, it will be set to `false`, and vice versa).
 * 
 * @param vState - An optional boolean indicating the desired formData validation state:
 *   - `true` to enable formData validation.
 *   - `false` to disable formData validation.
 *   - `undefined` to toggle the formData validation state based on its current value.
 */
export type ToggleErrorValidationAction = (vState?: boolean) => void;

/**
 * Type definition for a form submission action. This function accepts a form event
 * and returns a `Promise` that resolves when the submission process is complete.
 */
export type FormAction = (event: FormEvent) => Promise<void>;

/**
 * Type definition for a middleware action in the form submission process.
 * This function returns a `Promise` that resolves when the middleware logic is complete.
 */
export type FormMiddlewareAction = () => Promise<void>;

/**
 * Type definition for a submit action that triggers a form submission and
 * allows you to specify a middleware action to run before submission.
 */
export type SubmitAction = (callback: FormMiddlewareAction) => FormAction;

/**
 * Type definition for the hook that provides the form state (`F`),
 * the form submission handler (`SubmitAction`), form error handling (`FormError`),
 * and the input reference setup action (`SetupInputRefsAction`).
 */
export type UseForm<F> = [
    F,                      // Form state
    SubmitAction,           // Submit action function
    FormError<F>,           // Form errors object
    SetupInputRefsAction,   // Input refs setup action
];

/**
 * `useForm` a custom React hook for managing form state with validation.
 * 
 * @template FormSchema - The schema used to validate the form, based on an object validator.
 *
 * @param defaultFormData - The initial form data object that matches the shape of the form schema.
 * @param formSchema - The schema used to validate the form fields. This ensures that form values adhere to the schema's validation rules.
 * @param lazyValidation - (Optional) A flag to enable lazy formData validation. If set to true, validation will only occur after input stops, rather than on every change. Defaults to `false`.
 *
 * @returns A tuple containing:
 * - `formData`: The current form data as an object that matches the schema shape.
 * - `onSubmit`: A function to handle form submission. Pass a callback to execute when the form is successfully validated and submitted.
 * - `formErrors`: An object that contains error messages for each form field, keyed by the field name.
 * - `setupInputRefs`: A function to set up references to input elements for direct DOM manipulation if necessary.
 *
 * @example
 * const schema = Validator.object({
 *   email: Validator.string().email(),
 *   password: Validator.string().password(),
 * });
 *
 * const [formData, onSubmit, formErrors, setupInputRefs] = useForm({
 *   email: "",
 *   password: "",
 * }, schema, true); // The third parameter is optional. [ Defaults: false ]
 *
 * // Setting Third parameter `lazyValidation` to `true` will 
 * // reduce the no. of re-rendering on formData validation error.
 * 
 * @example
 * const handleOnSubmit = async () => {
 *   // Handle form submission logic here
 * };
 *
 * <form onSubmit={onSubmit(handleOnSubmit)}>
 *   <input 
 *     name="email" 
 *     value={formData.email}
 *     ref={ref => setupInputRefs(ref, 0)}
 *     type="text"
 *     // other input props
 *   />
 *   {formErrors.email && <span>{formErrors.email}</span>}
 *   <input 
 *     name="password" 
 *     value={formData.password}
 *     ref={ref => setupInputRefs(ref, 1)}
 *     type="password"
 *     // other input props
 *   />
 *   {formErrors.password && <span>{formErrors.password}</span>}
 *   <button type="submit">Submit</button>
 * </form>
 */
export function useForm<FormSchema extends ObjectValidator<Object>>(
    defaultFormData: VInfer<FormSchema>,
    formSchema: FormSchema,
    lazyValidation: boolean = false
): UseForm<VInfer<FormSchema>> {

    type FormType = VInfer<FormSchema>; 

    const formInputsRef = useRef<HTMLInputElement[]>([]);

    const formDataRef = useRef<FormType>(defaultFormData);

    const [ _, trigger ] = useState<boolean>(false);

    const memoizedTrigger = useCallback(() => {
        trigger(prev => !prev);
    }, []);

    const debounce = useDebounce(800, memoizedTrigger);

    const formErrorRef = useRef<FormError<FormType>>(
        Object.keys(defaultFormData).reduce((acc, key) => {
            acc[key as keyof FormError<FormType>] = '';
            return acc;
        }, {} as FormError<FormType>)
    );


    function setupInputRefs(ref: HTMLInputElement, index: number) {
        formInputsRef.current[index] = ref;
    }

    function handleOnFocusOrBlur(event: Event) {
        const { name } = event.target as HTMLInputElement;

        if(formErrorRef.current[name as keyof FormError<FormType>].length > 0) 
            return;

        const errors = formSchema.validateSafely(formDataRef.current);
        handleFormErrors(name, errors);
    }

    useEffect(() => {
        
        formInputsRef.current?.forEach(input => {
            input?.addEventListener("input", handleOnInputChange);           
        });
        
        formInputsRef.current?.forEach(input => {
            input?.addEventListener("blur", handleOnFocusOrBlur);
        });
        
        return () => {
            formInputsRef.current?.forEach(input => {
                input?.removeEventListener("input", handleOnInputChange);
            });

            formInputsRef.current?.forEach(input => {
                input?.removeEventListener("blur", handleOnFocusOrBlur);
            });
        }
    }, []);


    function handleFormErrors(
        name: string,
        errors: Record<string, string[]>,
    ) {
        if(errors[name]?.length > 0) {
            (formErrorRef.current as any)[name] = errors[name];
            
            (lazyValidation) ?
                debounce() : trigger(prev => !prev); 
        } else if(formErrorRef.current[name as keyof typeof formErrorRef.current].length > 0) {
            formErrorRef.current[name as keyof typeof formErrorRef.current] = "";
            
            (lazyValidation) ? 
                debounce() : trigger(prev => !prev); 
        }
    }


    function handleOnInputChange(event: Event) {
        const { name, value } = event.target as HTMLInputElement;
        
        (formDataRef.current as any)[name] = value;

        const errors = formSchema.validateSafely(formDataRef.current);

        handleFormErrors(name, errors);
    }

    const onSubmit = useCallback((callback: FormMiddlewareAction) => {
        return async function(event: FormEvent) {
            event.preventDefault();
            
            try {
                formSchema.validate(formDataRef.current);
                await callback();
            } catch(err: unknown) {
                if(err instanceof ObjectValidationError) {
                    if(err.message?.length > 0) {
                        (formErrorRef.current as any)[err.key] = err.message;
                        trigger(prev => !prev);
                    } else if(formErrorRef.current[err.key as keyof typeof formErrorRef.current].length > 0) {
                        formErrorRef.current[err.key as keyof typeof formErrorRef.current] = "";
                        trigger(prev => !prev);
                    }
                }
            }
        }
    }, []);
    
    return [
        formDataRef.current, 
        onSubmit,
        formErrorRef.current,
        setupInputRefs, 
     ] as const;
}