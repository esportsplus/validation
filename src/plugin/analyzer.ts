import ts from 'typescript';
import { createSourceFile, getPropertyName } from '~/plugin/utilities';


interface AnalyzedProperty {
    itemType?: AnalyzedProperty;
    name: string;
    optional: boolean;
    properties?: AnalyzedProperty[];
    type: 'array' | 'boolean' | 'float' | 'integer' | 'number' | 'object' | 'string' | 'unknown';
}

interface AnalyzedType {
    name: string;
    properties: AnalyzedProperty[];
}


function analyzeInlineType(
    typeSource: string,
    fullSourceCode: string,
    fileName: string
): AnalyzedType {
    let wrappedSource = `type __Inline = ${typeSource}`,
        properties: AnalyzedProperty[] = [],
        sourceFile = createSourceFile(fileName, wrappedSource);

    ts.forEachChild(sourceFile, (node) => {
        if (ts.isTypeAliasDeclaration(node) && node.name.text === '__Inline') {
            if (ts.isTypeLiteralNode(node.type)) {
                properties = extractPropertiesFromTypeLiteral(node.type, fullSourceCode, fileName);
            }
        }
    });

    return {
        name: 'anonymous',
        properties
    };
}

function analyzePropertySignature(
    member: ts.PropertySignature,
    fullSourceCode: string,
    fileName: string
): AnalyzedProperty | null {
    let name = getPropertyName(member.name);

    if (!name) {
        return null;
    }

    let optional = member.questionToken !== undefined;

    if (!member.type) {
        return { name, optional, type: 'unknown' };
    }

    return analyzeTypeNode(name, member.type, optional, fullSourceCode, fileName);
}

function analyzeReferencedType(
    typeName: string,
    fullSourceCode: string,
    fileName: string
): AnalyzedType {
    let found = false,
        properties: AnalyzedProperty[] = [],
        sourceFile = createSourceFile(fileName, fullSourceCode);

    function visit(node: ts.Node): void {
        if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
            properties = extractPropertiesFromMembers(node.members, fullSourceCode, fileName);
            found = true;
            return;
        }

        if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
            if (ts.isTypeLiteralNode(node.type)) {
                properties = extractPropertiesFromTypeLiteral(node.type, fullSourceCode, fileName);
                found = true;
                return;
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (!found) {
        return {
            name: typeName,
            properties: []
        };
    }

    return {
        name: typeName,
        properties
    };
}

function analyzeTypeNode(
    name: string,
    typeNode: ts.TypeNode,
    optional: boolean,
    fullSourceCode: string,
    fileName: string
): AnalyzedProperty {
    if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
        return { name, optional, type: 'string' };
    }

    if (typeNode.kind === ts.SyntaxKind.NumberKeyword) {
        return { name, optional, type: 'number' };
    }

    if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
        return { name, optional, type: 'boolean' };
    }

    if (ts.isArrayTypeNode(typeNode)) {
        return {
            itemType: analyzeTypeNode('item', typeNode.elementType, false, fullSourceCode, fileName),
            name,
            optional,
            type: 'array'
        };
    }

    if (ts.isTypeReferenceNode(typeNode)) {
        let typeName = getTypeReferenceName(typeNode),
            lowerTypeName = typeName.toLowerCase();

        if (lowerTypeName === 'integer') {
            return { name, optional, type: 'integer' };
        }

        if (lowerTypeName === 'float') {
            return { name, optional, type: 'float' };
        }

        if (typeName === 'Array' && typeNode.typeArguments && typeNode.typeArguments.length > 0) {
            return {
                itemType: analyzeTypeNode('item', typeNode.typeArguments[0], false, fullSourceCode, fileName),
                name,
                optional,
                type: 'array'
            };
        }

        let resolved = analyzeReferencedType(typeName, fullSourceCode, fileName);

        if (resolved.properties.length > 0) {
            return {
                name,
                optional,
                properties: resolved.properties,
                type: 'object'
            };
        }

        return { name, optional, type: 'unknown' };
    }

    if (ts.isTypeLiteralNode(typeNode)) {
        return {
            name,
            optional,
            properties: extractPropertiesFromTypeLiteral(typeNode, fullSourceCode, fileName),
            type: 'object'
        };
    }

    return { name, optional, type: 'unknown' };
}

function extractPropertiesFromMembers(
    members: ts.NodeArray<ts.TypeElement>,
    fullSourceCode: string,
    fileName: string
): AnalyzedProperty[] {
    let properties: AnalyzedProperty[] = [];

    for (let i = 0, n = members.length; i < n; i++) {
        let member = members[i];

        if (ts.isPropertySignature(member) && member.name) {
            let property = analyzePropertySignature(member, fullSourceCode, fileName);

            if (property) {
                properties.push(property);
            }
        }
    }

    return properties;
}

function extractPropertiesFromTypeLiteral(
    typeLiteral: ts.TypeLiteralNode,
    fullSourceCode: string,
    fileName: string
): AnalyzedProperty[] {
    return extractPropertiesFromMembers(typeLiteral.members, fullSourceCode, fileName);
}

function getTypeReferenceName(typeRef: ts.TypeReferenceNode): string {
    if (ts.isIdentifier(typeRef.typeName)) {
        return typeRef.typeName.text;
    }

    if (ts.isQualifiedName(typeRef.typeName)) {
        return typeRef.typeName.right.text;
    }

    return '';
}


const analyzeType = (
    typeSource: string,
    fullSourceCode: string,
    fileName: string
): AnalyzedType => {
    let trimmed = typeSource.trim();

    if (trimmed.startsWith('{')) {
        return analyzeInlineType(trimmed, fullSourceCode, fileName);
    }

    return analyzeReferencedType(trimmed, fullSourceCode, fileName);
};


export { analyzeType };
export type { AnalyzedProperty, AnalyzedType };
