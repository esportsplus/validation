import ts from 'typescript';
import { createSourceFile } from '~/plugin/utilities';


const BASE_VAR_REGEX = /^(\w+)/;

const BRACKET_REGEX = /\[(?:'([^']+)'|([^\]]+))\]/g;


interface TransformContext {
    errorsParam: string;
    errorsReplacement: string;
    pathExpression?: string;
    propertyPath: string;
    valueParam: string;
    valueReplacement: string;
}


function cloneExpression(node: ts.Expression): ts.Expression {
    if (ts.isStringLiteral(node)) {
        return ts.factory.createStringLiteral(node.text, true);
    }

    if (ts.isNumericLiteral(node)) {
        return ts.factory.createNumericLiteral(node.text);
    }

    if (ts.isIdentifier(node)) {
        return ts.factory.createIdentifier(node.text);
    }

    if (ts.isBinaryExpression(node)) {
        return ts.factory.createBinaryExpression(
            cloneExpression(node.left),
            node.operatorToken.kind,
            cloneExpression(node.right)
        );
    }

    if (ts.isParenthesizedExpression(node)) {
        return ts.factory.createParenthesizedExpression(cloneExpression(node.expression));
    }

    if (ts.isPropertyAccessExpression(node)) {
        return ts.factory.createPropertyAccessExpression(
            cloneExpression(node.expression),
            node.name.text
        );
    }

    if (ts.isElementAccessExpression(node)) {
        return ts.factory.createElementAccessExpression(
            cloneExpression(node.expression),
            cloneExpression(node.argumentExpression)
        );
    }

    if (ts.isCallExpression(node)) {
        return ts.factory.createCallExpression(
            cloneExpression(node.expression),
            undefined,
            node.arguments.map(arg => cloneExpression(arg as ts.Expression))
        );
    }

    return ts.factory.createStringLiteral('');
}

function createPropertyAccess(accessString: string): ts.Expression {
    let baseMatch = accessString.match(BASE_VAR_REGEX);

    if (!baseMatch) {
        return ts.factory.createIdentifier(accessString);
    }

    let baseVar = baseMatch[1],
        bracketMatch: RegExpExecArray | null,
        expr: ts.Expression = ts.factory.createIdentifier(baseVar),
        remaining = accessString.slice(baseVar.length);

    BRACKET_REGEX.lastIndex = 0;

    while ((bracketMatch = BRACKET_REGEX.exec(remaining)) !== null) {
        if (bracketMatch[1] !== undefined) {
            expr = ts.factory.createElementAccessExpression(
                expr,
                ts.factory.createStringLiteral(bracketMatch[1], true)
            );
        }
        else if (bracketMatch[2] !== undefined) {
            expr = ts.factory.createElementAccessExpression(
                expr,
                ts.factory.createIdentifier(bracketMatch[2])
            );
        }
    }

    return expr;
}

function createTransformer(ctx: TransformContext): ts.TransformerFactory<ts.Node> {
    return (context: ts.TransformationContext) => {
        let visitor: ts.Visitor = (node: ts.Node): ts.Node => {
                if (ts.isCallExpression(node)) {
                    let transformed = tryTransformErrorsPush(node, ctx, visitor);

                    if (transformed) {
                        return transformed;
                    }
                }

                if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                    let transformed = tryTransformAssignment(node, ctx, visitor);

                    if (transformed) {
                        return transformed;
                    }
                }

                if (ts.isIdentifier(node) && node.text === ctx.valueParam) {
                    if (isLeftSideOfAssignment(node)) {
                        return ts.visitEachChild(node, visitor, context);
                    }

                    return createPropertyAccess(ctx.valueReplacement);
                }

                if (ts.isIdentifier(node) && node.text === ctx.errorsParam) {
                    return ts.factory.createIdentifier(ctx.errorsReplacement);
                }

                return ts.visitEachChild(node, visitor, context);
            };

        return (node: ts.Node) => ts.visitNode(node, visitor) as ts.Node;
    };
}

function isLeftSideOfAssignment(node: ts.Identifier): boolean {
    let parent = node.parent;

    if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        return parent.left === node;
    }

    return false;
}

function parseExpression(exprString: string): ts.Expression {
    let result: ts.Expression = ts.factory.createStringLiteral(''),
        sourceFile = createSourceFile('expr.ts', `const __expr = ${exprString}`);

    ts.forEachChild(sourceFile, (node) => {
        if (ts.isVariableStatement(node)) {
            let decl = node.declarationList.declarations[0];

            if (decl.initializer) {
                result = cloneExpression(decl.initializer);
            }
        }
    });

    return result;
}

function tryTransformAssignment(
    node: ts.BinaryExpression,
    ctx: TransformContext,
    visitor: ts.Visitor
): ts.BinaryExpression | null {
    if (!ts.isIdentifier(node.left) || node.left.text !== ctx.valueParam) {
        return null;
    }

    return ts.factory.createBinaryExpression(
        createPropertyAccess(ctx.valueReplacement),
        ts.SyntaxKind.EqualsToken,
        ts.visitNode(node.right, visitor) as ts.Expression
    );
}

function tryTransformErrorsPush(
    node: ts.CallExpression,
    ctx: TransformContext,
    visitor: ts.Visitor
): ts.CallExpression | null {
    let expr = node.expression;

    if (
        !ts.isPropertyAccessExpression(expr) ||
        !ts.isIdentifier(expr.expression) ||
        expr.name.text !== 'push' ||
        expr.expression.text !== ctx.errorsParam ||
        node.arguments.length === 0
    ) {
        return null;
    }

    let pathExpr: ts.Expression;

    if (ctx.pathExpression) {
        pathExpr = parseExpression(ctx.pathExpression);
    }
    else {
        pathExpr = ts.factory.createStringLiteral(ctx.propertyPath, true);
    }

    return ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(ctx.errorsReplacement),
            'push'
        ),
        undefined,
        [
            ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(
                    'message',
                    ts.visitNode(node.arguments[0], visitor) as ts.Expression
                ),
                ts.factory.createPropertyAssignment('path', pathExpr)
            ], false)
        ]
    );
}


const transformFunctionBody = (body: ts.Statement[], ctx: TransformContext): string => {
    let printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }),
        transformedStatements: string[] = [];

    for (let i = 0, n = body.length; i < n; i++) {
        let statement = body[i];

        transformedStatements.push(
            printer.printNode(
                ts.EmitHint.Unspecified,
                ts.transform(statement, [createTransformer(ctx)]).transformed[0] as ts.Statement,
                statement.getSourceFile()
            )
        );
    }

    return transformedStatements.join('\n');
};


export { transformFunctionBody };
export type { TransformContext };
