import { ErrorMessage, Property } from "~/types";
import { Type } from './type';
import factory from "~/factory";


class StringType extends Type<string> {
    config: {
        max?: number;
        min?: number;
        optional?: boolean;
    };


    constructor(config: StringType['config'] = {}) {
        super();
        this.config = config;
    }


    clone() {
        return new StringType(this.config);
    }

    compile(obj: string, property?: Property) {
        let [code, variable] = factory.variables(obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (typeof ${variable} !== 'string' ${this.config.optional ? '' : `|| ${variable} === ''` }) {
                    ${factory.error(variable, this.config.optional ? `must be a string` : 'must be a non empty string')}
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

    max(number: number, error: ErrorMessage = (_: Property | undefined, max: number) => `must be less than ${max} characters`) {
        this.config.max = number;
        this.errors.max = error;

        return this;
    }

    min(number: number, error: ErrorMessage = (_: Property | undefined, min: number) => `must be at least ${min} characters`) {
        this.config.min = number;
        this.errors.min = error;

        return this;
    }
}


export default () => new StringType();
export { StringType }