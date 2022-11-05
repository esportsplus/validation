import { Property } from "~/types";
import { Type } from './type';
import factory from "~/factory";


class BooleanType extends Type<boolean> {

    constructor(config: BooleanType['config'] = {}) {
        super();
        this.config = config;
    }


    clone() {
        return new BooleanType(this.config);
    }

    compile(obj: string, property?: Property) {
        let [code, variable] = factory.variables(obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (typeof ${variable} !== 'boolean') {
                    ${factory.error(variable, `must be true or false`)}
                }
            `;

        if (this.config.optional) {
            code += `}`;
        }

        return code;
    }
}


export default () => new BooleanType();
export { BooleanType }