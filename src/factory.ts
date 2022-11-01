import { ErrorMessage, Property, PrimitiveTypes, Validator, Variables } from "./types";


const error = (key: string, message: ErrorMessage, property?: Property, value?: any) => {
    if (typeof message === 'function') {
        message = message(property, value);
    }

    if (key.substring(0, Variables['input'].length) === Variables['input']) {
        key = key
            .substring(Variables['input'].length)
            .replace(/]\[/g, ',');
    }

    return `${Variables['errors']}.push({ message: '${message}', path: ${key || '[]'} });`;
};

const init = (obj: string, property?: Property) => {
    let code = '',
        variable = obj;

    if (property !== undefined) {
        if (typeof property === 'number') {
            variable += `[${property}]`;
        }
        else if(typeof property === 'string') {
            variable += `['${property}']`;
        }
        else {
            variable += `[${property.dynamic}]`;
        }
    }

    return [code, variable];
};

const validator = (type: PrimitiveTypes): Validator => {
    type.config = Object.freeze(type.config);

    return new Function(Variables['input'], `
        let errors = [];

        ${type.compile(Variables['input'])}

        return { data: ${Variables['input']}, errors };
    `) as Validator;
};


export default { error, init, validator };