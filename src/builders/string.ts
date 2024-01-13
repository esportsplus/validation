import { ErrorMessage, Property } from './types';
import { Type } from './type';
import Validator from '~/validator';


class StringType extends Type<string> {
    config: {
        errors: Record<string, ErrorMessage>;
        max?: number;
        min?: number;
        optional?: boolean;
    };


    constructor(config: StringType['config'] = { errors: {} }) {
        super();
        this.config = config;
    }


    compile(instance: Validator, obj: string, property?: Property) {
        let [code, index, variable] = instance.variables(this, obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (typeof ${variable} !== 'string' ${this.config.optional ? '' : `|| ${variable} === ''` }) {
                    ${instance.error(index, variable, this.config.optional ? `must be a string` : 'must be a non empty string')}
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

        if (this.config.optional) {
            code += `}`;
        }

        return code;
    }

    max(number: number, error: ErrorMessage = (_, max) => `must be less than ${max} characters`) {
        this.config.errors.max = error;
        this.config.max = number;

        return this;
    }

    min(number: number, error: ErrorMessage = (_, min) => `must be at least ${min} characters`) {
        this.config.errors.min = error;
        this.config.min = number;

        return this;
    }
}


export default () => new StringType();
export { StringType }