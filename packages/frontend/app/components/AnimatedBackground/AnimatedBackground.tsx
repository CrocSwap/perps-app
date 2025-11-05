import styles from './AnimatedBackground.module.css';
import AnimatedPath from '../Home/Hero/AnimatedPath';

type Props = {
    /** absolute = contained by parent; fixed = spans the viewport across scroll */
    mode?: 'absolute' | 'fixed';
    /** stack index relative to page content */
    zIndex?: number;
    /** opacity for the whole background */
    opacity?: number;
    /** pass different color sets for variety */
    palette?: {
        color1: string;
        color2: string;
        color3: string;
    };
    /** animation speed and line thickness */
    duration?: string;
    strokeWidth?: string;
    /** optionally render extra layers for depth */
    layers?: 1 | 2 | 3;
    /** className passthrough so pages can tweak transforms/opacity */
    className?: string;
};

export default function AnimatedBackground({
    mode = 'absolute',
    zIndex = -1,
    opacity = 1,
    palette = { color1: '#1E1E24', color2: '#7371FC', color3: '#CDC1FF' },
    duration = '15s',
    strokeWidth = '2',
    layers = 1,
    className,
}: Props) {
    const wrapClass = [
        styles.animated_background,
        mode === 'fixed' ? styles.fixed : styles.absolute,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={wrapClass}
            style={{ zIndex, opacity }}
            aria-hidden='true'
        >
            {/* Primary */}
            <AnimatedPath
                className={styles.animated_path_primary}
                color1={palette.color1}
                color2={palette.color2}
                color3={palette.color3}
                beamLength={8}
                skew={0.8}
                strokeWidth={strokeWidth}
                duration={duration}
            />
            {/* Optional extra layers */}
            {layers >= 2 && (
                <AnimatedPath
                    className={styles.animated_path_secondary}
                    color1={shade(palette.color1, 0.05)}
                    color2={shade(palette.color2, -0.05)}
                    color3={shade(palette.color3, -0.08)}
                    beamLength={6}
                    skew={0.9}
                    strokeWidth='1.5'
                    duration={duration}
                />
            )}
            {layers >= 3 && (
                <AnimatedPath
                    className={styles.animated_path_tertiary}
                    color1={shade(palette.color1, -0.1)}
                    color2={shade(palette.color2, 0.1)}
                    color3={shade(palette.color3, 0.12)}
                    beamLength={10}
                    skew={0.7}
                    strokeWidth='1'
                    duration={duration}
                />
            )}
        </div>
    );
}

/** tiny util to nudge colors lighter/darker without pulling a lib */
function shade(hex: string, amt: number) {
    const clamp = (n: number) => Math.max(0, Math.min(255, n));
    const to = (v: number) =>
        clamp(Math.round(v + (amt >= 0 ? (255 - v) * amt : v * amt)));
    const [, r, g, b] = hex
        .replace('#', '')
        .match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i) || [
        '',
        '1E',
        '1E',
        '24',
    ];
    const R = to(parseInt(r, 16));
    const G = to(parseInt(g, 16));
    const B = to(parseInt(b, 16));
    return `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(
        2,
        '0',
    )}${B.toString(16).padStart(2, '0')}`;
}
