import { ExtractEventListeners } from "./utils";
import { ObjectValidationError, VInfer } from "@d3vtool/utils"
import React, { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { ObjectValidator } from "@d3vtool/utils/dist/validator/ObjectValidator";

/**
 * Type definition for form errors, where each key in the FormType
 * corresponds to a string representing the error message for that field.
 */
export type FormError<FormType> = {
    [P in keyof FormType]: string;
};

/**
 * Type definition for a form submission action. This function accepts a form event
 * and returns a Promise that resolves when the submission process is complete.
 */
export type FormAction = (event: FormEvent) => Promise<void>;

/**
 * Type definition for a middleware action in the form submission process.
 * This function returns a Promise that resolves when the middleware logic is complete.
 */
export type FormMiddlewareAction = () => void | Promise<void>;

/**
 * Type definition for a submit action that triggers a form submission and
 * allows you to specify a middleware action to run before submission.
 */
export type SubmitAction = (callback: FormMiddlewareAction) => FormAction;

export type SetFormDataAction<F> = 
    (key: keyof F, data: F[keyof F]) => void;
    
export type GetFormDataAction<F> = (key: keyof F) => F[keyof F];

/**
 * Type definition for the hook that provides the form state (F),
 * the form submission handler (SubmitAction), form error handling (FormError),
 * and the input reference setup action (SetupInputRefsAction).
 */
export type UseForm<F> = {
    formData: F,                      // Form state
    onSubmit: SubmitAction,           // Submit action function
    formErrors: FormError<F>,         // Form errors object
    setFormData: SetFormDataAction<F>,  // Function to set specific form data
    getFormData: GetFormDataAction<F>,  // Function to get specific form data
    listeners: ExtractEventListeners<HTMLInputElement>;  // Event listeners for inputs
}

/**
 * useForm is a custom React hook for managing form state with validation. It provides
 * an efficient way to handle form input values, perform validation based on a schema, and
 * manage errors and submission logic.
 *
 * @template FormSchema - The schema used to validate the form, based on an object validator.
 *
 * @param defaultFormData - The initial form data object that matches the shape of the form schema.
 * @param formSchema - The schema used to validate the form fields. This ensures that form values adhere to the schema's validation rules.
 *
 * @returns An object containing:
 * - formData: The current form data as an object that matches the schema shape.
 * - onSubmit: A function to handle form submission. Pass a callback to execute when the form is successfully validated and submitted.
 * - formErrors: An object that contains error messages for each form field, keyed by the field name.
 * - setFormData: A function that allows you to set the form data for a specific field.
 * - getFormData: A function that allows you to retrieve the form data for a specific field.
 * - listeners: Event listeners to be passed to the input fields for handling user interactions.
 *
 * @example
 * const schema = Validator.object({
 *   email: Validator.string().email(),
 *   password: Validator.string().password(),
 * });
 *
 * const {
 *   formData, onSubmit, formErrors, setFormData, listeners
 * } = useForm({
 *   email: "",
 *   password: "",
 * }, schema);
 *
 * @example
 * const handleOnSubmit = async () => {
 *   // Handle form submission logic here
 * };
 *
 * <form onSubmit={onSubmit(handleOnSubmit)}>
 *   <input 
 *     name="email" // name should be same as in schema key
 *     {...listeners}  // Attach listeners here
 *     type="text"
 *   />
 *   {formErrors.email && <span>{formErrors.email}</span>}
 *   
 *   <input 
 *     name="password" // name should be same as in schema key
 *     {...listeners}  // Attach listeners here
 *     type="password"
 *   />
 *   {formErrors.password && <span>{formErrors.password}</span>}
 *   
 *   <button type="submit">Submit</button>
 * </form>
 *
 * // Access individual form data
 * const email = getFormData('email');
 */
export function useForm<FormSchema extends ObjectValidator<Object>>(
    defaultFormData: VInfer<FormSchema>,
    formSchema: FormSchema
): UseForm<VInfer<FormSchema>> {

    type FormType = VInfer<FormSchema>; 

    const formDataRef = useRef<FormType>(defaultFormData);

    const [ _, trigger ] = useState<boolean>(false);

    const formErrorRef = useRef<FormError<FormType>>(
        Object.keys(defaultFormData).reduce((acc, key) => {
            acc[key as keyof FormError<FormType>] = '';
            return acc;
        }, {} as FormError<FormType>)
    );

    function handleOnBlur(event: React.FocusEvent<HTMLInputElement>) {
        if(event.type === "focus") return;

        const { name } = event.target as HTMLInputElement;

        if(formErrorRef.current[name as keyof FormError<FormType>].length > 0) 
            return;

        const errors = formSchema.validateSafely(formDataRef.current);
        handleFormErrors(name, errors);
    }

    function handleFormErrors(
        name: string,
        errors: Record<string, string[]>,
    ) {
        const currentInputErrorMsgs = errors[name];
        if(currentInputErrorMsgs?.length > 0 && currentInputErrorMsgs[0] !== (formErrorRef.current as any)[name]) {
            (formErrorRef.current as any)[name] = currentInputErrorMsgs[0];
            
            trigger(prev => !prev); 
        } else if(currentInputErrorMsgs === undefined && formErrorRef.current[name as keyof typeof formErrorRef.current].length > 0) {            
            formErrorRef.current[name as keyof typeof formErrorRef.current] = "";
            
            trigger(prev => !prev); 
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

    const setFormData = useCallback((key: keyof FormType, data: FormType[keyof FormType]) => {
        formDataRef.current[key] = data;
        
        const errors = formSchema.validateSafely(formDataRef.current);
        handleFormErrors(key as string, errors);
    }, []); 

    const getFormData = useCallback((key: keyof FormType): FormType[keyof FormType] => {
        return formDataRef.current[key];
    }, []);

    function handleOnChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        
        (formDataRef.current as any)[name] = value;

        const errors = formSchema.validateSafely(formDataRef.current);

        handleFormErrors(name, errors);
    }

    const listeners: ExtractEventListeners<HTMLInputElement> = useMemo(() => ({
        onChange: handleOnChange,
        onBlur: handleOnBlur,
    }), [formSchema]);
    
    return {
        listeners,
        formData: formDataRef.current, 
        onSubmit: onSubmit,
        formErrors: formErrorRef.current,
        getFormData,
        setFormData
     } as const;
}