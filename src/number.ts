import { ErrorMessage, Property, Validator } from "./types";
import factory from "./factory";


class NumberType {
    config: {
        max?: number;
        min?: number;
        optional?: boolean;
        type: string
    };
    errors: Record<string, ErrorMessage> = {};
    #validator?: Validator;


    constructor(type: string) {
        this.config = { type };
    }


    compile(obj: string, property?: Property) {
        let [code, variable] = factory.init(obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (typeof ${variable} !== 'number' ${this.config.type === 'integer' ? `|| ${variable} % 1 !== 0` : ''}) {
                    ${factory.error(variable, `must be a ${this.config.type === 'integer' ? `integer` : 'number'}`)}
                }
            `;

            if (this.config.max !== undefined) {
                code += `
                    else if(${variable} > ${this.config.max}) {
                        ${factory.error(variable, this.errors.max, property, this.config.max)}
                    }
                `;
            }

            if (this.config.min !== undefined) {
                code += `
                    else if(${variable} < ${this.config.min}) {
                        ${factory.error(variable, this.errors.min, property, this.config.min)}
                    }
                `;
            }

        if (this.config.optional) {
            code += `}`;
        }

        return code;
    }

    max(number: number, error: ErrorMessage = (_: Property | undefined, max: number) => `must be less than ${max}`): this {
        this.config.max = number;
        this.errors.max = error;

        return this;
    }

    min(number: number, error: ErrorMessage = (_: Property | undefined, min: number) => `must be greater than ${min}`): this {
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


const float = () => new NumberType('float');
const integer = () => new NumberType('integer');
const number = () => new NumberType('number');


export { float, integer, number, NumberType };