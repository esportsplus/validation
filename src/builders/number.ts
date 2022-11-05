import { ErrorMessage, Property } from "~/types";
import { Type } from './type';
import factory from "~/factory";


class NumberType extends Type<number> {
    config: {
        max?: number;
        min?: number;
        optional?: boolean;
        type: string
    };


    constructor(config: NumberType['config']) {
        super();
        this.config = config;
    }


    clone() {
        return new NumberType(this.config);
    }

    compile(obj: string, property?: Property) {
        let [code, variable] = factory.variables(obj, property);

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
}


const float = () => new NumberType({ type: 'float' });
const integer = () => new NumberType({ type: 'integer' });
const number = () => new NumberType({ type: 'number' });


export { float, integer, number, NumberType };