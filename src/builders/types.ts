import { ArrayType } from './array';
import { ObjectType } from './object';
import { OptionalType, Type } from './type';


enum Variables {
        errors = 'e',
        factory = 'f',
        input = '_'
    };


type ArrayShape = Type<unknown>[];

type ErrorMessage = ((property: Property | undefined, value: unknown) => string) | string;

type Eval<T> =
    T extends any[] | unknown
        ? T
        : Flat<T>;

type Factory = () => (any | Promise<any>);

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

type ValuesOf<T> = T[keyof T][];


export { ArrayShape, Infer, ErrorMessage, Factory, ObjectShape, Property, Type, Variables };