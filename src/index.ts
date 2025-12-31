import type { ErrorMessages, ValidatorConfig, ValidationResult } from './types';


// Compile-time only - throws if plugin not configured
const validator = {
    build: <T, _TErrors extends ErrorMessages<T> = {}>(_config?: ValidatorConfig<T>): ((input: unknown) => Promise<ValidationResult<T>>) => {
        throw new Error(
            '@esportsplus/validation: validator.build<T>() must be transformed at compile-time. ' +
            'Ensure validationPlugin() is added to your Vite config.'
        );
    }
};


export { plugin } from './plugin';
export { validator };
export * from './types';
export * from './validators';
