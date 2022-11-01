import { Property, PrimitiveTypes, Validator, Variables } from './types';
import factory from './factory';


class ObjectType {
    config: {
        items: Record<string, PrimitiveTypes>;
        optional?: boolean;
    };
    #validator?: Validator;


    constructor(items: ObjectType['config']['items'] = {}) {
        this.config = { items };
    }


    compile(obj: string, property?: Property) {
        let [code, variable] = factory.init(obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (Object.prototype.toString.call(${variable}) !== '[object Object]') {
                    ${factory.error(variable, `must be an object`)}
                }
            `;

            code += `else {`;
                for (let key in this.config.items) {
                    code += this.config.items[key].compile(variable, key);
                }

                code += `
                    if (${Variables['errors']}.length === 0) {
                        let whitelist = ['${Object.keys(this.config.items).join("','")}'];

                        for (let key in ${obj}) {
                            if (whitelist.includes(key)) {
                                continue;
                            }

                            delete ${obj}[key];
                        }
                    }
                `;
            code += `}`;

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


export default (items: ObjectType['config']['items'] = {}) => new ObjectType(items);
export { ObjectType };