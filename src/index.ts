import ajv, { ErrorObject, Options, Schema, ValidateFunction } from 'ajv';


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


    validate(data: { [key: string]: any }): {
        errors: ErrorObject[],
        info: string[],
        success: string[],
        warning: string[]
    } {
        if (!this.validator) {
            this.validator = new ajv(this.options).compile(this.schema);
        }

        this.validator(data);

        return {
            errors: this.validator.errors || [],
            info: [],
            success: [],
            warning: []
        };
    }
}


export default {
    validator: (JSONSchema: Schema, options: Options = DEFAULT_OPTIONS): Validator => new Validator(JSONSchema, options)
};
