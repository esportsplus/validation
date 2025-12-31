import ts from 'typescript';


const createSourceFile = (fileName: string, source: string): ts.SourceFile =>
    ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);

const extractSourceText = (node: { pos: number; end: number }, source: string): string =>
    source.substring(node.pos, node.end).trim();

const getPropertyName = (name: ts.PropertyName | undefined): string | null => {
    if (name && (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))) {
        return name.text;
    }

    return null;
};

const propertyAccess = (property: string, parentVar: string): string => {
    return property.split('.').reduce((acc, part) => `${acc}['${part}']`, parentVar);
};


export { createSourceFile, extractSourceText, getPropertyName, propertyAccess };
