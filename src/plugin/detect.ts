import ts from 'typescript';
import { createSourceFile, extractSourceText } from '~/plugin/utilities';


interface DetectedBuildCall {
    assignedTo?: string;
    configSource?: string;
    end: number;
    errorMessages?: string;
    start: number;
    typeParameter: string;
}

function findAssignedVariable(node: ts.CallExpression): string | undefined {
    let current: ts.Node = node;

    while (current.parent) {
        let parent = current.parent;

        if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
            return parent.name.text;
        }

        if (
            ts.isBinaryExpression(parent) &&
            parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
        ) {
            let left = parent.left;

            if (ts.isIdentifier(left)) {
                return left.text;
            }

            if (ts.isPropertyAccessExpression(left)) {
                return left.name.text;
            }
        }

        if (ts.isBlock(parent) || ts.isSourceFile(parent)) {
            break;
        }

        current = parent;
    }

    return undefined;
}

function tryExtractBuildCall(node: ts.CallExpression, sourceCode: string): DetectedBuildCall | null {
    let expr = node.expression;

    if (!ts.isPropertyAccessExpression(expr)) {
        return null;
    }

    if (expr.name.text !== 'build') {
        return null;
    }

    if (!ts.isIdentifier(expr.expression) || expr.expression.text !== 'validator') {
        return null;
    }

    let typeArguments = node.typeArguments;

    if (!typeArguments || typeArguments.length === 0) {
        return null;
    }

    let errorMessages: string | undefined,
        typeParameter = extractSourceText(typeArguments[0], sourceCode);

    if (typeArguments.length > 1) {
        errorMessages = extractSourceText(typeArguments[1], sourceCode);
    }

    let configSource: string | undefined;

    if (node.arguments.length > 0) {
        configSource = extractSourceText(node.arguments[0], sourceCode);
    }

    return {
        assignedTo: findAssignedVariable(node),
        configSource,
        end: node.end,
        errorMessages,
        start: node.pos,
        typeParameter
    };
}


const detectBuildCalls = (sourceCode: string, fileName: string): DetectedBuildCall[] => {
    let detectedCalls: DetectedBuildCall[] = [],
        sourceFile = createSourceFile(fileName, sourceCode);

    function visit(node: ts.Node): void {
        if (ts.isCallExpression(node)) {
            let buildCall = tryExtractBuildCall(node, sourceCode);

            if (buildCall) {
                detectedCalls.push(buildCall);
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return detectedCalls;
};

const mightContainBuildCalls = (sourceCode: string): boolean => {
    return sourceCode.includes('validator.build');
};


export { detectBuildCalls, mightContainBuildCalls };
export type { DetectedBuildCall };
