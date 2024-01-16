import { ErrorMessage, Property, Type } from './types';


const errors = <T>(
    config: Type<T>['config'],
    error: (message: ErrorMessage, property?: Property, value?: any) => string,
    property: Property | undefined,
    variable: string
) => {
    let code = '';

    if (!config.errors) {
        return code;
    }

    for (let i = 0, n = config.errors.length; i < n; i++) {
        let statement = config.errors[i];

        code += `
            else if(${statement[0](config.type, variable)}) {
                ${error(statement[1], property)}
            }
        `;
    }

    return code;
};

const optional = (code: string, optional: boolean | undefined, variable: string) => {
    if (!optional) {
        return code;
    }

    return `
        if (${variable} !== undefined) {
            ${code}
        }
    `;
};


export default { errors, optional };