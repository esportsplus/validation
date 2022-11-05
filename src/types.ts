import { ArrayType } from "./builders/array";
import { ObjectType } from "./builders/object";
import { OptionalType, Type } from './builders/type';


enum Variables {
        errors = 'e',
        input = '_'
    };


type ArrayShape = Type<unknown>[];

type ErrorMessage = unknown;

type Eval<T> =
    T extends any[] | unknown
        ? T
        : Flat<T>;

type Flat<T> =
    T extends {}
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

type Nested<T, U> =
    Flat<
        Eval<
            { [K in OptionalKeys<T, U>]?: Infer<T[K]> }
            &
            { [K in RequiredKeys<T, U>]: Infer<T[K]> }
        >
    >;

type ObjectShape = Record<string, Type<unknown>>;

type OptionalKeys<T, U> =
    {
        [K in keyof T & U]: T[K] extends OptionalType<infer _>
            ? K
            : never;
    }[keyof T & U];

type Property = number | string | { dynamic: string };

type RequiredKeys<T, U> = Exclude<U & keyof T, OptionalKeys<T, U>>;

type Validator = <T>(data: unknown) => {
    data: T;
    // Validation errors
    errors?: { message: string, path: (string | number) }[];
    // Messages displayed through UI
    messages: Record<string, any>;
};

type ValuesOf<T> = T[keyof T][];


export { ArrayShape, Infer, ErrorMessage, ObjectShape, Property, Validator, Variables };