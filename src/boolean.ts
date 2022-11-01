import { Property, Validator } from "./types";
import factory from "./factory";


class BooleanType {
    config: {
        optional?: boolean;
    } = {};
    #validator?: Validator;


    compile(obj: string, property?: Property) {
        let [code, variable] = factory.init(obj, property);

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

    optional(): this {
        this.config.optional = true;

        return this;
    }

    validate(data: any) {
        return this.validator(data);
    }

    get validator() {
        if (!this.#validator) {
            this.#validator = factory.validator(this);
        }

        return this.#validator;
    }
}


export default () => new BooleanType();
export { BooleanType }