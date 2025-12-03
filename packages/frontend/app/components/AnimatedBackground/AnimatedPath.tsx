import { useId } from 'react';

const AnimatedPath = ({
    color1 = '#1E1E24', // First color
    color2 = '#7371FC', // Second color
    color3 = '#CDC1FF', // Third color
    beamLength = 6, // Beam length parameter
    skew = 0.8,
    duration = '15s', // Default duration
    strokeWidth = '1', // Default stroke width
    className = '', // Allow custom className
}) => {
    // Use deterministic IDs to avoid SSR hydration mismatches
    const uid = useId();
    const gradientId1 = `gradient1-${uid}`;
    const gradientId2 = `gradient2-${uid}`;

    // Constructing the colors array using color1, color2, and color3
    const colors = [color1, color2, color3, color1];

    // Dynamically set stopOffsets1 based on beamLength
    const stopOffsets1 = [0, beamLength * skew, beamLength, beamLength].map(
        (offset) => `${offset}%`,
    );

    // Set stopOffsets2 with its values calculated based on beamLength
    const stopOffsets2 = [
        100 - beamLength,
        100 - beamLength * (1 - skew),
        100,
        100,
    ].map((offset) => `${offset}%`);

    return (
        <svg
            className={className}
            width='100%'
            height='100%'
            viewBox='0 0 1921 1024'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            preserveAspectRatio='xMidYMid slice'
            style={{
                width: '100%',
                height: '100%',
                minWidth: '100vw',
                minHeight: '100vh',
            }}
        >
            <defs>
                <linearGradient
                    id={gradientId1}
                    x1='-100%'
                    y1='0%'
                    x2='-100%'
                    y2='0%'
                >
                    {colors.map((color, index) => (
                        <stop
                            key={`1-${index}`}
                            offset={stopOffsets1[index]}
                            stopColor={color}
                        />
                    ))}
                    <animate
                        attributeName='x1'
                        from='-100%'
                        to='150%'
                        dur={duration}
                        begin='-14s'
                        fill='freeze'
                        repeatCount='indefinite'
                    />
                    <animate
                        attributeName='x2'
                        from='0%'
                        to='250%'
                        dur={duration}
                        begin='-14s'
                        fill='freeze'
                        repeatCount='indefinite'
                    />
                </linearGradient>
                <linearGradient
                    id={gradientId2}
                    x1='-100%'
                    y1='0%'
                    x2='-100%'
                    y2='0%'
                >
                    {colors.map((color, index) => (
                        <stop
                            key={`2-${index}`}
                            offset={stopOffsets2[index]}
                            stopColor={color}
                        />
                    ))}
                    <animate
                        attributeName='x1'
                        from='-100%'
                        to='150%'
                        dur={duration}
                        begin='-14s'
                        fill='freeze'
                        repeatCount='indefinite'
                    />
                    <animate
                        attributeName='x2'
                        from='0%'
                        to='250%'
                        dur={duration}
                        begin='-14s'
                        fill='freeze'
                        repeatCount='indefinite'
                    />
                </linearGradient>
            </defs>
            {/* New Path 1 */}
            <path
                d='M1 861.974C20.2138 857.484 39.0498 852.821 57.525 847.996C337.25 774.937 534.242 664.553 707.577 549.859C756.156 517.715 802.871 485.237 849.024 453.149C967.567 370.733 1082.41 290.892 1215.63 225.89C1397.68 137.056 1614.06 75.9527 1921 74'
                stroke={`url(#${gradientId1})`}
                strokeWidth={strokeWidth}
                fill='none'
            />
            {/* New Path 2 */}
            <path
                d='M1 949.832C204.025 917.266 397.943 867.942 584.27 813.465C700.861 779.377 814.477 743.273 925.495 707.993C932.237 705.851 938.97 703.711 945.693 701.575C1063.12 664.272 1177.65 628.091 1289.72 596.43C1508.39 534.652 1717.72 490.073 1921 487.939'
                stroke={`url(#${gradientId2})`}
                strokeWidth={strokeWidth}
                fill='none'
            />
        </svg>
    );
};

export default AnimatedPath;
