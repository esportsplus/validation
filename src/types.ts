import { ArrayType } from "./array";
import { BooleanType } from "./boolean";
import { NumberType } from "./number";
import { ObjectType } from "./object";
import { StringType } from "./string";


enum Variables {
    errors = 'errors',
    input = '_'
};


type ErrorMessage = unknown;

type Property = number | string | { dynamic: string };

type PrimitiveTypes = ArrayType | BooleanType | NumberType | ObjectType | StringType;

type Validator = (data: unknown) => {
    data: unknown;
    errors: string[];
};


export { ErrorMessage, Property, PrimitiveTypes, Validator, Variables };