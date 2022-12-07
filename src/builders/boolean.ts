import { Property } from "./types";
import { Type } from './type';
import Validator from "~/validator";


class BooleanType extends Type<boolean> {

    constructor(config: BooleanType['config'] = {}) {
        super();
        this.config = config;
    }


    // clone() {
    //     return new BooleanType(this.config);
    // }

    compile(instance: Validator, obj: string, property?: Property) {
        let [code, index, variable] = instance.variables(this, obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (typeof ${variable} !== 'boolean') {
                    if (['true', 'false', '0', '1'].includes( ${variable} = String(${variable}).toLowerCase() )) {
                        ${variable} = ${variable} === 'true' || ${variable} === '1';
                    }
                    else {
                        ${instance.error(index, variable, `must be true or false`)}
                    }
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