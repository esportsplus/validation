import { VARIABLE_ERROR } from '~/constants';
import { Property, Type, Validator } from '~/types';
import compile from '~/compile';


class ArrayType<T extends Type<any>[]> extends Type<T> {
    protected items: T;


    constructor(items: T) {
        super('array');
        this.items = items;
    }


    compile(instance: Validator, obj: string, property?: Property) {
        let [code, error, finale, variable] = instance.variables(this.config, obj, property);

        code += `
            if (!Array.isArray(${variable})) {
                ${error('must be an array', variable)}
            }
            ${compile.errors(this.config, error, property, variable)}
        `;

        code += 'else {';
            let n = this.items.length;

            if (n === 1) {
                code += `
                    let length = ${VARIABLE_ERROR}.length;

                    for (let i = 0, n = ${variable}.length; i < n; i++) {
                        ${this.items[0].compile(instance, variable, { dynamic: 'i' })}

                        if (${VARIABLE_ERROR}.length > length) {
                            break;
                        }
                    }
                `;
            }
            else if (n > 1) {
                for (let i = 0; i < n; i++) {
                    code += this.items[i].compile(instance, variable, i);
                }
            }

            code += `
                if (${VARIABLE_ERROR}.length === 0) {
                    ${finale}
                }
            `;
        code += '}';

        return compile.optional(code, this.config.optional, variable);
    }
}


export default <T extends Type<any>[]>(...items: T) => {
    return new ArrayType(items);
};
export { ArrayType };