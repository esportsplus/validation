import { Property } from '~/types';
import { Validator } from '~/validator';
import { Type } from './type';
import compile from '~/compile';


class AnyType extends Type<any> {

    constructor() {
        super('any');
    }


    compile(instance: Validator, obj: string, property?: Property) {
        let [code, error, finale, variable] = instance.variables(this.config, obj, property);

        code += `
            if (${variable} === undefined) {
                ${error('is required')}
            }
            ${compile.errors(this.config, error, property, variable)}
        `;

        if (finale) {
            code += `
                else {
                    ${finale}
                }
            `;
        }

        return compile.optional(code, this.config.optional, variable);
    }
}


export default () => {
    return new AnyType();
};
export { AnyType };