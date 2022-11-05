import { ObjectShape, Property, Variables } from "~/types";
import { Type } from './type';
import factory from "~/factory";


class ObjectType<T extends ObjectShape> extends Type<never> {
    config: {
        items: T;
        optional?: boolean;
    };


    constructor(config: ObjectType<T>['config']) {
        super();
        this.config = config;
    }


    clone() {
        return this.only(...Object.keys(this.config.items));
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

    except(...keys: string[]) {
        let only = Object.keys(this.config.items);

        for (let key in keys) {
            let index = only.indexOf(key);

            if (index === -1) {
                continue;
            }

            only.splice(index, 1);
        }

        return this.only(...only);
    }

    only(...keys: string[]) {
        let items: ObjectShape = {};

        for (let key in keys) {
            items[key] = this.config.items[key].clone();
        }

        return new ObjectType({
            items,
            optional: this.config.optional
        });
    }
}


export default <T extends ObjectShape>(items: T) => new ObjectType({ items });
export { ObjectType };