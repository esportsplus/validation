import { Factory, Infer, Property } from '../types';
import Validator from '../validator';


abstract class Type<T> {
    private validator?: Validator;

    config: Record<string, any> = {};
    type?: T;


    // clone(): Type<unknown> {
    //     throw new Error('Implementation missing clone method');
    // }

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

    validate<I = Infer<this>>(data: I): Promise<{
        data: typeof data;
        errors?: { message: string, path: (string | number) }[];
    }> {
        if (!this.validator) {
            this.validator = new Validator(this);
        }

        return this.validator.validate(data, this.validator.factories);
    }
}

class OptionalType<T extends Type<unknown>> extends Type<T> {
    type: T;


    constructor(type: T) {
        super();
        this.type = type;
    }


    // clone(): Type<unknown> {
    //     return new OptionalType( this.type.clone() );
    // }

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


export { OptionalType, Type };