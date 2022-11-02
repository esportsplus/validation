import { ErrorMessage, Property, Validator } from "./types";
import factory from "./factory";


class StringType {
    config: {
        max?: number;
        min?: number;
        optional?: boolean;
    } = {};
    errors: Record<string, ErrorMessage> = {};
    type: string = '';
    #validator?: Validator;


    compile(obj: string, property?: Property) {
        let [code, variable] = factory.init(obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined && ${variable} !== '') {`;
        }

            code += `
                if (typeof ${variable} !== 'string' || ${variable} === '') {
                    ${factory.error(variable, `must be a non empty string`)}
                }
            `;

            if (this.config.max !== undefined) {
                code += `
                    else if(${variable}.length > ${this.config.max}) {
                        ${factory.error(variable, this.errors.max, property, this.config.max)}
                    }
                `;
            }

            if (this.config.min !== undefined) {
                code += `
                    else if(${variable}.length < ${this.config.min}) {
                        ${factory.error(variable, this.errors.min, property, this.config.min)}
                    }
                `;
            }

        if (this.config.optional) {
            code += `}`;
        }

        return code;
    }

    max(number: number, error: ErrorMessage = (_: Property | undefined, max: number) => `must be less than ${max} characters`): this {
        this.config.max = number;
        this.errors.max = error;

        return this;
    }

    min(number: number, error: ErrorMessage = (_: Property | undefined, min: number) => `must be at least ${min} characters`): this {
        this.config.min = number;
        this.errors.min = error;

        return this;
    }

    optional(): this {
        this.config.optional = true;

        return this;
    }

    validate(data: any) {
        return this.validator(data);
    }

    get validator() {
        if (!this.#validator) {
            this.#validator = factory.validator(this);
        }

        return this.#validator;
    }
}


export default () => new StringType();
export { StringType }