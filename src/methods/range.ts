import { ErrorMessage, ErrorMethod } from '~/types';


const types: Record<PropertyKey, unknown> = {
        array: 'items',
        integer: '',
        float: '',
        number: '',
        string: 'characters'
    };


export default (min: number, max: number, error?: ErrorMessage): ErrorMethod => {
    return [
        (type: string, variable: string) => {
            if (type in types === false) {
                throw new Error(`Validation: '${type}' is not supported by 'range' statement`);
            }

            return `${variable}${type === 'number' ? '' : '.length'} >= ${min} && ${variable}${type === 'number' ? '' : '.length'} <= ${max}`;
        },
        error || ((_, type) => {
            return `must be between ${min} and ${max} ${types[type] || ''}`;
        })
    ];
};
export { types };