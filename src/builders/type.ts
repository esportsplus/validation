import response, { Response } from '@esportsplus/action';
import { Factory, Infer, Property } from './types';
import Validator from '../validator';


abstract class Type<T> {
    private validator?: Validator;

    config: Record<string, any> = {};
    type?: T;


    compile(_: Validator, __: string, ___?: Property): string {
        throw new Error('Implementation missing compile method');
    }

    fallback(fn: Factory) {
        this.config.fallback = fn;

        return this;
    }

    optional(): OptionalType<this> {
        this.config.optional = true;

        return new OptionalType(this);
    }

    async validate<I = Infer<this>>(input: I): Promise<Response<I>> {
        if (!this.validator) {
            this.validator = new Validator(this);
        }

        let { data, errors } = await this.validator.validate(input, this.validator.factories);

        return response(data, errors || []);
    }
}

class OptionalType<T extends Type<unknown>> extends Type<T> {
    type: T;


    constructor(type: T) {
        super();
        this.type = type;
    }


    compile(instance: Validator, obj: string, property?: Property) {
        return this.type.compile(instance, obj, property);
    }

    fallback(fn: Factory) {
        this.type.fallback(fn);

        return this;
    }

    required() {
        return this.type;
    }
}


export { OptionalType, Response, Type };