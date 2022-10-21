import { ErrorObject } from 'ajv';


type Response = {
    data: { [key: string]: any };
    messages: {
        errors: ErrorObject[];
        info: string[];
        success: string[];
        warning: string[];
    };
    success: boolean;
};


export { Response };