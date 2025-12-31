import ts from 'typescript';
import { createSourceFile, getPropertyName } from '~/plugin/utilities';


function visitNode(node: ts.TypeNode, pathParts: string[], messages: Map<string, string>): void {
    // String literal - this is a message
    if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) {
        messages.set(pathParts.join('.'), node.literal.text);
    }
    // Nested object - recurse into members
    else if (ts.isTypeLiteralNode(node)) {
        let members = node.members;

        for (let i = 0, n = members.length; i < n; i++) {
            let member = members[i];

            if (ts.isPropertySignature(member) && member.type) {
                let key = getPropertyName(member.name);

                if (key) {
                    visitNode(member.type, [...pathParts, key], messages);
                }
            }
        }
    }
    // Array type - recurse into element type with [*] marker
    else if (ts.isArrayTypeNode(node)) {
        visitNode(node.elementType, [...pathParts, '[*]'], messages);
    }
}


const parseErrorMessages = (errorMessagesSource: string | undefined): Map<string, string> => {
    let messages = new Map<string, string>();

    if (!errorMessagesSource?.trim()) {
        return messages;
    }

    let sourceFile = createSourceFile('messages.ts', `type T = ${errorMessagesSource.trim()}`);

    function visit(node: ts.Node): void {
        if (ts.isTypeLiteralNode(node)) {
            visitNode(node, [], messages);
            return;
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return messages;
};


export { parseErrorMessages };
