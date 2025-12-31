import ts from 'typescript';
import { validateResolvedFunction } from './validate';
import { createSourceFile } from '~/plugin/utilities';


interface ResolvedFunction {
    body: ts.Statement[];
    errorsParam: string;
    isAsync: boolean;
    name: string;
    valueParam: string;
}


function extractFromArrowFunction(node: ts.ArrowFunction, name: string): ResolvedFunction | null {
    let extracted = extractParams(node.parameters);

    if (!extracted) {
        return null;
    }

    return {
        body: ts.isBlock(node.body)
            ? [...node.body.statements]
            : [ts.factory.createExpressionStatement(node.body)],
        errorsParam: extracted.errorsParam,
        isAsync: hasAsyncModifier(node),
        name,
        valueParam: extracted.valueParam
    };
}

function extractFromFunctionLike(node: ts.FunctionDeclaration | ts.FunctionExpression, name: string): ResolvedFunction | null {
    if (!node.body) {
        return null;
    }

    let extracted = extractParams(node.parameters);

    if (!extracted) {
        return null;
    }

    return {
        body: [...node.body.statements],
        errorsParam: extracted.errorsParam,
        isAsync: hasAsyncModifier(node),
        name,
        valueParam: extracted.valueParam
    };
}

function extractParameterName(param: ts.ParameterDeclaration): string | null {
    if (ts.isIdentifier(param.name)) {
        return param.name.text;
    }

    return null;
}

function extractParams(params: ts.NodeArray<ts.ParameterDeclaration>): { errorsParam: string; valueParam: string } | null {
    if (params.length < 2) {
        return null;
    }

    let errorsParam = extractParameterName(params[1]),
        valueParam = extractParameterName(params[0]);

    if (!errorsParam || !valueParam) {
        return null;
    }

    return { errorsParam, valueParam };
}

function hasAsyncModifier(node: ts.FunctionLikeDeclaration): boolean {
    return node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
}

function findFunction(functionName: string, sourceFile: ts.SourceFile): ResolvedFunction | null {
    let result: ResolvedFunction | null = null;

    function visit(node: ts.Node): void {
        if (result) {
            return;
        }

        if (ts.isFunctionDeclaration(node) && node.name?.text === functionName) {
            result = extractFromFunctionLike(node, functionName);
            return;
        }

        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text === functionName &&
            node.initializer
        ) {
            if (ts.isArrowFunction(node.initializer)) {
                result = extractFromArrowFunction(node.initializer, functionName);
                return;
            }

            if (ts.isFunctionExpression(node.initializer)) {
                result = extractFromFunctionLike(node.initializer, functionName);
                return;
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return result;
}

function validateAndReturn(result: ResolvedFunction | null, sourceFile: ts.SourceFile, fileName: string): ResolvedFunction | null {
    if (result) {
        validateResolvedFunction(result.name, result.valueParam, result.errorsParam, result.body, sourceFile, fileName);
    }

    return result;
}


const resolveFunction = (
    functionName: string,
    sourceCode: string,
    fileName: string
): ResolvedFunction | null => {
    let sourceFile = createSourceFile(fileName, sourceCode);

    return validateAndReturn(findFunction(functionName, sourceFile), sourceFile, fileName);
};

const resolveFunctionFromSourceFile = (
    functionName: string,
    sourceFile: ts.SourceFile,
    fileName: string
): ResolvedFunction | null => {
    return validateAndReturn(findFunction(functionName, sourceFile), sourceFile, fileName);
};

const resolveInlineFunction = (
    expressionSource: string,
    fileName: string
): ResolvedFunction | null => {
    let result: ResolvedFunction | null = null,
        sourceFile = createSourceFile(fileName, `const __inline = ${expressionSource}`);

    function visit(node: ts.Node): void {
        if (result) {
            return;
        }

        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text === '__inline' &&
            node.initializer
        ) {
            if (ts.isArrowFunction(node.initializer)) {
                result = extractFromArrowFunction(node.initializer, 'anonymous');
            }
            else if (ts.isFunctionExpression(node.initializer)) {
                result = extractFromFunctionLike(node.initializer, 'anonymous');
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return validateAndReturn(result, sourceFile, fileName);
};


export { resolveFunction, resolveFunctionFromSourceFile, resolveInlineFunction };
export type { ResolvedFunction };
