import { ErrorMessage, Property, PrimitiveTypes, Variables, Validator } from './types';
import factory from './factory';


class ArrayType {
    config: {
        items: PrimitiveTypes[];
        max?: number;
        min?: number;
        optional?: boolean;
    };
    errors: Record<string, ErrorMessage> = {};
    #validator?: Validator;


    constructor(items: ArrayType['config']['items']) {
        this.config = { items };
    }


    compile(obj: string, property?: Property) {
        let [code, variable] = factory.init(obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (!Array.isArray(${variable})) {
                    ${factory.error(variable, `must be an array`)}
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

            if (this.config.items) {
                code += 'else {';

                if (this.config.items.length > 1) {
                    for (let i = 0, n = this.config.items.length; i < n; i++) {
                        code += this.config.items[i].compile(variable, i);
                    }
                }
                else {
                    code += `
                        let length = ${Variables['errors']}.length;

                        for (let i = 0, n = ${variable}.length; i < n; i++) {
                            ${this.config.items[0].compile(variable, { dynamic: 'i' })}

                            if (${Variables['errors']}.length > length) {
                                break;
                            }
                        }
                    `;
                }

                code += '}';
            }

        if (this.config.optional) {
            code += `}`;
        }

        return code;
    }

    max(number: number, error: ErrorMessage = (_: Property | undefined, max: number) => `must be less than ${max} items`): this {
        this.config.max = number;
        this.errors.max = error;

        return this;
    }

    min(number: number, error: ErrorMessage = (_: Property | undefined, min: number) => `must be greater than ${min} items`): this {
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


export default (...items: ArrayType['config']['items']) => new ArrayType(items);
export { ArrayType };