import { Response } from '@esportsplus/action';
import { Prettify } from '@esportsplus/typescript';
import { ArrayType } from './builders/array';
import { ObjectType } from './builders/object';
import { OptionalType, Type } from './builders/type';


type Catch<T> = () => (InternalInfer<T> | Promise<InternalInfer<T>>);

type ErrorMessage = ((property: Property | undefined, type: string) => string) | string;

type ErrorMethod = [
    (type: string, variable: string) => string,
    ErrorMessage
];

type Finally<T> = (data: InternalInfer<T>, error: ((message: string) => InternalInfer<T>)) => InternalInfer<T>;

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

type InternalInfer<T> =
    T extends Type<infer _>
        ? Infer<T>
        : T extends unknown[]
            ? ValuesOf<Nested<T, number>>
            : T extends Record<PropertyKey, unknown>
                ? Nested<T, string>
                : T;

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

type Validator<T> = {
    validate(data: T): Promise<Response<T>>;
};

type ValuesOf<T> = T[keyof T][];


export { Catch, ErrorMessage, ErrorMethod, Finally, Infer, Property, Type, Validator };