import { useEffect, useRef, useState } from 'react';

export function useVersionCheck() {
    const [showReload, setShowReload] = useState(false);
    const currentVersion = useRef(null);

    // const isProduction = process.env.CONTEXT === 'production';
    const isDeployPreview = import.meta.env.VITE_CONTEXT === 'deploy-preview';
    const isBranchDeploy = import.meta.env.VITE_CONTEXT === 'branch-deploy';

    useEffect(() => {
        fetch('/version.json', { cache: 'no-store' })
            .then((res) => res.json())
            .then((data) => {
                currentVersion.current = data.version;
            });

        const interval = setInterval(
            () => {
                fetch('/version.json', { cache: 'no-store' })
                    .then((res) => res.json())
                    .then((data) => {
                        if (
                            currentVersion.current &&
                            data.version !== currentVersion.current
                        ) {
                            currentVersion.current = data.version; // reset baseline to allow user to dismiss reload prompt
                            setShowReload(true);
                        }
                    });
            },
            // check every 30 seconds in deploy preview or branch-deploy and every 5 minutes elsewhere
            isDeployPreview || isBranchDeploy ? 30 * 1000 : 5 * 60 * 1000,
        );

        return () => clearInterval(interval);
    }, []);

    return { showReload, setShowReload };
}
