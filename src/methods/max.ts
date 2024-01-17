import { ErrorMessage, ErrorMethod } from '~/types';
import { types } from './range';


export default (number: number, error?: ErrorMessage): ErrorMethod => {
    return [
        (type: string, variable: string) => {
            if (type in types === false) {
                throw new Error(`Validation: '${type}' is not supported by 'max' statement`);
            }

            return `${variable}${type === 'number' ? '' : '.length'} <= ${number}`;
        },
        error || ((_, type) => {
            return `must be less than ${number} ${types[type] || ''}`;
        })
    ];
};