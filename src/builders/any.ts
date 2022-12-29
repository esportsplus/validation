import { Property } from "./types";
import { Type } from './type';
import Validator from "~/validator";


class AnyType extends Type<unknown> {

    constructor(config: AnyType['config'] = {}) {
        super();
        this.config = config;
    }


    compile(instance: Validator, obj: string, property?: Property) {
        let [code, index, variable] = instance.variables(this, obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (${variable} === undefined) {
                    ${instance.error(index, variable, `is required`)}
                }
            `;

        if (this.config.optional) {
            code += `}`;
        }

        return code;
    }
}


export default () => new AnyType();
export { AnyType }