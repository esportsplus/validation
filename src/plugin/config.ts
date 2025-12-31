import ts from 'typescript';
import { createSourceFile, extractSourceText, getPropertyName } from '~/plugin/utilities';


function extractValidatorValue(initializer: ts.Expression, sourceCode: string): string | string[] | null {
    if (ts.isIdentifier(initializer)) {
        return initializer.text;
    }

    if (ts.isArrayLiteralExpression(initializer)) {
        let elements = initializer.elements,
            values: string[] = [];

        for (let i = 0, n = elements.length; i < n; i++) {
            let element = elements[i],
                value;

            if (ts.isIdentifier(element)) {
                value = element.text;
            }
            else {
                value = extractSourceText(element, sourceCode);
            }

            values.push(value);
        }

        return values.length > 0 ? values : null;
    }

    if (
        ts.isArrowFunction(initializer) ||
        ts.isCallExpression(initializer) ||
        ts.isFunctionExpression(initializer) ||
        ts.isPropertyAccessExpression(initializer)
    ) {
        return extractSourceText(initializer, sourceCode);
    }

    return null;
}


const parseConfig = (configSource: string | undefined) => {
    let validators = new Map<string, string | string[]>();

    if (!configSource) {
        return { validators };
    }

    let trimmed = configSource.trim();

    if (!trimmed) {
        return { validators };
    }

    let wrappedSource = `const __config = ${trimmed}`,
        sourceFile = createSourceFile('config.ts', wrappedSource);

    function visit(node: ts.Node): void {
        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text === '__config' &&
            node.initializer &&
            ts.isObjectLiteralExpression(node.initializer)
        ) {
            let properties = node.initializer.properties;

            for (let i = 0, n = properties.length; i < n; i++) {
                let prop = properties[i];

                if (ts.isPropertyAssignment(prop)) {
                    let key = getPropertyName(prop.name);

                    if (key) {
                        let value = extractValidatorValue(prop.initializer, wrappedSource);

                        if (value) {
                            validators.set(key, value);
                        }
                    }
                }

                if (ts.isShorthandPropertyAssignment(prop)) {
                    let validator = prop.name.text;

                    validators.set(validator, validator);
                }
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return { validators };
};


export { parseConfig };
