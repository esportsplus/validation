import ajv, { Options, Schema, ValidateFunction } from 'ajv';
import { Response } from './types';


const DEFAULT_OPTIONS = {
    removeAdditional: true
};


class Validator {
    options: Options;
    schema: Schema;
    validator?: ValidateFunction;


    constructor(JSONSchema: Schema, options: Options) {
        this.options = options;
        this.schema = JSONSchema;
    }


    validate(data: { [key: string]: any }): Response {
        if (!this.validator) {
            this.validator = new ajv(this.options).compile(this.schema);
        }

        this.validator(data);

        let errors = this.validator.errors || [];

        return {
            data,
            messages: {
                errors,
                info: [],
                success: [],
                warning: []
            },
            success: errors.length === 0
        };
    }
}


export default {
    validator: (JSONSchema: Schema, options: Options = DEFAULT_OPTIONS): Validator => new Validator(JSONSchema, options)
};
