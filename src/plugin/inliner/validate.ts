import ts from 'typescript';
import { ValidationCompileError } from './errors';


interface ValidationContext {
    allowedParams: Set<string>;
    fileName: string;
    functionName: string;
    localVariables: Set<string>;
    sourceFile: ts.SourceFile;
}


const SYNTAX_KIND = ts.SyntaxKind;


function checkClosureMutation(node: ts.Node, ctx: ValidationContext): string | null {
    if (ts.isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) {
        let target = ts.isIdentifier(node.left) ? node.left.text : null;

        if (target && isClosureVariable(target, ctx)) {
            return target;
        }
    }

    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
        let op = node.operator;

        if (op === SYNTAX_KIND.PlusPlusToken || op === SYNTAX_KIND.MinusMinusToken) {
            if (ts.isIdentifier(node.operand)) {
                let name = node.operand.text;

                if (isClosureVariable(name, ctx)) {
                    return name;
                }
            }
        }
    }

    return null;
}

function collectBindingPatternNames(
    pattern: ts.BindingPattern,
    locals: Set<string>
): void {
    let elements = pattern.elements;

    for (let i = 0, n = elements.length; i < n; i++) {
        let element = elements[i];

        if (ts.isBindingElement(element)) {
            let name = element.name;

            if (ts.isIdentifier(name)) {
                locals.add(name.text);
            }
            else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
                collectBindingPatternNames(name, locals);
            }
        }
    }
}

function collectFromVariableDeclarationList(
    declList: ts.VariableDeclarationList,
    locals: Set<string>
): void {
    let declarations = declList.declarations;

    for (let i = 0, n = declarations.length; i < n; i++) {
        let decl = declarations[i],
            name = decl.name;

        if (ts.isIdentifier(name)) {
            locals.add(name.text);
        }
        else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
            collectBindingPatternNames(name, locals);
        }
    }
}

function collectLocalVariables(node: ts.Node, locals: Set<string>): void {
    if (ts.isVariableStatement(node)) {
        collectFromVariableDeclarationList(node.declarationList, locals);
    }

    if (ts.isForStatement(node) && node.initializer && ts.isVariableDeclarationList(node.initializer)) {
        collectFromVariableDeclarationList(node.initializer, locals);
    }

    if ((ts.isForOfStatement(node) || ts.isForInStatement(node)) && node.initializer && ts.isVariableDeclarationList(node.initializer)) {
        collectFromVariableDeclarationList(node.initializer, locals);
    }

    ts.forEachChild(node, child => collectLocalVariables(child, locals));
}

function createError(
    pattern: string,
    node: ts.Node,
    ctx: ValidationContext
): ValidationCompileError {
    let { character, line } = ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());

    return new ValidationCompileError(
        pattern,
        ctx.functionName,
        ctx.fileName,
        line + 1,
        character + 1
    );
}

function isAssignmentOperator(kind: ts.SyntaxKind): boolean {
    return kind === SYNTAX_KIND.AmpersandAmpersandEqualsToken ||
        kind === SYNTAX_KIND.AmpersandEqualsToken ||
        kind === SYNTAX_KIND.AsteriskAsteriskEqualsToken ||
        kind === SYNTAX_KIND.AsteriskEqualsToken ||
        kind === SYNTAX_KIND.BarBarEqualsToken ||
        kind === SYNTAX_KIND.BarEqualsToken ||
        kind === SYNTAX_KIND.CaretEqualsToken ||
        kind === SYNTAX_KIND.EqualsToken ||
        kind === SYNTAX_KIND.GreaterThanGreaterThanEqualsToken ||
        kind === SYNTAX_KIND.GreaterThanGreaterThanGreaterThanEqualsToken ||
        kind === SYNTAX_KIND.LessThanLessThanEqualsToken ||
        kind === SYNTAX_KIND.MinusEqualsToken ||
        kind === SYNTAX_KIND.PercentEqualsToken ||
        kind === SYNTAX_KIND.PlusEqualsToken ||
        kind === SYNTAX_KIND.QuestionQuestionEqualsToken ||
        kind === SYNTAX_KIND.SlashEqualsToken;
}

function isClosureVariable(name: string, ctx: ValidationContext): boolean {
    return !ctx.allowedParams.has(name) && !ctx.localVariables.has(name);
}

function isRecursiveCall(node: ts.CallExpression, ctx: ValidationContext): boolean {
    return ts.isIdentifier(node.expression) && node.expression.text === ctx.functionName;
}

function validateNode(node: ts.Node, ctx: ValidationContext): void {
    if (node.kind === SYNTAX_KIND.ThisKeyword) {
        throw createError('this', node, ctx);
    }

    if (ts.isYieldExpression(node)) {
        throw createError('yield', node, ctx);
    }

    if (
        ts.isIdentifier(node) &&
        node.text === 'arguments' &&
        !ctx.allowedParams.has('arguments') &&
        !ctx.localVariables.has('arguments')
    ) {
        throw createError('arguments', node, ctx);
    }

    if (ts.isCallExpression(node) && isRecursiveCall(node, ctx)) {
        throw createError('recursive call', node, ctx);
    }

    let mutationCheck = checkClosureMutation(node, ctx);

    if (mutationCheck) {
        throw createError(`mutable closure variable '${mutationCheck}'`, node, ctx);
    }

    ts.forEachChild(node, child => validateNode(child, ctx));
}


const validateResolvedFunction = (
    name: string,
    valueParam: string,
    errorsParam: string,
    body: ts.Statement[],
    sourceFile: ts.SourceFile,
    fileName: string
): void => {
    let ctx: ValidationContext = {
            allowedParams: new Set([valueParam, errorsParam]),
            fileName,
            functionName: name,
            localVariables: new Set(),
            sourceFile
        };

    for (let i = 0, n = body.length; i < n; i++) {
        collectLocalVariables(body[i], ctx.localVariables);
    }

    for (let i = 0, n = body.length; i < n; i++) {
        validateNode(body[i], ctx);
    }
};


export { validateResolvedFunction };
export type { ValidationContext };
