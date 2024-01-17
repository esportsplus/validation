import { ErrorMessage, ErrorMethod } from '~/types';


export default (value: boolean | null | number | string | undefined, error?: ErrorMessage): ErrorMethod => {
    let escaped = value;

    if (typeof value === 'string') {
        escaped = `\`${value}\``;
    }

    return [
        (_: string, variable: string) => {
            return `${variable} == ${escaped}`;
        },
        error || `must equal ${value}`
    ];
};