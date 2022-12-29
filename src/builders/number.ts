import { ErrorMessage, Property } from "./types";
import { Type } from './type';
import Validator from "~/validator";


class NumberType extends Type<number> {
    config: {
        errors: Record<string, ErrorMessage>;
        max?: number;
        min?: number;
        optional?: boolean;
        type: string
    };


    constructor(config: NumberType['config']) {
        super();
        this.config = config;
    }


    compile(instance: Validator, obj: string, property?: Property) {
        let [code, index, variable] = instance.variables(this, obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (( typeof ${variable} !== 'number' && isNaN(${variable} = +${variable}) ) ${this.config.type === 'integer' ? `|| ${variable} % 1 !== 0` : ''}) {
                    ${instance.error(index, variable, `must be a ${this.config.type === 'integer' ? `integer` : 'number'}`)}
                }
            `;

            if (this.config.max !== undefined) {
                code += `
                    else if(${variable} > ${this.config.max}) {
                        ${instance.error(index, variable, this.config.errors.max, property, this.config.max)}
                    }
                `;
            }

            if (this.config.min !== undefined) {
                code += `
                    else if(${variable} < ${this.config.min}) {
                        ${instance.error(index, variable, this.config.errors.min, property, this.config.min)}
                    }
                `;
            }

        if (this.config.optional) {
            code += `}`;
        }

        return code;
    }

    max(number: number, error: ErrorMessage = (_, max) => `must be less than ${max}`): this {
        this.config.errors.max = error;
        this.config.max = number;

        return this;
    }

    min(number: number, error: ErrorMessage = (_, min) => `must be greater than ${min}`): this {
        this.config.errors.min = error;
        this.config.min = number;

        return this;
    }
}


const float = () => new NumberType({ errors: {}, type: 'float' });
const integer = () => new NumberType({ errors: {}, type: 'integer' });
const number = () => new NumberType({ errors: {}, type: 'number' });


export { float, integer, number, NumberType };