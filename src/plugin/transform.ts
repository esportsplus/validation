import { analyzeType } from './analyzer';
import { parseConfig } from './config';
import { detectBuildCalls, mightContainBuildCalls, type DetectedBuildCall } from './detect';
import { generateValidator } from './generator';
import { parseErrorMessages } from './generator/messages';
import { inlineValidators } from './inliner';


function generateValidatorForCall(
    call: DetectedBuildCall,
    sourceCode: string,
    fileName: string
): string {
    let { validators } = parseConfig(call.configSource),
        code = '';

    if (validators.size > 0) {
        let parts: string[] = [];

        for (let [propertyName, validatorSpec] of validators) {
            let result = inlineValidators({
                    fileName,
                    propertyName,
                    sourceCode,
                    validator: validatorSpec
                });

            if (result.code) {
                parts.push(result.code);
            }
        }

        code = parts.join('\n');
    }

    return generateValidator(
        analyzeType(call.typeParameter, sourceCode, fileName),
        { customMessages: parseErrorMessages(call.errorMessages) },
        code
    );
}


const transformValidatorBuild = (code: string, id: string): {
    code: string;
    detectedCalls: DetectedBuildCall[];
    transformed: boolean;
} => {
    if (!mightContainBuildCalls(code)) {
        return { code, detectedCalls: [], transformed: false };
    }

    let detectedCalls = detectBuildCalls(code, id);

    if (detectedCalls.length === 0) {
        return { code, detectedCalls: [], transformed: false };
    }

    let sortedCalls = [...detectedCalls].sort((a, b) => b.start - a.start),
        transformedCode = code;

    for (let i = 0, n = sortedCalls.length; i < n; i++) {
        let call = sortedCalls[i];

        try {
            transformedCode =
                transformedCode.substring(0, call.start) +
                generateValidatorForCall(call, code, id) +
                transformedCode.substring(call.end);
        }
        catch (error) {
            console.error(`@esportsplus/validation: plugin error transforming call in ${id}:`, error);
        }
    }

    return {
        code: transformedCode,
        detectedCalls,
        transformed: transformedCode !== code
    };
};


export { transformValidatorBuild };
