import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput"

export const validateRegister = (options: UsernamePasswordInput) => {
    if (!options.email.includes("@")) {
        return [
            {
                field: "email",
                message: "invalid email" 
            }
        ]
    }

    if (options.username.includes("@")) {
        return [
            {
                field: "username",
                message: "username cannot include @" 
            }
        ]
    }

    if (options.username.length <= 2) {
        return [
            {
                field: "username",
                message: "username length must be greater than 2" 
            }
        ]
    }

    if (options.password.length <= 3) {
        return [
            {
                field: "password",
                message: "password length must be greater than 3" 
            }
        ]
    }

    return null;
};