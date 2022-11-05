import { ArrayShape, ErrorMessage, Property, Variables } from '~/types';
import { Type } from './type';
import Validator from '~/validator';


class ArrayType<T extends ArrayShape> extends Type<never> {
    config: {
        errors: Record<string, ErrorMessage>;
        items: T;
        max?: number;
        min?: number;
        optional?: boolean;
    };


    constructor(config: ArrayType<T>['config']) {
        super();
        this.config = config;
    }


    // clone() {
    //     let config: Record<string, any> = { items: [] };

    //     for (let i = 0, n = this.config.items.length; i < n; i++) {
    //         config.items.push(this.config.items[i].clone());
    //     }

    //     for (let key in this.config) {
    //         if (key === 'items') {
    //             continue;
    //         }

    //         config[key] = this.config[key as keyof ArrayType<T>['config']];
    //     }

    //     return new ArrayType(config as ArrayType<T>['config']);
    // }

    compile(instance: Validator, obj: string, property?: Property) {
        let [code, index, variable] = instance.variables(this, obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (!Array.isArray(${variable})) {
                    ${instance.error(index, variable, `must be an array`)}
                }
            `;

            if (this.config.max !== undefined) {
                code += `
                    else if(${variable}.length > ${this.config.max}) {
                        ${instance.error(index, variable, this.config.errors.max, property, this.config.max)}
                    }
                `;
            }

            if (this.config.min !== undefined) {
                code += `
                    else if(${variable}.length < ${this.config.min}) {
                        ${instance.error(index, variable, this.config.errors.min, property, this.config.min)}
                    }
                `;
            }

            let n = this.config.items.length;

            code += 'else {';
                if (n === 1) {
                    code += `
                        let length = ${Variables['errors']}.length;

                        for (let i = 0, n = ${variable}.length; i < n; i++) {
                            ${this.config.items[0].compile(instance, `${variable}`, { dynamic: 'i' })}

                            if (${Variables['errors']}.length > length) {
                                break;
                            }
                        }
                    `;
                }
                else if (n > 1) {
                    for (let i = 0; i < n; i++) {
                        code += this.config.items[i].compile(instance, `${variable}`, i);
                    }
                }
            code += '}';

        if (this.config.optional) {
            code += `}`;
        }

        return code;
    }

    max(number: number, error: ErrorMessage = (_, max) => `must be less than ${max} items`): this {
        this.config.errors.max = error;
        this.config.max = number;

        return this;
    }

    min(number: number, error: ErrorMessage = (_, min) => `must be greater than ${min} items`): this {
        this.config.errors.min = error;
        this.config.min = number;

        return this;
    }
}


export default <T extends ArrayShape>(...items: T) => new ArrayType({ errors: {}, items });
export { ArrayType };