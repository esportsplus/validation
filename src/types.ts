import { Prettify } from '@esportsplus/typescript';
import { ArrayType } from './builders/array';
import { ObjectType } from './builders/object';
import { OptionalType, Type } from './builders/type';
import Validator from './validator';


type Catch<T> = () => (T | Promise<T>);

type ErrorMessage = ((property: Property | undefined, type: string) => string) | string;

type ErrorMethod = [
    (type: string, variable: string) => string,
    ErrorMessage
];

type Finally<T> = (error: ((message: string) => void), value: T) => T;

type Infer<T> =
    T extends ArrayType<infer U>
        ? ValuesOf<Nested<U, number>>
        : T extends ObjectType<infer U>
            ? Nested<U, string>
            : T extends OptionalType<infer U>
                ? Infer<U>
                : T extends Type<infer U>
                    ? U
                    : never;

type Nested<T, U> =
    Prettify<
        { [K in OptionalKeys<T, U>]?: Infer<T[K]> }
        &
        { [K in RequiredKeys<T, U>]: Infer<T[K]> }
    >;

type OptionalKeys<T, U> =
    {
        [K in keyof T & U]: T[K] extends OptionalType<infer _>
            ? K
            : never;
    }[keyof T & U];

type Property = number | string | { dynamic: string };

type RequiredKeys<T, U> = Exclude<U & keyof T, OptionalKeys<T, U>>;

type ValuesOf<T> = T[keyof T][];


export { Catch, ErrorMessage, ErrorMethod, Finally, Infer, Property, Type, Validator };