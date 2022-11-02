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

type PrimitiveTypes = ArrayType | BooleanType | NumberType | ObjectType | StringType;

type Property = number | string | { dynamic: string };

type Validator = (data: unknown) => {
    data: unknown;
    // Validation errors
    errors: { message: string, path: (string | number)[] }[];
    // Messages displayed on UI
    messages?: {
        errors?: string[];
        info?: string[];
        warning?: string[];
        success?: string[];
    };
};


export { ErrorMessage, Property, PrimitiveTypes, Validator, Variables };