import type { Brand } from '@esportsplus/utilities';


type float = Brand<number, 'float'>;

type integer = Brand<number, 'integer'>;


interface ErrorType {
    push(message: string): void;
}

interface Validator {
    build: <T, _TErrors extends ErrorMessages<T> = {}>(
        _config?: ValidatorConfig<T>
    ) => (input: unknown) => Promise<ValidationResult<T>>;
}

interface ValidationError {
    message: string;
    path: string;
}

type ValidatorConfig<T> = {
    [K in keyof T]?:
        | ValidatorFunction<T[K]>
        | ValidatorFunction<T[K]>[]
};

type ValidatorFunction<T> = (value: T, errors: ErrorType) => void | Promise<void>;

type ValidationResult<T> =
    | { data: T; errors: undefined; ok: true }
    | { data: unknown; errors: ValidationError[]; ok: false };

type ErrorMessages<T> = {
    [K in keyof T]?:
        T[K] extends (infer U)[]
            ? string | ErrorMessages<U>[]
            : T[K] extends object
                ? string | ErrorMessages<T[K]>
                : string;
};


export type {
    ErrorMessages,
    ErrorType,
    float,
    integer,
    ValidationError,
    ValidationResult,
    Validator,
    ValidatorConfig,
    ValidatorFunction
};
