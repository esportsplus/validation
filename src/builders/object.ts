import { ObjectShape, Property, Type, Variables } from "~/types";
import factory from "~/factory";


class ObjectType<T extends ObjectShape> extends Type<never> {
    config: {
        items: T;
        optional?: boolean;
    };


    constructor(items: T) {
        super();
        this.config = { items };
    }


    compile(obj: string, property?: Property) {
        let [code, variable] = factory.variables(obj, property);

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
                    code += this.config.items[key].compile(`${variable}`, key);
                }

                code += `
                    if (${Variables['errors']}.length === 0) {
                        let whitelist = ['${Object.keys(this.config.items).join("','")}'];

                        for (let key in ${variable}) {
                            if (whitelist.includes(key)) {
                                continue;
                            }

                            delete ${variable}[key];
                        }
                    }
                `;
            code += `}`;

        if (this.config.optional) {
            code += `}`;
        }

        return code;
    }
}


export default <T extends ObjectShape>(items: T) => new ObjectType(items);
export { ObjectType };