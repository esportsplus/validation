import { VARIABLE_ERROR } from '~/constants';
import { Property, Type } from '~/types';
import { Validator } from '~/validator';
import compile from '~/compile';


class ObjectType<T extends Record<string, Type<any>>> extends Type<T> {
    protected items: T;


    constructor(items: T) {
        super('object');
        this.items = items;
    }


    compile(instance: Validator, obj: string, property?: Property) {
        let [code, error, finale, variable] = instance.variables(this.config, obj, property);

        code += `
            if (Object.prototype.toString.call(${variable}) !== '[object Object]') {
                ${error('must be an object')}
            }
            ${compile.errors(this.config, error, property, variable)}
        `;

        code += 'else {';
            for (let key in this.items) {
                code += this.items[key].compile(instance, variable, key);
            }

            code += `
                if (${VARIABLE_ERROR}.length === 0) {
                    let whitelist = ['${Object.keys(this.items).join("','")}'];

                    for (let key in ${variable}) {
                        if (whitelist.includes(key)) {
                            continue;
                        }

                        delete ${variable}[key];
                    }

                    ${finale}
                }
            }
        `;

        return compile.optional(code, this.config.optional, variable);
    }
}


export default <T extends Record<string, Type<any>>>(items: T) => {
    return new ObjectType(items);
};
export { ObjectType };