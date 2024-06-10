import response, { Response } from '@esportsplus/action';
import { Catch, ErrorMethod, Finally, Infer, Property } from '~/types';
import { Validator } from '~/validator';


abstract class Type<T> {
    protected config: {
        catch?: Catch<T>;
        errors?: ErrorMethod[],
        finally?: Finally<T>;
        optional?: boolean;
        type: string;
    };
    protected validator?: Validator;


    constructor(type: string) {
        this.config = { type };
    }


    catch(fn: Catch<T>) {
        this.config.catch = fn;

        return this;
    }

    compile(_: Validator, __: string, ___?: Property): string {
        throw new Error('Validation: type implementation missing compile method');
    }

    finally(fn: Finally<T>) {
        this.config.finally = fn;

        return this;
    }

    guard(fn: (<U>(response: Response<T>) => U)) {
        return async (input: T) => {
            let response = await this.validate(input);

            if (response.ok) {
                return fn(response);
            }

            return response;
        };
    }

    optional() {
        this.config.optional = true;

        return new OptionalType(this);
    }

    then(...errors: ErrorMethod[]) {
        if (!this.config.errors) {
            this.config.errors = errors;
        }
        else {
            let config = this.config.errors;

            for (let i = 0, n = errors.length; i < n; i++) {
                config.push(errors[i]);
            }
        }

        return this;
    }

    async validate<I = Infer<this>>(input: I): Promise<Response<I>> {
        if (!this.validator) {
            this.validator = new Validator(this);
        }

        let { data, errors } = await this.validator.validate(input, this.validator.functions);

        return response(data, errors || []);
    }
}

class OptionalType<T extends Type<any>> extends Type<any> {
    protected type: T;


    constructor(type: T) {
        super('optional');
        this.type = type;
    }


    catch(fn: Catch<T extends Type<infer U> ? U : never>) {
        this.type.catch(fn);

        return this;
    }

    compile(instance: Validator, obj: string, property?: Property) {
        return this.type.compile(instance, obj, property);
    }

    finally(fn: Finally<T extends Type<infer U> ? U : never>) {
        this.type.finally(fn);

        return this;
    }

    required() {
        return this.type;
    }

    then(...errors: ErrorMethod[]) {
        this.type.then(...errors);

        return this;
    }
}


export { OptionalType, Response, Type };