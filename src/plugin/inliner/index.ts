import ts from 'typescript';
import { isArray } from '@esportsplus/utilities';
import { resolveFunction, resolveFunctionFromSourceFile, resolveInlineFunction, type ResolvedFunction } from './resolve';
import { transformFunctionBody } from './transform';
import { VARIABLE_ERROR, VARIABLE_INPUT } from '~/plugin/constants';
import { propertyAccess } from '~/plugin/utilities';


const ARROW_FUNCTION_REGEX = /^[a-zA-Z_]\w*\s*=>/;

const ASYNC_FUNCTION_REGEX = /^(async\s+)?function\s*\(/;

const ASYNC_PAREN_REGEX = /^\(?async\s*\)?/;


interface InlineConfig {
    fileName: string;
    parentPath?: string[];
    pathExpression?: string;
    propertyName: string;
    sourceCode?: string;
    sourceFile?: ts.SourceFile;
    validator: string | string[];
    valueReplacement?: string;
}

interface InlineResult {
    code: string;
    inlinedFunctions: string[];
    isAsync: boolean;
}


function isInlineFunctionExpression(str: string): boolean {
    return ASYNC_FUNCTION_REGEX.test(str) ||
        ((ASYNC_PAREN_REGEX.test(str) || str.charAt(0) === '(' || ARROW_FUNCTION_REGEX.test(str)) &&
         str.indexOf('=>') !== -1);
}

function resolveValidatorFunction(
    validatorSpec: string,
    config: InlineConfig
): ResolvedFunction | null {
    let trimmed = validatorSpec.trim();

    if (isInlineFunctionExpression(trimmed)) {
        return resolveInlineFunction(trimmed, config.fileName);
    }

    if (config.sourceFile) {
        return resolveFunctionFromSourceFile(trimmed, config.sourceFile, config.fileName);
    }

    return resolveFunction(trimmed, config.sourceCode!, config.fileName);
}


const inlineValidators = (config: InlineConfig): InlineResult => {
    let inlinedCode: string[] = [],
        inlinedFunctions: string[] = [],
        isAsync = false,
        pathParts = config.parentPath
            ? [...config.parentPath, config.propertyName]
            : [config.propertyName],
        validators = isArray(config.validator)
            ? config.validator
            : [config.validator];

    let propertyPath = pathParts.join('.'),
        valueReplacement = config.valueReplacement ?? propertyAccess(config.propertyName, VARIABLE_INPUT);

    for (let i = 0, n = validators.length; i < n; i++) {
        let resolved = resolveValidatorFunction(validators[i], config);

        if (!resolved) {
            continue;
        }

        if (resolved.isAsync) {
            isAsync = true;
        }

        inlinedCode.push(`// Inlined from ${resolved.name}()`);
        inlinedCode.push(
            transformFunctionBody(
                resolved.body,
                {
                    errorsParam: resolved.errorsParam,
                    errorsReplacement: VARIABLE_ERROR,
                    pathExpression: config.pathExpression,
                    propertyPath,
                    valueParam: resolved.valueParam,
                    valueReplacement
                }
            )
        );
        inlinedFunctions.push(resolved.name);
    }

    return {
        code: inlinedCode.join('\n'),
        inlinedFunctions,
        isAsync
    };
};


export { validateResolvedFunction } from './validate';
export { resolveFunction, resolveInlineFunction } from './resolve';
export { transformFunctionBody } from './transform';
export { ValidationCompileError } from './errors';
export { inlineValidators };
export type { InlineConfig, InlineResult };
export type { ResolvedFunction } from './resolve';
export type { TransformContext } from './transform';
export type { ValidationContext } from './validate';
