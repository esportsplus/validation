import { ErrorObject } from 'ajv';


type Response = {
    data: Record<string, any>;
    messages: {
        errors: ErrorObject[];
        info: string[];
        success: string[];
        warning: string[];
    };
    success: boolean;
};


export { Response };