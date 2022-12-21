import { ErrorMessage, Factory, Property, Variables } from "./builders/types";
import { Type } from './builders/type';


let AsyncFunction = Object.getPrototypeOf(async function(){ }).constructor;


class Validator {
    factories: Factory[] = [];
    validate;


    constructor(type: Type<unknown>) {
        this.validate = new AsyncFunction(Variables['input'], Variables['factory'], `
            let ${Variables['errors']} = [];

            ${type.compile(this, Variables['input'])}

            return {
                data: ${Variables['input']},
                errors: ${Variables['errors']}.length ? ${Variables['errors']} : undefined
            };
        `);
    }


    error(factory: number | undefined, key: string, message: ErrorMessage, property?: Property, value?: any) {
        if (factory !== undefined) {
            return `${key} = await ${Variables['factory']}[${factory}]();`;
        }

        if (typeof message === 'function') {
            message = message(property, value);
        }

        if (key.substring(0, Variables['input'].length) === Variables['input']) {
            key = key
                .substring(Variables['input'].length)
                .replace(/]\[/g, " + '.' + ")
                .replace(/[\]\[]/g, '')
                .replace(/'\s\+\s'/g, '');
        }

        return `
            ${Variables['errors']}.push({
                message: '${message}',
                path: ${key || '"root"'}
            });
        `;
    }

    variables(instance: Type<unknown>, obj: string, property?: Property): [string , number | undefined , string ] {
        let code = '',
            index,
            variable = obj;

        if (instance.config.fallback) {
            index = this.factories.push(instance.config.fallback) - 1;
        }

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

        return [code, index, variable];
    }
}


export default Validator;