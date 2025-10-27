// ============================================================================
// SHARED TYPES FOR ALL PRESETS
// ============================================================================

export interface Dot {
    // Current position and movement
    x: number;
    y: number;

    // Visual properties
    size: number;
    targetSize: number;
    opacity: number;
    targetOpacity: number;
    color: string;

    presetData?: Record<string, any>;

    isStatic?: boolean; // Skip updates for static dots
    distanceToTarget?: number; // Cache distance during transitions
}

export interface PresetPosition {
    x: number;
    y: number;
    opacity: number;
    size: number;
    color: string;
    presetData?: Record<string, any>;
}

export interface PresetInitialPositions {
    [dotIndex: number]: PresetPosition;
}

export interface CenterPosition {
    x: number;
    y: number;
}

// Standard interface that all preset modules must implement
/**
 * Standard interface that all preset modules must implement
 */
export interface PresetModule {
    calculatePositions(
        width: number,
        height: number,
        center: CenterPosition,
        responsive: ResponsiveConfig,
    ): PresetInitialPositions;
    initializeMovement(
        dots: Dot[],
        positions: PresetInitialPositions,
        width: number,
        height: number,
        center: CenterPosition,
        responsive: ResponsiveConfig,
    ): void;
    update(
        dots: Dot[],
        width: number,
        height: number,
        center: CenterPosition,
        responsive: ResponsiveConfig,
        refs?: PresetRefs,
    ): void;
}

/**
 * Type-safe refs object for preset-specific state
 */
export interface PresetRefs {
    [key: string]: any;
}

// ============================================================================
// RESPONSIVE CONFIGURATION
// ============================================================================

/**
 * Responsive configuration based on device type and screen size
 */
export interface ResponsiveConfig {
    isMobile: boolean;
    isTablet: boolean;
    scaleFactor: number; // 0.5 for mobile, 0.75 for tablet, 1.0 for desktop
    dotCount: number;
    gridDensity: number; // Multiplier for grid columns/rows
    containerSize: number; // Size of animation container for presets 2-5 (e.g., 500px desktop, 300px mobile)
    containerAlignment: 'left' | 'center' | 'right'; // Horizontal alignment of container
}

/**
 * Create responsive configuration based on screen dimensions and device detection
 * Uses proper mobile detection via media queries rather than just screen width
 */
export function createResponsiveConfig(
    width: number,
    height: number,
    isMobileDevice: boolean,
): ResponsiveConfig {
    const minDimension = Math.min(width, height);

    // Use proper mobile detection first, then fall back to dimension checks for tablets
    const isMobile = isMobileDevice;
    const isTablet = !isMobile && minDimension >= 768 && minDimension < 1024;

    // Mobile: 280px, Tablet: 400px, Desktop: 500px
    const containerSize = isMobile ? 380 : isTablet ? 400 : 500;

    return {
        isMobile,
        isTablet,
        scaleFactor: isMobile ? 0.5 : isTablet ? 0.75 : 1.0,
        dotCount: isMobile ? 1024 : isTablet ? 2048 : 4096,
        gridDensity: isMobile ? 0.5 : isTablet ? 0.75 : 1.0,
        containerSize,
        containerAlignment: 'right',
    };
}

// ============================================================================
// SHARED CONSTANTS
// ============================================================================

export const LERP_SPEED_SLOW = 0.01;
export const LERP_SPEED_MEDIUM = 0.02;
export const LERP_SPEED_TRANSITION = 0.02;

// Color Constants - Used across all presets for consistent theming
export const COLORS = {
    PRIMARY: '#f0f0f8', // Single dot color - all variations achieved through opacity
} as const;

// Time and Animation Constants
export const ANIMATION_SPEED = 0.5; // Global animation speed multiplier
export const TWO_PI = Math.PI * 2; // Commonly used constant

// Probability Constants
export const RADIUS_CHANGE_PROBABILITY = 0.002; // Probability per frame that a dot changes its target radius within a pool
