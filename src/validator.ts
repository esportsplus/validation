import { VARIABLE_ERROR, VARIABLE_FUNCTIONS, VARIABLE_INPUT } from './constants';
import { Catch, ErrorMessage, Finally, Property, Type } from './types';


let AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;


function error(message: string, path: string) {
    return `
        ${VARIABLE_ERROR}.push({
            message: \`${message}\`,
            path: ${path || `'root'`}
        });
    `;
}


class Validator {
    functions: (Catch<any> | Finally<any>)[] = [];
    validate;


    constructor(type: Type<any>) {
        this.validate = new AsyncFunction(VARIABLE_INPUT, VARIABLE_FUNCTIONS, `
            let ${VARIABLE_ERROR} = [];

            ${type.compile(this, VARIABLE_INPUT)}

            return {
                data: ${VARIABLE_INPUT},
                errors: ${VARIABLE_ERROR}.length ? ${VARIABLE_ERROR} : undefined
            };
        `);
    }


    error(index: number | undefined, message: ErrorMessage, path: string, type: string, property?: Property) {
        if (index !== undefined) {
            return `${path} = await ${VARIABLE_FUNCTIONS}[${index}]();`;
        }

        if (typeof message === 'function') {
            message = message(property, type);
        }

        if (path.startsWith(VARIABLE_INPUT)) {
            path = path
                .substring(VARIABLE_INPUT.length)
                .replace(/]\[/g, " + '.' + ")
                .replace(/[\]\[]|'\s\+\s'/g, '');
        }

        return error(message, path);
    }

    variables(config: Type<any>['config'], path: string, property?: Property) {
        if (property !== undefined) {
            if (typeof property === 'number') {
                path += `[${property}]`;
            }
            else if(typeof property === 'string') {
                path += `['${property}']`;
            }
            else {
                path += `[${property.dynamic}]`;
            }
        }

        let finale = '',
            index: number | undefined;

        if (config.catch) {
            index = this.functions.push(config.catch) - 1;
        }

        if (config.finally) {
            finale = `
                ${path} = await ${VARIABLE_FUNCTIONS}[${this.functions.push(config.finally) - 1}](
                    ${path},
                    (message) => {
                        ${error('message', path)}
                        return ${path};
                    }
                );
            `;
        }

        return [
            '',
            (message: ErrorMessage, property?: Property) => {
                return this.error(index, message, path, config.type, property);
            },
            finale,
            path
        ] as [ string, ((message: ErrorMessage, property?: Property, value?: any) => string), string, string ];
    }
}


export default Validator;