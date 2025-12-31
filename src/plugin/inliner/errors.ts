class ValidationCompileError extends Error {
    column: number;
    fileName: string;
    functionName: string;
    line: number;
    pattern: string;


    constructor(
        pattern: string,
        functionName: string,
        fileName: string,
        line: number,
        column: number
    ) {
        super(`@esportsplus/validation: cannot inline function '${functionName}' - uses unsupported pattern '${pattern}'`);
        this.column = column;
        this.fileName = fileName;
        this.functionName = functionName;
        this.line = line;
        this.name = 'ValidationCompileError';
        this.pattern = pattern;
    }


    toString(): string {
        return `@esportsplus/validation: ValidationCompileError: ${this.message}\n  at ${this.fileName}:${this.line}:${this.column}`;
    }
}


export { ValidationCompileError };
