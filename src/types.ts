import { ArrayType } from "./builders/array";
import { BooleanType } from "./builders/boolean";
import { NumberType } from "./builders/number";
import { ObjectType } from "./builders/object";
import { StringType } from "./builders/string";
import compile from "./factory";


abstract class Type<T> {
    config: {
        optional?: boolean;
    } = {};
    errors: Record<string, ErrorMessage> = {};
    // Required for Infer ( throws unused type error otherwise )
    type?: T;
    #validator?: Validator;


    compile(_: string, __?: Property) {
        return '';
    }

    optional(): OptionalType<this> {
        this.config.optional = true;

        return new OptionalType(this);
    }

    validate(data: any) {
        return this.validator(data);
    }

    get validator() {
        if (!this.#validator) {
            this.#validator = compile.validator(this);
        }

        return this.#validator;
    }
}

class OptionalType<T extends Types> extends Type<T> {
    #type: T;


    constructor(type: T) {
        super();
        this.#type = type;
    }


    compile(obj: string, property?: Property): string {
        return this.#type.compile(obj, property);
    }

    required() {
        return this.#type;
    }
}

enum Variables {
    errors = 'e',
    input = '_'
};


type ArrayShape = Types[];

type ErrorMessage = unknown;

type Eval<T> = T extends any[] | unknown
    ? T
    : Flat<T>;

type Flat<T> = T extends {}
    ? { [K in keyof T]: T[K] }
    : T;

type Infer<T> =
    T extends ArrayType<ArrayShape>
        ? ValuesOf<Nested<T['config']['items'], number>>
        : T extends ObjectType<ObjectShape>
            ? Nested<T['config']['items'], string>
            : T extends OptionalType<infer O>
                ? Infer<O>
                : T extends Type<infer P>
                    ? P
                    : never;

type Nested<T, U> = Flat<
    Eval<
        { [K in OptionalKeys<T, U>]?: Infer<T[K]> }
        &
        { [K in RequiredKeys<T, U>]: Infer<T[K]> }
    >
>;

type ObjectShape = Record<string, Types>;

type OptionalKeys<T, U> = {
    [K in keyof T & U]: T[K] extends OptionalType<infer _>
        ? K
        : never;
}[keyof T & U];

type Property = number | string | { dynamic: string };

type RequiredKeys<T, U> = Exclude<U & keyof T, OptionalKeys<T, U>>;

type Types = ArrayType<ArrayShape> | BooleanType | NumberType | ObjectType<ObjectShape> | OptionalType<Types> | StringType | Type<any>;

type Validator = <T>(data: unknown) => {
    data?: T;
    // Validation errors
    errors: { message: string, path: (string | number)[] }[];
    // Messages displayed through UI
    messages: {};
};

type ValuesOf<T> = T[keyof T][];


export { ArrayShape, Infer, ErrorMessage, ObjectShape, Property, Type, Validator, Variables };