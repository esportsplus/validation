import { Factory, Property } from '../types';
import Validator from '../validator';


abstract class Type<T> {
    config: Record<string, any> = {};
    type?: T;
    #validator?: Validator;


    // clone(): Type<unknown> {
    //     throw new Error('Implementation missing clone method');
    // }

    compile(_: Validator, __: string, ___?: Property): string {
        throw new Error('Implementation missing compile method');
    }

    fallback(fn: Factory) {
        this.config.fallback = fn;
    }

    optional(): OptionalType<this> {
        this.config.optional = true;

        return new OptionalType(this);
    }

    validate<T>(data: any): ReturnType<Validator['validate']> {
        if (!this.#validator) {
            this.#validator = new Validator(this);
        }

        return this.#validator.validate<T>(data, this.#validator.factories);
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


    // clone(): Type<unknown> {
    //     return new OptionalType( this.type.clone() );
    // }

    compile(instance: Validator, obj: string, property?: Property) {
        return this.type.compile(instance, obj, property);
    }

    fallback(fn: Factory) {
        this.type.fallback(fn);
    }

    required() {
        return this.type;
    }
}


export { OptionalType, Type };