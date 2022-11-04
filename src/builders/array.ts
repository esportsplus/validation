import { ArrayShape, ErrorMessage, Property, Variables, Type } from '~/types';
import factory from '~/factory';


class ArrayType<T extends ArrayShape> extends Type<never> {
    config: {
        items: T;
        max?: number;
        min?: number;
        optional?: boolean;
    };


    constructor(items: T) {
        super();
        this.config = { items };
    }


    compile(obj: string, property?: Property) {
        let [code, variable] = factory.variables(obj, property);

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

            let n = this.config.items.length;

            code += 'else {';
                if (n === 1) {
                    code += `
                        let length = ${Variables['errors']}.length;

                        for (let i = 0, n = ${variable}.length; i < n; i++) {
                            ${this.config.items[0].compile(`${variable}`, { dynamic: 'i' })}

                            if (${Variables['errors']}.length > length) {
                                break;
                            }
                        }
                    `;
                }
                else if (n > 1) {
                    for (let i = 0; i < n; i++) {
                        code += this.config.items[i].compile(`${variable}`, i);
                    }
                }
            code += '}';

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
}


export default <T extends ArrayShape>(...items: T) => new ArrayType(items);
export { ArrayType };