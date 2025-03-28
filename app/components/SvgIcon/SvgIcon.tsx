import React from 'react';

interface SVGIconProps {
  icon: React.ReactNode | string | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  onClick?: () => void;
}

/**
 * SVGIcon component - Renders SVG content regardless of import type
 * 
 * This component handles both React component SVGs and URL/string SVGs
 * making it compatible with different bundler configurations.
 * 
 * @param icon - The SVG to render (either a React component or a string URL)
 * @param className - Optional CSS class name
 * @param alt - Optional alt text for image SVGs (for accessibility)
 * @param width - Optional width
 * @param height - Optional height
 * @param onClick - Optional click handler
 */
const SVGIcon: React.FC<SVGIconProps> = ({ 
  icon, 
  className, 
  alt = "", 
  width,
  height,
  onClick
}) => {
  // Handle click events
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  // If icon is undefined or null, render nothing
  if (icon === undefined || icon === null) {
    return null;
  }

  // If icon is a React component (function or class)
  if (typeof icon === 'function') {
    const IconComponent = icon;
    return (
      <IconComponent 
        className={className} 
        width={width} 
        height={height} 
        onClick={onClick ? handleClick : undefined}
      />
    );
  }
  
  // If icon is a string (URL)
  if (typeof icon === 'string') {
    return (
      <img 
        src={icon} 
        className={className} 
        alt={alt} 
        width={width} 
        height={height} 
        onClick={onClick ? handleClick : undefined}
      />
    );
  }
  
  // If icon is a React element/node, render it directly
  // This handles JSX elements, fragments, etc.
  return (
    <span 
      className={className}
      onClick={onClick ? handleClick : undefined}
      style={{ display: 'inline-block', width, height }}
    >
      {icon}
    </span>
  );
};

export default SVGIcon;