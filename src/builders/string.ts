import { Property, Type } from '~/types';
import { Validator } from '~/validator';
import compile from '~/compile';


class StringType extends Type<string> {

    constructor() {
        super('string');
    }


    compile(instance: Validator, obj: string, property?: Property) {
        let [code, error, finale, variable] = instance.variables(this.config, obj, property);

        code += `
            if (typeof ${variable} !== 'string' ${this.config.optional ? '' : `|| ${variable} === ''` }) {
                ${error(this.config.optional ? 'must be a string' : 'must be a non empty string')}
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
    return new StringType();
};
export { StringType }