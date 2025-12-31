import type { Plugin } from 'vite';
import { mightContainBuildCalls } from './detect';
import { transformValidatorBuild } from './transform';


const plugin = (): Plugin => {
    return {
        enforce: 'pre',
        name: 'validation-transform',
        transform(code: string, id: string) {
            if (!id.match(/\.[tj]sx?$/) || !mightContainBuildCalls(code)) {
                return null;
            }

            let result = transformValidatorBuild(code, id);

            if (result.detectedCalls.length === 0) {
                return null;
            }

            return {
                code: result.code,
                map: null
            };
        }
    };
};


export { plugin };
export { analyzeType, type AnalyzedProperty, type AnalyzedType } from './analyzer';
export { detectBuildCalls, mightContainBuildCalls, type DetectedBuildCall } from './detect';
export { transformValidatorBuild } from './transform';
