import { useSearchParams } from 'react-router';

// directory for all URL params recognized by the app
export const URL_PARAMS = {
    referralCode: 'af',
};

// string-union type of all URL params
type URL_PARAM_STRINGS = (typeof URL_PARAMS)[keyof typeof URL_PARAMS];

// interface for the return value of the hook
export interface UrlParamMethodsIF {
    value: string | null;
    set(value: string): void;
}

export function useUrlParams(key: URL_PARAM_STRINGS): UrlParamMethodsIF {
    const [searchParams, setSearchParams] = useSearchParams();
    return {
        value: searchParams.get(key),
        set(value: string): void {
            const newParams: URLSearchParams = new URLSearchParams(
                searchParams,
            );
            newParams.set(key, value);
            setSearchParams(newParams);
        },
    };
}
