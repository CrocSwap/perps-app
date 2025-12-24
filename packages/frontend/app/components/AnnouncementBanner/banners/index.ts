import React from 'react';

// Import all custom banner components here
import ExampleBanner from './ExampleBanner';
import FogoPresaleBanner from './FogoPresaleBanner';

/**
 * Registry of all available announcement banner components.
 *
 * To add a new banner:
 * 1. Create a new component in this directory (e.g., MyBanner.tsx)
 * 2. Import it above
 * 3. Add it to the registry below with a unique key
 * 4. Set VITE_ACTIVE_ANNOUNCEMENT_BANNER=<key> in your .env to activate it
 */
export const bannerRegistry: Record<string, React.ComponentType> = {
    example: ExampleBanner,
    // Add more banners here:
    fogoPresale: FogoPresaleBanner,
    // maintenance: MaintenanceBanner,
    // newFeature: NewFeatureBanner,
};

export type BannerKey = keyof typeof bannerRegistry;
