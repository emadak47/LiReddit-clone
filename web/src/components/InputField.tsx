import React, { InputHTMLAttributes } from "react";
import { useField } from "formik";
import {
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    Textarea
} from "@chakra-ui/react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    name: string;
    label: string;
    textarea?: boolean;
};

export const InputField: React.FC<InputFieldProps> = ({
    label,
    textarea,
    size: _,
    ...props
}) => {
    let InputOrTextArea: any = Input;
    if (textarea) { InputOrTextArea = Textarea; }
    // else { InputOrTextArea = Input; }
    const [field, { error }] = useField(props);
    return (
        <FormControl isInvalid={!!error}>
            <FormLabel htmlFor={field.name}>{label}</FormLabel>
            <InputOrTextArea {...field} {...props} id={field.name} />
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
        </FormControl>
    );
}