import ts from 'typescript';
import type { ErrorType } from '~/types';


const boolean = (value: boolean, errors: ErrorType): void => {
    if (typeof value !== 'boolean') {
        let str = String(value).toLowerCase();

        if (str === 'true' || str === 'false' || str === '0' || str === '1') {
            value = str === 'true' || str === '1';
        }
        else {
            errors.push('must be true or false');
        }
    }
};

const float = (value: number, errors: ErrorType): void => {
    if (typeof value !== 'number' && isNaN(value = +value)) {
        errors.push('must be a number');
    }
};

const integer = (value: number, errors: ErrorType): void => {
    if ((typeof value !== 'number' && isNaN(value = +value)) || value % 1 !== 0) {
        errors.push('must be an integer');
    }
};

const number = (value: number, errors: ErrorType): void => {
    if (typeof value !== 'number' && isNaN(value = +value)) {
        errors.push('must be a number');
    }
};

const string = (value: string, errors: ErrorType): void => {
    if (typeof value !== 'string') {
        errors.push('must be a string');
    }
};


const PRIMITIVE_VALIDATORS = new Set(['boolean', 'float', 'integer', 'number', 'string']);

const VALIDATORS_SOURCE_FILE = ts.createSourceFile(
    'validators.ts',
    [
        `const boolean = ${boolean.toString()}`,
        `const float = ${float.toString()}`,
        `const integer = ${integer.toString()}`,
        `const number = ${number.toString()}`,
        `const string = ${string.toString()}`
    ].join('\n\n'),
    ts.ScriptTarget.Latest,
    true
);


export {
    PRIMITIVE_VALIDATORS,
    VALIDATORS_SOURCE_FILE
};
