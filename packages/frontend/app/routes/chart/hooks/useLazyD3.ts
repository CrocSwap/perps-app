import { useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedLibs: { d3: any; d3fc: any } | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadingPromise: Promise<{ d3: any; d3fc: any }> | null = null;

export function useLazyD3() {
    const [libs, setLibs] = useState<typeof cachedLibs>(cachedLibs);

    useEffect(() => {
        if (cachedLibs) {
            setLibs(cachedLibs);
            return;
        }

        if (!loadingPromise) {
            loadingPromise = (async () => {
                const [d3, d3fc] = await Promise.all([
                    import('d3'),
                    import('d3fc'),
                ]);
                cachedLibs = { d3, d3fc };
                return cachedLibs;
            })();
        }

        loadingPromise.then((libs) => {
            setLibs(libs);
        });
    }, []);

    return libs;
}
