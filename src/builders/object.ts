import { ObjectShape, Property, Variables } from "./types";
import { Type } from './type';
import Validator from "~/validator";


class ObjectType<T extends ObjectShape> extends Type<never> {
    config: {
        items: T;
        optional?: boolean;
    };


    constructor(config: ObjectType<T>['config']) {
        super();
        this.config = config;
    }


    // clone() {
    //     return this.only(...Object.keys(this.config.items));
    // }

    compile(instance: Validator, obj: string, property?: Property) {
        let [code, index, variable] = instance.variables(this, obj, property);

        if (this.config.optional) {
            code += `if (${variable} !== undefined) {`;
        }

            code += `
                if (Object.prototype.toString.call(${variable}) !== '[object Object]') {
                    ${instance.error(index, variable, `must be an object`)}
                }
            `;

            code += `else {`;
                for (let key in this.config.items) {
                    code += this.config.items[key].compile(instance, `${variable}`, key);
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

    // except(...keys: string[]) {
    //     let only = Object.keys(this.config.items);

    //     for (let key in keys) {
    //         let index = only.indexOf(key);

    //         if (index === -1) {
    //             continue;
    //         }

    //         only.splice(index, 1);
    //     }

    //     return this.only(...only);
    // }

    // only(...keys: string[]) {
    //     let config: Record<string, any> = { items: {} };

    //     for (let key in keys) {
    //         config.items[key] = this.config.items[key].clone();
    //     }

    //     for (let key in this.config) {
    //         if (key === 'items') {
    //             continue;
    //         }

    //         config[key] = this.config[key as keyof ObjectType<T>['config']];
    //     }

    //     return new ObjectType(config as ObjectType<T>['config']);
    // }
}


export default <T extends ObjectShape>(items: T) => new ObjectType({ items });
export { ObjectType };