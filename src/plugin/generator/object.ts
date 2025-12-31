import { uuid } from '@esportsplus/utilities';
import type { GeneratorContext } from './index';
import type { AnalyzedProperty } from '~/plugin/analyzer';
import { VARIABLE_ERROR } from '~/plugin/constants';
import { propertyAccess } from '~/plugin/utilities';


function generateObjectCore(
    variable: string,
    pathExpr: string,
    properties: AnalyzedProperty[],
    errorMessage: string,
    generateNestedProperty: (prop: AnalyzedProperty, propVar: string, propPathExpr: string) => string
): string {
    let allowlistParts: string[] = [],
        codeParts: string[] = [];

    for (let i = 0, n = properties.length; i < n; i++) {
        let prop = properties[i];

        allowlistParts.push(`'${prop.name}'`);
        codeParts.push(
            generateNestedProperty(
                prop,
                propertyAccess(prop.name, variable),
                `${pathExpr} + '.${prop.name}'`
            )
        );
    }

    let a = uuid(),
        e = uuid(),
        k = uuid();

    return `
        if (Object.prototype.toString.call(${variable}) !== '[object Object]') {
            ${VARIABLE_ERROR}.push({ message: '${errorMessage}', path: ${pathExpr} });
        }
        else {
            let ${e} = ${VARIABLE_ERROR}.length;

            ${codeParts.join('\n')}
            ${
                allowlistParts.length
                    ? `
                        if (${VARIABLE_ERROR}.length === ${e}) {
                            let ${a} = [${allowlistParts.join(', ')}];

                            for (let ${k} in ${variable}) {
                                if (${a}.indexOf(${k}) === -1) {
                                    delete ${variable}[${k}];
                                }
                            }
                        }
                    `
                    : ''
            }
        }
    `;
}


const generateObject = (
    variable: string,
    path: string,
    pathParts: string[],
    properties: AnalyzedProperty[],
    errorMessage: string,
    context: GeneratorContext,
    generateProperty: (prop: AnalyzedProperty, variable: string, pathParts: string[], context: GeneratorContext) => string
): string => {
    return generateObjectCore(
        variable,
        path,
        properties,
        errorMessage,
        (prop, propVar) => generateProperty(
            prop,
            propVar,
            [...pathParts, prop.name],
            context
        )
    );
};


export { generateObject, generateObjectCore };
