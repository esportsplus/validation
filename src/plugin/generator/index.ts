import { uuid } from '@esportsplus/utilities';
import { generateArray } from './array';
import { generateObject } from './object';
import type { AnalyzedProperty, AnalyzedType } from '~/plugin/analyzer';
import { VARIABLE_ERROR, VARIABLE_INPUT } from '~/plugin/constants';
import { inlineValidators } from '~/plugin/inliner';
import { propertyAccess } from '~/plugin/utilities';
import { PRIMITIVE_VALIDATORS, VALIDATORS_SOURCE_FILE } from '~/plugin/validators';


interface GeneratorContext {
    customMessages: Map<string, string>;
}


function generatePrimitiveValidation(
    prop: AnalyzedProperty,
    variable: string,
    pathParts: string[],
    customMessage?: string
): string {
    if (!PRIMITIVE_VALIDATORS.has(prop.type)) {
        return '';
    }

    let code = inlineValidators({
            fileName: 'validators.ts',
            parentPath: pathParts.slice(0, -1),
            propertyName: prop.name,
            sourceFile: VALIDATORS_SOURCE_FILE,
            validator: prop.type,
            valueReplacement: variable
        }).code;

    if (customMessage) {
        let e = uuid(),
            path = pathParts.join('.');

        return `
            let ${e} = ${VARIABLE_ERROR}.length;

            ${code}

            if (${VARIABLE_ERROR}.length > ${e}) {
                ${VARIABLE_ERROR}.length = ${e};
                ${VARIABLE_ERROR}.push({ message: '${customMessage}', path: '${path}' });
            }
        `;
    }

    return code;
}

function generatePropertyValidation(
    prop: AnalyzedProperty,
    variable: string,
    pathParts: string[],
    context: GeneratorContext
): string {
    let code = generateTypeValidation(
            prop,
            variable,
            `'${pathParts.join('.')}'`,
            pathParts,
            context.customMessages.get(pathParts.join('.')),
            context
        );

    if (prop.optional) {
        return `
            if (${variable} !== undefined) {
                ${code}
            }
        `;
    }

    return code;
}

function generateTypeValidation(
    prop: AnalyzedProperty,
    variable: string,
    path: string,
    pathParts: string[],
    customMessage: string | undefined,
    context: GeneratorContext
): string {
    switch (prop.type) {
        case 'array':
            return generateArray(
                variable,
                path,
                pathParts,
                prop.itemType || { name: 'item', optional: false, type: 'unknown' },
                customMessage || 'must be an array',
                context,
                generatePropertyValidation
            );

        case 'boolean':
        case 'float':
        case 'integer':
        case 'number':
        case 'string':
            return generatePrimitiveValidation(prop, variable, pathParts, customMessage);

        case 'object':
            return generateObject(
                variable,
                path,
                pathParts,
                prop.properties || [],
                customMessage || 'must be an object',
                context,
                generatePropertyValidation
            );

        default:
            return '';
    }
}


const generateValidator = (
    type: AnalyzedType,
    context: GeneratorContext,
    customValidatorCode?: string
): string => {
    let code = '',
        properties = type.properties;

    for (let i = 0, n = properties.length; i < n; i++) {
        let property = properties[i];

        code += generatePropertyValidation(
            property,
            propertyAccess(property.name, VARIABLE_INPUT),
            [property.name],
            context
        ) + '\n';
    }

    if (customValidatorCode) {
        code += `
            if (${VARIABLE_ERROR}.length === 0) {
                ${customValidatorCode}
            }
        `;
    }

    return `
        async (${VARIABLE_INPUT}) => {
            let ${VARIABLE_ERROR} = [];

            ${code}

            if (${VARIABLE_ERROR}.length === 0) {
                return { ok: true, data: ${VARIABLE_INPUT}, errors: undefined };
            }

            return { ok: false, data: ${VARIABLE_INPUT}, errors: ${VARIABLE_ERROR} };
        }
    `;
};


export { generateArray } from './array';
export { parseErrorMessages } from './messages';
export { generateObject } from './object';
export { generatePropertyValidation, generateValidator };
export type { GeneratorContext };
