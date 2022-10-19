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


    validate(data: { [key: string]: any }): ErrorObject[] {
        if (!this.validator) {
            this.validator = new ajv(this.options).compile(this.schema);
        }

        this.validator(data);

        return this.validator.errors || [];
    }
}


export default {
    validator: (JSONSchema: Schema, options: Options = DEFAULT_OPTIONS): Validator => new Validator(JSONSchema, options)
};
