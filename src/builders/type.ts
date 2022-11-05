import { ErrorMessage, Property, Validator } from '../types';
import factory from '../factory';


abstract class Type<T> {
    config: Record<string, any> = {};
    errors: Record<string, ErrorMessage> = {};
    type?: T;
    #validator?: Validator;


    clone(): Type<unknown> {
        throw new Error('Implementation missing clone method');
    }

    compile(_: string, __?: Property): string {
        throw new Error('Implementation missing compile method');
    }

    optional(): OptionalType<this> {
        this.config.optional = true;

        return new OptionalType(this);
    }

    validate<T>(data: any) {
        if (!this.#validator) {
            this.#validator = factory.validator(this);
        }

        return this.#validator<T>(data);
    }

    validator<T>() {
        return (data: any) => this.validate<T>(data);
    }
}

class OptionalType<T extends Type<unknown>> extends Type<T> {
    type: T;


    constructor(type: T) {
        super();
        this.type = type;
    }


    clone(): Type<unknown> {
        return new OptionalType( this.type.clone() );
    }

    compile(obj: string, property?: Property) {
        return this.type.compile(obj, property);
    }

    required() {
        return this.type;
    }
}


export { OptionalType, Type };