import { Property, Type, Validator } from '~/types';
import compile from '~/compile';


class NumberType extends Type<number> {

    constructor(type: string) {
        super(type);
    }


    compile(instance: Validator, obj: string, property?: Property) {
        let [code, error, finale, variable] = instance.variables(this.config, obj, property),
            integer = this.config.type === 'integer' ? `|| ${variable} % 1 !== 0` : '';

        code += `
            if (( typeof ${variable} !== 'number' && isNaN(${variable} = +${variable}) ) ${integer}) {
                ${error(`must be a ${this.config.type === 'integer' ? `integer` : 'number'}`)}
            }
            ${compile.errors(this.config, error, property, variable)}
            else {
                ${finale}
            }
        `;

        return compile.optional(code, this.config.optional, variable);
    }
}


const float = () => {
    return new NumberType('float');
};

const integer = () => {
    return new NumberType('integer');
};

const number = () => {
    return new NumberType('number');
};


export { float, integer, number, NumberType };