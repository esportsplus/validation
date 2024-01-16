import { ErrorMessage, ErrorMethod } from '~/types';


let types: Record<PropertyKey, unknown> = {
        array: 'items',
        integer: '',
        float: '',
        number: '',
        string: 'characters'
    };


export default (number: number, error?: ErrorMessage): ErrorMethod => {
    if (!error) {
        error = (_, type) => {
            return `must be less than ${number} ${types[type] || ''}`;
        };
    }

    return [
        (type: string, variable: string) => {
            if (type in types === false) {
                throw new Error(`Validation: '${type}' is not supported by 'max' statement`);
            }

            return `${variable}${type === 'number' ? '' : '.length'} > ${number}`;
        },
        error
    ];
};