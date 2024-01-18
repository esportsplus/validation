import { Property, Type } from '~/types';
import { Validator } from '~/validator';
import compile from '~/compile';


class BooleanType extends Type<boolean> {

    constructor() {
        super('boolean');
    }


    compile(instance: Validator, obj: string, property?: Property) {
        let [code, error, finale, variable] = instance.variables(this.config, obj, property);

        code += `
            if (typeof ${variable} !== 'boolean') {
                ${variable} = String(${variable}).toLowerCase();

                if (${variable} === 'true' || ${variable} === 'false' || ${variable} === '0' || ${variable} === '1') {
                    ${variable} = ${variable} === 'true' || ${variable} === '1';
                }
                else {
                    ${error('must be true or false')}
                }
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
    return new BooleanType();
};
export { BooleanType }