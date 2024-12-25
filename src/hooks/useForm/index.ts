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
    ToggleErrorValidationAction,
];

/**
 * `useForm` is a custom hook that helps with managing form state, form validation,
 * and form submission in React components. It accepts an initial form state and a
 * validation schema, and returns useful handlers for form submission, form errors,
 * and input element references.
 *
 * @param formData - The initial form data which should match the form schema.
 * @param formSchema - The validation schema for the form data, used to validate fields.
 *
 * @returns An array with the form data, submit action, form errors, and input refs setup.
 *
 * @example
 * const schema = Validator.object({
 *     email: Validator.string().email(),
 *     password: Validator.string().password()
 * });
 * 
 * type SchemaType = typeof schema;
 * 
 * const [formData, onSubmit, formErrors, setupInputRefs] = useForm<SchemaType>({
 *     email: "",
 *     password: "",
 * }, schema);
 * 
 * const handleOnSubmit = async () => {
 *     const response = await submitForm(formData);
 *     if (response.status === 'success') {
 *         // Handle successful form submission
 *     }
 * };
 */
export function useForm<FormSchema extends ObjectValidator<Object>>(
    defaultFormData: VInfer<FormSchema>,
    formSchema: FormSchema 
): UseForm<VInfer<FormSchema>> {

    type FormType = VInfer<FormSchema>; 

    const shouldAllowValidation = useRef<boolean>(true);

    const formInputsRef = useRef<HTMLInputElement[]>([]);

    const formDataRef = useRef<FormType>(defaultFormData);

    const [ _, trigger ] = useState<boolean>(false);

    const toggleErrorValidation = useCallback((vState?: boolean) => {
        if(vState !== undefined) {
            shouldAllowValidation.current = vState;
        } else {
            shouldAllowValidation.current = !shouldAllowValidation.current;
        }
    }, []);

    const formErrorRef = useRef<FormError<FormType>>(
        Object.keys(defaultFormData).reduce((acc, key) => {
            acc[key as keyof FormError<FormType>] = '';
            return acc;
        }, {} as FormError<FormType>)
    );

    const [ formErrors, setFormErrors ] = useState<FormError<FormType>>(() => {
        return (Object.keys(defaultFormData).reduce((acc, key) => {
            acc[key as keyof FormError<FormType>] = '';
            return acc;
        }, {} as FormError<FormType>));
    });

    function setupInputRefs(ref: HTMLInputElement, index: number) {
        formInputsRef.current[index] = ref;
    }

    useEffect(() => {
        
        formInputsRef.current?.forEach(input => {
            input?.addEventListener("input", handleOnInputChange);           
        });
        
        return () => {
            formInputsRef.current?.forEach(input => {
                input?.removeEventListener("input", handleOnInputChange);
            });
        }
    }, []);


    const handleOnInputChange = useCallback((event: Event) => {
        const { name, value } = event.target as HTMLInputElement;
        
        (formDataRef.current as any)[name] = value;

        const errors = formSchema.validateSafely(formDataRef.current);

        ;console.log(shouldAllowValidation.current);
        
        if(errors[name]?.length > 0 && shouldAllowValidation.current) {
            (formErrorRef.current as any)[name] = errors[name];
            trigger(prev => !prev);
        } else if(formErrorRef.current[name as keyof typeof formErrorRef.current].length > 0 && shouldAllowValidation.current) {
            formErrorRef.current[name as keyof typeof formErrorRef.current] = "";
            trigger(prev => !prev);
        }
    }, [formErrors]);

    const onSubmit = useCallback((callback: FormMiddlewareAction) => {
        return async function(event: FormEvent) {
            event.preventDefault();
            
            try {
                formSchema.validate(formDataRef.current);
                await callback();
            } catch(err: unknown) {
                if(err instanceof ObjectValidationError && shouldAllowValidation.current) {
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
        toggleErrorValidation,
     ] as const;
}