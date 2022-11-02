import { ArrayType } from "./array";
import { BooleanType } from "./boolean";
import { NumberType } from "./number";
import { ObjectType } from "./object";
import { StringType } from "./string";


enum Variables {
    errors = 'errors',
    input = '_'
};


type Infer<T extends InferType> =
    T['config']['items'] extends InferType[]
        ? Unwrap<T['config']['items']>[]
        : T['config']['items'] extends Record<string, InferType>
            ? Optional<{
                [K in keyof T['config']['items']]: T['config']['items'][K] extends InferType
                    ? Infer<T['config']['items'][K]>
                    : never
            }>
            : T['config']['optional'] extends boolean ? T['type'] | undefined : T['type'];

type InferType = {
    config: {
        items?: Record<string, InferType> | InferType[];
        optional?: boolean;
    };
    type?: boolean | number | null | string;
};

type KeysOfType<T, SelectedType> = {
    [key in keyof T]: SelectedType extends T[key] ? key : never
}[keyof T];

type Unwrap<T> =
    T extends (infer U)[]
        ? U extends InferType ? Infer<U> : T
        : T;

type Optional<T> = PrettyType<
    Partial<Pick<T, KeysOfType<T, undefined>>> &
    Omit<T, KeysOfType<T, undefined>>
>;

type PrettyType<V> = Extract<{ [K in keyof V]: V[K] }, unknown>;


type ErrorMessage = unknown;

type PrimitiveTypes = ArrayType | BooleanType | NumberType | ObjectType | StringType;

type Property = number | string | { dynamic: string };

type Validator = (data: unknown) => {
    data: unknown;
    errors: string[];
};


export { ErrorMessage, Infer, Property, PrimitiveTypes, Validator, Variables };