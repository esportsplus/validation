import { ErrorMessage, Property, Validator, Variables } from "./types";
import { Type } from './builders/type';


const error = (key: string, message: ErrorMessage, property?: Property, value?: any) => {
    if (typeof message === 'function') {
        message = message(property, value);
    }

    if (key.substring(0, Variables['input'].length) === Variables['input']) {
        key = key
            .substring(Variables['input'].length)
            .replace(/]\[/g, " + '/' + ")
            .replace(/[\]\[]/g, '')
            .replace(/'\s\+\s'/g, '');
    }

    return `
        ${Variables['errors']}.push({
            message: '${message}',
            path: ${key || '"root"'}
        });
    `;
};

const validator = (type: Type<any>) => {
    return new Function(Variables['input'], `
        let ${Variables['errors']} = [];

        ${type.compile(Variables['input'])}

        return {
            data: ${Variables['input']},
            errors: ${Variables['errors']}.length ? ${Variables['errors']} : undefined,
            messages: {}
        };
    `) as Validator;
};

const variables = (obj: string, property?: Property) => {
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


export default { error, validator, variables };