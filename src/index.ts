import ajv, { ErrorObject, Options, Schema, ValidateFunction } from 'ajv';


const DEFAULT_OPTIONS = { 
        removeAdditional: true 
    };


class Validator {
    validator: ValidateFunction;


    constructor(JSONSchema: Schema, options: Options) {
        this.validator = new ajv(options).compile(JSONSchema);
    }


    validate(data: { [key: string]: any }): ErrorObject[] {
        this.validator(data);

        return this.validator.errors || [];
    }
}


export default {
    validator: (JSONSchema: Schema, options: Options = DEFAULT_OPTIONS): Validator => new Validator(JSONSchema, options)
};
