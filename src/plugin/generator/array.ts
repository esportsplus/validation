import { uuid } from '@esportsplus/utilities';
import type { AnalyzedProperty } from '~/plugin/analyzer';
import { VARIABLE_ERROR } from '~/plugin/constants';
import { inlineValidators } from '~/plugin/inliner';
import { PRIMITIVE_VALIDATORS, VALIDATORS_SOURCE_FILE } from '~/plugin/validators';
import type { GeneratorContext } from './index';
import { generateObjectCore } from './object';


function generateArrayItemObject(
    variable: string,
    pathExpr: string,
    pathPattern: string[],
    properties: AnalyzedProperty[],
    context: GeneratorContext,
    generateProperty: (prop: AnalyzedProperty, variable: string, pathParts: string[], context: GeneratorContext) => string
): string {
    return generateObjectCore(
        variable,
        pathExpr,
        properties,
        'item must be an object',
        (prop, propVar, propPathExpr) => generateNestedPropertyInArray(
            prop,
            propVar,
            propPathExpr,
            pathPattern,
            context,
            generateProperty
        ) || ''
    );
}

function generateItemValidation(
    itemType: AnalyzedProperty,
    variable: string,
    pathExpr: string,
    parentPathParts: string[],
    context: GeneratorContext,
    generateProperty: (prop: AnalyzedProperty, variable: string, pathParts: string[], context: GeneratorContext) => string
): string {
    let pathPattern = [...parentPathParts, '[*]'];

    if (PRIMITIVE_VALIDATORS.has(itemType.type)) {
        return generatePrimitiveItemValidation(
            itemType,
            variable,
            pathExpr,
            context.customMessages.get(pathPattern.join('.'))
        );
    }

    switch (itemType.type) {
        case 'array':
            return generateNestedArrayValidation(
                variable,
                pathExpr,
                pathPattern,
                itemType.itemType!,
                context,
                generateProperty
            );

        case 'object':
            return generateArrayItemObject(
                variable,
                pathExpr,
                pathPattern,
                itemType.properties || [],
                context,
                generateProperty
            );

        default:
            return '';
    }
}

function generateNestedArrayValidation(
    variable: string,
    pathExpr: string,
    parentPathParts: string[],
    itemType: AnalyzedProperty,
    context: GeneratorContext,
    generateProperty: (prop: AnalyzedProperty, variable: string, pathParts: string[], context: GeneratorContext) => string
): string {
    let e = uuid(),
        i = uuid(),
        n = uuid();

    return `
        if (!Array.isArray(${variable})) {
            ${VARIABLE_ERROR}.push({ message: 'item must be an array', path: ${pathExpr} });
        }
        else {
            let ${e} = ${VARIABLE_ERROR}.length;

            for (let ${i} = 0, ${n} = ${variable}.length; ${i} < ${n}; ${i}++) {
                ${generateItemValidation(
                    itemType,
                    `${variable}[${i}]`,
                    `${pathExpr} + '[' + ${i} + ']'`,
                    parentPathParts,
                    context,
                    generateProperty
                )}

                if (${VARIABLE_ERROR}.length > ${e}) {
                    break;
                }
            }
        }
    `;
}

function generateNestedPropertyInArray(
    prop: AnalyzedProperty,
    variable: string,
    pathExpr: string,
    pathPattern: string[],
    context: GeneratorContext,
    generateProperty: (prop: AnalyzedProperty, variable: string, pathParts: string[], context: GeneratorContext) => string
): string {
    let currentPattern = [...pathPattern, prop.name],
        customMessage = context.customMessages.get(currentPattern.join('.')),
        wrap = prop.optional
            ? (code: string) => `
                if (${variable} !== undefined) {
                    ${code}
                }
            `
            : (code: string) => code;

    if (PRIMITIVE_VALIDATORS.has(prop.type)) {
        return wrap(
            generatePrimitiveItemValidation(prop, variable, pathExpr, customMessage)
        );
    }

    switch (prop.type) {
        case 'object':
            if (!prop.properties) {
                return '';
            }

            return wrap(
                generateObjectCore(
                    variable,
                    pathExpr,
                    prop.properties,
                    `${prop.name} must be an object`,
                    (nestedProp, propVar, propPathExpr) => generateNestedPropertyInArray(
                        nestedProp,
                        propVar,
                        propPathExpr,
                        currentPattern,
                        context,
                        generateProperty
                    ) || ''
                )
            );

        default:
            return '';
    }
}

function generatePrimitiveItemValidation(
    { name, type }: AnalyzedProperty,
    variable: string,
    pathExpr: string,
    customMessage?: string
): string {
    if (!PRIMITIVE_VALIDATORS.has(type)) {
        return '';
    }

    let code = inlineValidators({
            fileName: 'validators.ts',
            pathExpression: pathExpr,
            propertyName: name || 'item',
            sourceFile: VALIDATORS_SOURCE_FILE,
            validator: type,
            valueReplacement: variable
        }).code;

    if (customMessage) {
        let e = uuid();

        return `
            let ${e} = ${VARIABLE_ERROR}.length;
            ${code}
            if (${VARIABLE_ERROR}.length > ${e}) {
                ${VARIABLE_ERROR}.length = ${e};
                ${VARIABLE_ERROR}.push({ message: '${customMessage}', path: ${pathExpr} });
            }
        `;
    }

    return code;
}


const generateArray = (
    variable: string,
    path: string,
    pathParts: string[],
    itemType: AnalyzedProperty,
    errorMessage: string,
    context: GeneratorContext,
    generateProperty: (prop: AnalyzedProperty, variable: string, pathParts: string[], context: GeneratorContext) => string
): string => {
    let e = uuid(),
        i = uuid(),
        n = uuid();

    return `
        if (!Array.isArray(${variable})) {
            ${VARIABLE_ERROR}.push({ message: '${errorMessage}', path: ${path} });
        }
        else {
            const ${e} = ${VARIABLE_ERROR}.length;

            for (let ${i} = 0, ${n} = ${variable}.length; ${i} < ${n}; ${i}++) {
                ${generateItemValidation(
                    itemType,
                    `${variable}[${i}]`,
                    pathParts.length
                        ? `'${pathParts.join('.')}[' + ${i} + ']'`
                        : `'[' + ${i} + ']'`,
                    pathParts,
                    context,
                    generateProperty
                )}

                if (${VARIABLE_ERROR}.length > ${e}) {
                    break;
                }
            }
        }
    `;
};


export { generateArray };
